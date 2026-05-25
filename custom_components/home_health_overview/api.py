"""HTTP API for Home Health Overview panel actions."""

from __future__ import annotations

from typing import Any

from aiohttp import web

from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant

from .const import (
    CONF_IGNORE_DEVICES,
    CONF_IGNORE_ENTITIES,
    CONF_INCLUDE_ENTITIES,
    DOMAIN,
)
from .coordinator import _parse_entity_list

API_REGISTERED = "api_registered"


def async_register_api(hass: HomeAssistant) -> None:
    """Register Home Health API views once."""
    domain_data = hass.data.setdefault(DOMAIN, {})
    if domain_data.get(API_REGISTERED):
        return
    hass.http.register_view(HomeHealthConfigView())
    domain_data[API_REGISTERED] = True


class HomeHealthConfigView(HomeAssistantView):
    """Update Home Health include/ignore options from the panel."""

    url = "/api/home_health_overview/config"
    name = "api:home_health_overview:config"
    requires_auth = True

    async def post(self, request):
        """Handle a panel config action."""
        hass = request.app["hass"]
        payload = await request.json()
        entity_id = str(payload.get("entity_id", "")).strip()
        action = str(payload.get("action", "")).strip()

        if not entity_id or action not in {
            "ignore",
            "ignore_device",
            "monitor",
            "unignore",
            "unignore_device",
            "unmonitor",
        }:
            return web.json_response(
                {"success": False, "error": "invalid_request"},
                status=400,
            )

        entries = hass.config_entries.async_entries(DOMAIN)
        if not entries:
            return web.json_response(
                {"success": False, "error": "not_configured"},
                status=404,
            )
        entry = entries[0]
        options: dict[str, Any] = {**entry.data, **entry.options}

        include_entities = _parse_entity_list(options.get(CONF_INCLUDE_ENTITIES))
        ignore_entities = _parse_entity_list(options.get(CONF_IGNORE_ENTITIES))
        ignore_devices = _parse_entity_list(options.get(CONF_IGNORE_DEVICES))

        if action == "ignore":
            ignore_entities = _add_item(ignore_entities, entity_id)
            include_entities = _remove_item(include_entities, entity_id)
        elif action == "ignore_device":
            ignore_devices = _add_item(ignore_devices, entity_id)
        elif action == "monitor":
            include_entities = _add_item(include_entities, entity_id)
            ignore_entities = _remove_item(ignore_entities, entity_id)
        elif action == "unignore":
            ignore_entities = _remove_item(ignore_entities, entity_id)
        elif action == "unignore_device":
            ignore_devices = _remove_item(ignore_devices, entity_id)
        elif action == "unmonitor":
            include_entities = _remove_item(include_entities, entity_id)

        options[CONF_INCLUDE_ENTITIES] = include_entities
        options[CONF_IGNORE_ENTITIES] = ignore_entities
        options[CONF_IGNORE_DEVICES] = ignore_devices

        hass.config_entries.async_update_entry(entry, options=options)
        coordinator = getattr(entry, "runtime_data", None)
        if coordinator is not None:
            await coordinator.async_request_refresh()
        return web.json_response(
            {
                "success": True,
                "include_entities": include_entities,
                "ignore_entities": ignore_entities,
                "ignore_devices": ignore_devices,
            }
        )


def _add_item(values: list[str], item: str) -> list[str]:
    """Add an item while preserving order."""
    return values if item in values else [*values, item]


def _remove_item(values: list[str], item: str) -> list[str]:
    """Remove an item."""
    return [value for value in values if value != item]
