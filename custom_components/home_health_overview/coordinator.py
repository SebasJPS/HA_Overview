"""Coordinator for Home Health Overview."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
import logging
import re
from statistics import mean, median
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import UnitOfTemperature
from homeassistant.core import HomeAssistant
from homeassistant.helpers import area_registry as ar
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator

from .const import (
    CONF_ADDON_ENTITIES,
    CONF_API_ENTITIES,
    CONF_CPU_WARNING_THRESHOLD,
    CONF_CRITICAL_BATTERY_THRESHOLD,
    CONF_IGNORE_DEVICES,
    CONF_IGNORE_ENTITIES,
    CONF_IGNORE_PREFIXES,
    CONF_INCLUDE_ENTITIES,
    CONF_LINKQUALITY_THRESHOLD,
    CONF_LOW_BATTERY_THRESHOLD,
    CONF_MEMORY_WARNING_THRESHOLD,
    CONF_PANEL_STYLE,
    CONF_STALE_HOURS,
    CONF_STORAGE_WARNING_THRESHOLD,
    CONF_SYSTEM_RESOURCE_ENTITIES,
    CONF_TEMPERATURE_OUTLIER_DELTA,
    DEFAULT_ADDON_ENTITIES,
    DEFAULT_API_ENTITIES,
    DEFAULT_CPU_WARNING_THRESHOLD,
    DEFAULT_CRITICAL_BATTERY_THRESHOLD,
    DEFAULT_IGNORE_DEVICES,
    DEFAULT_IGNORE_ENTITIES,
    DEFAULT_IGNORE_PREFIXES,
    DEFAULT_INCLUDE_ENTITIES,
    DEFAULT_LINKQUALITY_THRESHOLD,
    DEFAULT_LOW_BATTERY_THRESHOLD,
    DEFAULT_MEMORY_WARNING_THRESHOLD,
    DEFAULT_PANEL_STYLE,
    DEFAULT_SCAN_INTERVAL,
    DEFAULT_STALE_HOURS,
    DEFAULT_STORAGE_WARNING_THRESHOLD,
    DEFAULT_SYSTEM_RESOURCE_ENTITIES,
    DEFAULT_TEMPERATURE_OUTLIER_DELTA,
    DOMAIN,
    IGNORED_OFFLINE_PREFIXES,
    IGNORED_STALE_PREFIXES,
)

LOGGER = logging.getLogger(__name__)
MAX_DETAIL_ITEMS = 100


class HomeHealthCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """Collect Home Assistant health data."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        """Initialize the coordinator."""
        super().__init__(
            hass,
            logger=LOGGER,
            name=DOMAIN,
            update_interval=DEFAULT_SCAN_INTERVAL,
        )
        self.entry = entry

    @property
    def settings(self) -> dict[str, Any]:
        """Return merged config and options."""
        return {**self.entry.data, **self.entry.options}

    async def _async_update_data(self) -> dict[str, Any]:
        """Fetch current health data from Home Assistant state machine."""
        settings = self.settings
        stale_hours = int(settings.get(CONF_STALE_HOURS, DEFAULT_STALE_HOURS))
        low_battery = float(
            settings.get(CONF_LOW_BATTERY_THRESHOLD, DEFAULT_LOW_BATTERY_THRESHOLD)
        )
        critical_battery = float(
            settings.get(
                CONF_CRITICAL_BATTERY_THRESHOLD, DEFAULT_CRITICAL_BATTERY_THRESHOLD
            )
        )
        temp_delta = float(
            settings.get(
                CONF_TEMPERATURE_OUTLIER_DELTA, DEFAULT_TEMPERATURE_OUTLIER_DELTA
            )
        )
        linkquality_threshold = float(
            settings.get(CONF_LINKQUALITY_THRESHOLD, DEFAULT_LINKQUALITY_THRESHOLD)
        )
        cpu_threshold = float(
            settings.get(CONF_CPU_WARNING_THRESHOLD, DEFAULT_CPU_WARNING_THRESHOLD)
        )
        memory_threshold = float(
            settings.get(
                CONF_MEMORY_WARNING_THRESHOLD,
                DEFAULT_MEMORY_WARNING_THRESHOLD,
            )
        )
        storage_threshold = float(
            settings.get(
                CONF_STORAGE_WARNING_THRESHOLD,
                DEFAULT_STORAGE_WARNING_THRESHOLD,
            )
        )
        api_entities = _parse_entity_list(
            settings.get(CONF_API_ENTITIES, DEFAULT_API_ENTITIES)
        )
        addon_entities = _parse_entity_list(
            settings.get(CONF_ADDON_ENTITIES, DEFAULT_ADDON_ENTITIES)
        )
        system_resource_watchlist = _parse_entity_list(
            settings.get(
                CONF_SYSTEM_RESOURCE_ENTITIES,
                DEFAULT_SYSTEM_RESOURCE_ENTITIES,
            )
        )
        include_entities = _parse_entity_list(
            settings.get(CONF_INCLUDE_ENTITIES, DEFAULT_INCLUDE_ENTITIES)
        )
        ignore_entities = set(
            _parse_entity_list(settings.get(CONF_IGNORE_ENTITIES, DEFAULT_IGNORE_ENTITIES))
        )
        ignore_devices = set(
            _parse_entity_list(settings.get(CONF_IGNORE_DEVICES, DEFAULT_IGNORE_DEVICES))
        )
        ignore_prefixes = tuple(
            _parse_entity_list(settings.get(CONF_IGNORE_PREFIXES, DEFAULT_IGNORE_PREFIXES))
        )
        entity_registry = er.async_get(self.hass)
        device_registry = dr.async_get(self.hass)
        area_registry = ar.async_get(self.hass)

        states = [
            state
            for state in self.hass.states.async_all()
            if not _is_ignored_state(
                state.entity_id,
                entity_registry,
                ignore_entities,
                ignore_devices,
                ignore_prefixes,
            )
            or state.entity_id in include_entities
        ]
        monitored_states = [
            state
            for state in states
            if (
                state.entity_id in include_entities
                or (
                    not _starts_with(state.entity_id, IGNORED_STALE_PREFIXES)
                    and not state.entity_id.startswith(f"sensor.{DOMAIN}_")
                    and not state.entity_id.startswith(f"binary_sensor.{DOMAIN}_")
                )
            )
        ]
        for entity_id in include_entities:
            state = self.hass.states.get(entity_id)
            if state is not None and state not in monitored_states:
                monitored_states.append(state)
        offline_eligible_states = [
            state
            for state in monitored_states
            if not _starts_with(state.entity_id, IGNORED_OFFLINE_PREFIXES)
        ]
        offline_device_details = _offline_device_details(
            offline_eligible_states,
            entity_registry,
            device_registry,
            area_registry,
        )
        offline_device_ids = {
            device["device_id"] for device in offline_device_details
        }
        offline_entities = [
            state.entity_id
            for state in offline_eligible_states
            if state.state in {"unavailable", "unknown"}
            and _device_id_for_entity(entity_registry, state.entity_id)
            not in offline_device_ids
        ]

        battery_entities = [
            (state.entity_id, _float_or_none(state.state))
            for state in states
            if state.entity_id.startswith("sensor.")
            and state.attributes.get("device_class") == "battery"
        ]
        low_battery_entities = [
            entity_id
            for entity_id, value in battery_entities
            if value is not None and value < low_battery
        ]
        critical_battery_entities = [
            entity_id
            for entity_id, value in battery_entities
            if value is not None and value < critical_battery
        ]

        stale_entities = []
        now = datetime.now(timezone.utc)
        for state in monitored_states:
            if state.state in {"unavailable", "unknown"}:
                continue
            if not _should_check_staleness(state, include_entities):
                continue
            age = now - state.last_updated
            if age > timedelta(hours=stale_hours):
                stale_entities.append(state.entity_id)

        temperature_entities = [
            (state.entity_id, _temperature_celsius(state))
            for state in states
            if _is_temperature_sensor(state)
        ]
        temperatures = [
            value for _, value in temperature_entities if value is not None
        ]
        temp_median = round(median(temperatures), 1) if temperatures else None
        temp_average = round(mean(temperatures), 1) if temperatures else None
        temp_outliers = []
        if temp_median is not None:
            temp_outliers = [
                entity_id
                for entity_id, value in temperature_entities
                if value is not None and abs(value - temp_median) > temp_delta
            ]

        api_offline_entities = [
            entity_id
            for entity_id in api_entities
            if (state := self.hass.states.get(entity_id)) is None
            or state.state in {"off", "unavailable", "unknown"}
        ]
        zigbee_linkquality_entities = [
            (state.entity_id, _float_or_none(state.state))
            for state in states
            if _is_linkquality_sensor(state)
        ]
        zigbee_linkquality_low_entities = [
            entity_id
            for entity_id, value in zigbee_linkquality_entities
            if value is not None and value < linkquality_threshold
        ]
        zigbee_bridge_entities = [
            state.entity_id
            for state in states
            if _is_zigbee_bridge_entity(state)
        ]
        zigbee_bridge_problem_entities = [
            entity_id
            for entity_id in zigbee_bridge_entities
            if (state := self.hass.states.get(entity_id)) is not None
            and _is_problem_state(state.state)
        ]
        mqtt_entities = [
            state.entity_id
            for state in states
            if "mqtt" in state.entity_id.lower()
            or "mqtt" in str(state.attributes.get("friendly_name", "")).lower()
        ]
        addon_watchlist_entities = _dedupe(addon_entities + zigbee_bridge_entities)
        addon_problem_entities = [
            entity_id
            for entity_id in addon_watchlist_entities
            if (state := self.hass.states.get(entity_id)) is None
            or _is_problem_state(state.state)
        ]
        system_resources = _detect_system_resources(
            states,
            system_resource_watchlist,
        )
        system_resource_problem_entities = [
            resource["entity_id"]
            for resource in system_resources
            if _is_system_resource_problem(
                resource,
                cpu_threshold,
                memory_threshold,
                storage_threshold,
            )
        ]
        update_entities = [
            state.entity_id for state in states if state.entity_id.startswith("update.")
        ]
        update_available_entities = [
            state.entity_id
            for state in states
            if state.entity_id.startswith("update.") and _is_update_available(state)
        ]
        offline_details = _entity_details(
            self.hass,
            entity_registry,
            device_registry,
            area_registry,
            offline_entities,
        )
        low_battery_details = _entity_details(
            self.hass,
            entity_registry,
            device_registry,
            area_registry,
            low_battery_entities,
        )
        critical_battery_details = _entity_details(
            self.hass,
            entity_registry,
            device_registry,
            area_registry,
            critical_battery_entities,
        )
        stale_details = _entity_details(
            self.hass,
            entity_registry,
            device_registry,
            area_registry,
            stale_entities,
            extra_fn=lambda state: _stale_extra(state, stale_hours, now),
        )
        temperature_outlier_details = _entity_details(
            self.hass,
            entity_registry,
            device_registry,
            area_registry,
            temp_outliers,
            extra_fn=lambda state: {
                "median": temp_median,
                "temperature_celsius": _temperature_celsius(state),
                "difference": round(_temperature_celsius(state) - temp_median, 1)
                if temp_median is not None and _temperature_celsius(state) is not None
                else None,
            },
        )
        api_offline_details = _entity_details(
            self.hass,
            entity_registry,
            device_registry,
            area_registry,
            api_offline_entities,
        )
        zigbee_linkquality_low_details = _entity_details(
            self.hass,
            entity_registry,
            device_registry,
            area_registry,
            zigbee_linkquality_low_entities,
            extra_fn=lambda state: {
                "threshold": linkquality_threshold,
                "linkquality": _float_or_none(state.state),
            },
        )
        addon_problem_details = _entity_details(
            self.hass,
            entity_registry,
            device_registry,
            area_registry,
            addon_problem_entities,
        )
        system_resource_problem_details = _entity_details(
            self.hass,
            entity_registry,
            device_registry,
            area_registry,
            system_resource_problem_entities,
            extra_fn=lambda state: _system_resource_extra(
                state,
                system_resources,
                cpu_threshold,
                memory_threshold,
                storage_threshold,
            ),
        )
        update_available_details = _entity_details(
            self.hass,
            entity_registry,
            device_registry,
            area_registry,
            update_available_entities,
            extra_fn=_update_extra,
        )
        issue_groups = {
            "offline": offline_details + offline_device_details,
            "low_battery": low_battery_details,
            "critical_battery": critical_battery_details,
            "temperature_outliers": temperature_outlier_details,
            "zigbee_linkquality_low": zigbee_linkquality_low_details,
            "stale": [
                detail
                for detail in stale_details
                if float(detail.get("problem_duration_hours") or 0) >= 24
            ],
        }
        device_health_details = _device_health_details(
            monitored_states,
            entity_registry,
            device_registry,
            area_registry,
            issue_groups,
        )
        problem_device_details = [
            device for device in device_health_details if device["problem_count"]
        ]
        all_problem_details = [
            detail for details in issue_groups.values() for detail in details
        ]
        duration_penalty = _duration_penalty(all_problem_details)
        source_status = {
            "mqtt_entities_found": len(mqtt_entities),
            "zigbee2mqtt_entities_found": len(
                [
                    state
                    for state in states
                    if "zigbee2mqtt" in state.entity_id.lower()
                    or "zigbee2mqtt"
                    in str(state.attributes.get("friendly_name", "")).lower()
                ]
            ),
            "zigbee_linkquality_sensors_found": len(zigbee_linkquality_entities),
            "zigbee_bridge_entities_found": len(zigbee_bridge_entities),
            "addon_watchlist_entities_found": len(addon_watchlist_entities),
            "supervisor_entities_found": len(
                [
                    state
                    for state in states
                    if "supervisor" in state.entity_id.lower()
                    or "addon" in state.entity_id.lower()
                    or "add_on" in state.entity_id.lower()
                ]
            ),
            "system_resource_entities_found": len(system_resources),
            "update_entities_found": len(update_entities),
            "explicitly_included_entities": len(include_entities),
            "ignored_entities": len(ignore_entities),
            "ignored_devices": len(ignore_devices),
            "ignored_prefixes": len(ignore_prefixes),
        }
        panel_style = str(settings.get(CONF_PANEL_STYLE, DEFAULT_PANEL_STYLE))

        offline_issue_count = len(offline_entities) + len(offline_device_details)
        score, score_breakdown = _calculate_score(
            total_entities=len(monitored_states),
            offline_count=offline_issue_count,
            stale_count=len(stale_entities),
            battery_count=len(battery_entities),
            low_battery_count=len(low_battery_entities),
            critical_battery_count=len(critical_battery_entities),
            temperature_count=len(temperatures),
            temperature_outlier_count=len(temp_outliers),
            api_count=len(api_entities),
            api_offline_count=len(api_offline_entities),
            zigbee_linkquality_count=len(zigbee_linkquality_entities),
            zigbee_linkquality_low_count=len(zigbee_linkquality_low_entities),
            addon_count=len(addon_watchlist_entities),
            addon_problem_count=len(addon_problem_entities),
            system_resource_count=len(system_resources),
            system_resource_problem_count=len(system_resource_problem_entities),
            update_count=len(update_entities),
            update_available_count=len(update_available_entities),
            device_count=len(device_health_details),
            device_problem_count=len(problem_device_details),
            duration_penalty=duration_penalty,
        )

        return {
            "score": score,
            "score_breakdown": score_breakdown,
            "total_monitored_entities": len(monitored_states),
            "total_battery_entities": len(battery_entities),
            "total_temperature_entities": len(temperatures),
            "total_api_entities": len(api_entities),
            "total_zigbee_linkquality_entities": len(zigbee_linkquality_entities),
            "total_addon_watchlist_entities": len(addon_watchlist_entities),
            "total_system_resource_entities": len(system_resources),
            "total_devices": len(device_health_details),
            "total_problem_devices": len(problem_device_details),
            "duration_penalty": duration_penalty,
            "include_entities": include_entities,
            "ignore_entities": sorted(ignore_entities),
            "ignore_devices": sorted(ignore_devices),
            "ignore_prefixes": list(ignore_prefixes),
            "panel_style": panel_style,
            "source_status": source_status,
            "offline_entities": offline_entities,
            "offline_details": offline_details,
            "offline_devices": [device["device_id"] for device in offline_device_details],
            "offline_device_details": offline_device_details,
            "low_battery_entities": low_battery_entities,
            "low_battery_details": low_battery_details,
            "critical_battery_entities": critical_battery_entities,
            "critical_battery_details": critical_battery_details,
            "stale_entities": stale_entities,
            "stale_details": stale_details,
            "temperature_median": temp_median,
            "temperature_average": temp_average,
            "temperature_outliers": temp_outliers,
            "temperature_outlier_details": temperature_outlier_details,
            "api_offline_entities": api_offline_entities,
            "api_offline_details": api_offline_details,
            "zigbee_linkquality_low_entities": zigbee_linkquality_low_entities,
            "zigbee_linkquality_low_details": zigbee_linkquality_low_details,
            "addon_problem_entities": addon_problem_entities,
            "addon_problem_details": addon_problem_details,
            "system_resource_problem_entities": system_resource_problem_entities,
            "system_resource_problem_details": system_resource_problem_details,
            "update_available_entities": update_available_entities,
            "update_available_details": update_available_details,
            "device_health_details": device_health_details[:MAX_DETAIL_ITEMS],
            "problem_device_details": problem_device_details[:MAX_DETAIL_ITEMS],
            "critical": score < 60 or bool(critical_battery_entities),
            "warning": score < 90
            or bool(offline_entities)
            or bool(offline_device_details)
            or bool(api_offline_entities)
            or bool(low_battery_entities)
            or bool(zigbee_linkquality_low_entities)
            or bool(addon_problem_entities)
            or bool(system_resource_problem_entities)
            or bool(update_available_entities)
            or bool(stale_entities),
        }


def _parse_entity_list(value: str | list[str] | tuple[str, ...] | None) -> list[str]:
    """Parse a comma- or newline-separated entity list."""
    if value is None:
        return []
    if isinstance(value, str):
        return [item.strip() for item in re.split(r"[,\n]+", value) if item.strip()]
    return [str(item).strip() for item in value if str(item).strip()]


def _float_or_none(value: Any) -> float | None:
    """Return a float if possible."""
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _starts_with(value: str, prefixes: tuple[str, ...]) -> bool:
    """Return whether value starts with one of the prefixes."""
    return any(value.startswith(prefix) for prefix in prefixes)


def _is_ignored_entity(
    entity_id: str,
    ignored_entities: set[str],
    ignored_prefixes: tuple[str, ...],
) -> bool:
    """Return whether an entity should be ignored by user settings."""
    return entity_id in ignored_entities or _starts_with(entity_id, ignored_prefixes)


def _is_ignored_state(
    entity_id: str,
    entity_registry: er.EntityRegistry,
    ignored_entities: set[str],
    ignored_devices: set[str],
    ignored_prefixes: tuple[str, ...],
) -> bool:
    """Return whether a state should be ignored by entity or device settings."""
    if _is_ignored_entity(entity_id, ignored_entities, ignored_prefixes):
        return True
    device_id = _device_id_for_entity(entity_registry, entity_id)
    return bool(device_id and device_id in ignored_devices)


def _device_id_for_entity(
    entity_registry: er.EntityRegistry,
    entity_id: str,
) -> str | None:
    """Return the Home Assistant device ID for an entity."""
    entity_entry = entity_registry.async_get(entity_id)
    return entity_entry.device_id if entity_entry else None


def _is_temperature_sensor(state: Any) -> bool:
    """Return whether a state looks like a temperature sensor."""
    if not state.entity_id.startswith("sensor."):
        return False
    if state.attributes.get("device_class") == "temperature":
        return True
    unit = state.attributes.get("unit_of_measurement")
    return unit in {
        UnitOfTemperature.CELSIUS,
        UnitOfTemperature.FAHRENHEIT,
        "°C",
        "°F",
        "C",
        "F",
    }


def _temperature_celsius(state: Any) -> float | None:
    """Return a temperature state normalized to Celsius."""
    value = _float_or_none(state.state)
    if value is None:
        return None
    unit = state.attributes.get("unit_of_measurement")
    if unit in {UnitOfTemperature.FAHRENHEIT, "°F", "F"}:
        return round((value - 32) * 5 / 9, 1)
    return value


def _should_check_staleness(state: Any, include_entities: list[str]) -> bool:
    """Return whether stale checks are meaningful for this state."""
    if state.entity_id in include_entities:
        return True
    if not state.entity_id.startswith("sensor."):
        return False
    device_class = state.attributes.get("device_class")
    return device_class not in {
        "battery",
        "date",
        "enum",
        "timestamp",
    }


def _is_linkquality_sensor(state: Any) -> bool:
    """Return whether a state looks like a Zigbee linkquality/LQI sensor."""
    if not state.entity_id.startswith("sensor."):
        return False
    entity_id = state.entity_id.lower()
    name = str(state.attributes.get("friendly_name", "")).lower()
    return any(token in entity_id or token in name for token in ("linkquality", "lqi"))


def _is_zigbee_bridge_entity(state: Any) -> bool:
    """Return whether a state looks like a Zigbee2MQTT/MQTT bridge status entity."""
    entity_id = state.entity_id.lower()
    name = str(state.attributes.get("friendly_name", "")).lower()
    haystack = f"{entity_id} {name}"
    return (
        "zigbee2mqtt" in haystack
        and any(token in haystack for token in ("bridge", "state", "status", "connection"))
    ) or (
        "mqtt" in haystack and any(token in haystack for token in ("bridge", "state", "status"))
    )


def _is_problem_state(value: str) -> bool:
    """Return whether an entity state represents a problem."""
    normalized = str(value).lower()
    return normalized in {
        "off",
        "offline",
        "unavailable",
        "unknown",
        "error",
        "failed",
        "stopped",
        "not_running",
        "disconnected",
        "false",
    }


def _is_update_available(state: Any) -> bool:
    """Return whether a Home Assistant update entity has an update available."""
    return str(state.state).lower() == "on"


def _update_extra(state: Any) -> dict[str, Any]:
    """Return update version details for an update entity."""
    return {
        "installed_version": state.attributes.get("installed_version"),
        "latest_version": state.attributes.get("latest_version"),
        "release_summary": state.attributes.get("release_summary"),
        "release_url": state.attributes.get("release_url"),
    }


def _stale_extra(state: Any, stale_hours: int, now: datetime) -> dict[str, Any]:
    """Return stale-specific duration details."""
    issue_started = state.last_updated + timedelta(hours=stale_hours)
    duration_seconds = max(int((now - issue_started).total_seconds()), 0)
    return {
        "stale_threshold_hours": stale_hours,
        "problem_since": issue_started.isoformat(),
        "problem_duration_seconds": duration_seconds,
        "problem_duration_hours": round(duration_seconds / 3600, 1),
    }


def _dedupe(values: list[str]) -> list[str]:
    """Return values without duplicates while keeping order."""
    seen = set()
    result = []
    for value in values:
        if value in seen:
            continue
        seen.add(value)
        result.append(value)
    return result


def _detect_system_resources(
    states: list[Any],
    watchlist: list[str],
) -> list[dict[str, Any]]:
    """Detect CPU, memory, and storage usage entities."""
    resources: list[dict[str, Any]] = []
    watchlist_set = set(watchlist)
    for state in states:
        resource_type = _system_resource_type(state)
        if state.entity_id in watchlist_set and resource_type is None:
            resource_type = "resource"
        if resource_type is None:
            continue
        value = _normalize_percent_usage(state, resource_type)
        if value is None:
            continue
        resources.append(
            {
                "entity_id": state.entity_id,
                "type": resource_type,
                "value": value,
            }
        )
    return resources


def _system_resource_type(state: Any) -> str | None:
    """Return system resource type for common HA system monitor sensors."""
    if not state.entity_id.startswith("sensor."):
        return None
    haystack = (
        f"{state.entity_id} {state.attributes.get('friendly_name', '')}"
    ).lower()
    unit = str(state.attributes.get("unit_of_measurement", "")).lower()
    if any(token in haystack for token in ("processor_use", "cpu_usage", "cpu use", "cpu_used", "cpu load", "processor use")):
        return "cpu"
    if "cpu" in haystack and unit == "%":
        return "cpu"
    if any(token in haystack for token in ("memory_use_percent", "memory usage", "memory used", "ram usage", "ram use", "memory_use")):
        return "memory"
    if ("memory" in haystack or "ram" in haystack) and unit == "%":
        return "memory"
    if any(token in haystack for token in ("disk_use_percent", "disk usage", "storage usage", "data_disk_used", "disk use")):
        return "storage"
    if any(token in haystack for token in ("disk", "storage")) and unit == "%":
        return "storage"
    return None


def _normalize_percent_usage(state: Any, resource_type: str) -> float | None:
    """Return resource usage as a percentage where possible."""
    value = _float_or_none(state.state)
    if value is None:
        return None
    unit = str(state.attributes.get("unit_of_measurement", "")).lower()
    if unit == "%" or resource_type in {"cpu", "memory", "storage", "resource"}:
        return value
    return None


def _is_system_resource_problem(
    resource: dict[str, Any],
    cpu_threshold: float,
    memory_threshold: float,
    storage_threshold: float,
) -> bool:
    """Return whether a resource exceeds its configured threshold."""
    threshold = _resource_threshold(
        resource["type"],
        cpu_threshold,
        memory_threshold,
        storage_threshold,
    )
    return float(resource["value"]) >= threshold


def _system_resource_extra(
    state: Any,
    resources: list[dict[str, Any]],
    cpu_threshold: float,
    memory_threshold: float,
    storage_threshold: float,
) -> dict[str, Any]:
    """Return resource details for an entity."""
    resource = next(
        (item for item in resources if item["entity_id"] == state.entity_id),
        None,
    )
    resource_type = resource["type"] if resource else "resource"
    threshold = _resource_threshold(
        resource_type,
        cpu_threshold,
        memory_threshold,
        storage_threshold,
    )
    return {
        "resource_type": resource_type,
        "usage": resource["value"] if resource else _float_or_none(state.state),
        "threshold": threshold,
    }


def _resource_threshold(
    resource_type: str,
    cpu_threshold: float,
    memory_threshold: float,
    storage_threshold: float,
) -> float:
    """Return the threshold for a resource type."""
    if resource_type == "cpu":
        return cpu_threshold
    if resource_type == "memory":
        return memory_threshold
    if resource_type == "storage":
        return storage_threshold
    return max(cpu_threshold, memory_threshold, storage_threshold)


def _calculate_score(
    *,
    total_entities: int,
    offline_count: int,
    stale_count: int,
    battery_count: int,
    low_battery_count: int,
    critical_battery_count: int,
    temperature_count: int,
    temperature_outlier_count: int,
    api_count: int,
    api_offline_count: int,
    zigbee_linkquality_count: int,
    zigbee_linkquality_low_count: int,
    addon_count: int,
    addon_problem_count: int,
    system_resource_count: int,
    system_resource_problem_count: int,
    update_count: int,
    update_available_count: int,
    device_count: int,
    device_problem_count: int,
    duration_penalty: int,
) -> tuple[int, dict[str, Any]]:
    """Calculate a weighted health score from all available health categories."""
    components = []
    availability_score = _ratio_score(total_entities, offline_count)
    components.append(
        {
            "key": "availability",
            "label": "Availability",
            "weight": 35,
            "score": availability_score,
            "affected": offline_count,
            "total": total_entities,
        }
    )

    freshness_score = _ratio_score(total_entities, stale_count)
    components.append(
        {
            "key": "freshness",
            "label": "Freshness",
            "weight": 20,
            "score": freshness_score,
            "affected": stale_count,
            "total": total_entities,
        }
    )

    if battery_count:
        warning_battery_count = max(low_battery_count - critical_battery_count, 0)
        battery_penalty = (
            (warning_battery_count / battery_count) * 50
            + (critical_battery_count / battery_count) * 100
        )
        components.append(
            {
                "key": "battery",
                "label": "Battery",
                "weight": 20,
                "score": round(max(100 - battery_penalty, 0), 1),
                "affected": low_battery_count,
                "warning": warning_battery_count,
                "critical": critical_battery_count,
                "total": battery_count,
            }
        )

    if temperature_count:
        components.append(
            {
                "key": "temperature",
                "label": "Temperature",
                "weight": 15,
                "score": _ratio_score(temperature_count, temperature_outlier_count),
                "affected": temperature_outlier_count,
                "total": temperature_count,
            }
        )

    if api_count:
        components.append(
            {
                "key": "api",
                "label": "APIs",
                "weight": 10,
                "score": _ratio_score(api_count, api_offline_count),
                "affected": api_offline_count,
                "total": api_count,
            }
        )

    if zigbee_linkquality_count:
        components.append(
            {
                "key": "zigbee",
                "label": "Zigbee",
                "weight": 10,
                "score": _ratio_score(
                    zigbee_linkquality_count,
                    zigbee_linkquality_low_count,
                ),
                "affected": zigbee_linkquality_low_count,
                "total": zigbee_linkquality_count,
            }
        )

    if addon_count:
        components.append(
            {
                "key": "addons",
                "label": "Add-ons / Bridges",
                "weight": 10,
                "score": _ratio_score(addon_count, addon_problem_count),
                "affected": addon_problem_count,
                "total": addon_count,
            }
        )

    if system_resource_count:
        components.append(
            {
                "key": "system_resources",
                "label": "System resources",
                "weight": 15,
                "score": _ratio_score(
                    system_resource_count,
                    system_resource_problem_count,
                ),
                "affected": system_resource_problem_count,
                "total": system_resource_count,
            }
        )

    if update_count:
        components.append(
            {
                "key": "updates",
                "label": "Updates",
                "weight": 5,
                "score": _ratio_score(update_count, update_available_count),
                "affected": update_available_count,
                "total": update_count,
            }
        )

    if device_count:
        components.append(
            {
                "key": "devices",
                "label": "Devices",
                "weight": 15,
                "score": _ratio_score(device_count, device_problem_count),
                "affected": device_problem_count,
                "total": device_count,
            }
        )

    total_weight = sum(component["weight"] for component in components)
    if not total_weight:
        return 100, {"components": [], "method": "weighted_average"}

    score = round(
        sum(component["score"] * component["weight"] for component in components)
        / total_weight
    ) - duration_penalty
    return max(min(score, 100), 0), {
        "method": "weighted_average",
        "duration_penalty": duration_penalty,
        "components": components,
    }


def _ratio_score(total: int, affected: int) -> float:
    """Return a 0-100 score based on the affected ratio."""
    if total <= 0:
        return 100
    return round(max(100 - (affected / total) * 100, 0), 1)


def _offline_device_details(
    states: list[Any],
    entity_registry: er.EntityRegistry,
    device_registry: dr.DeviceRegistry,
    area_registry: ar.AreaRegistry,
) -> list[dict[str, Any]]:
    """Return devices where all monitored entities are unavailable or unknown."""
    by_device: dict[str, list[Any]] = {}
    for state in states:
        device_id = _device_id_for_entity(entity_registry, state.entity_id)
        if not device_id:
            continue
        by_device.setdefault(device_id, []).append(state)

    details = []
    for device_id, device_states in by_device.items():
        if len(device_states) < 2:
            continue
        if any(state.state not in {"unavailable", "unknown"} for state in device_states):
            continue

        device_entry = device_registry.async_get(device_id)
        area_entry = (
            area_registry.async_get_area(device_entry.area_id)
            if device_entry and device_entry.area_id
            else None
        )
        details.append(
            {
                "type": "device",
                "device_id": device_id,
                "name": _device_name(device_entry) or device_id,
                "state": "unavailable",
                "area": area_entry.name if area_entry else None,
                "device": _device_name(device_entry),
                "entity_count": len(device_states),
                "unavailable_count": len(device_states),
                "entity_ids": sorted(state.entity_id for state in device_states),
                "last_updated": max(
                    state.last_updated for state in device_states
                ).isoformat(),
                "last_changed": max(
                    state.last_changed for state in device_states
                ).isoformat(),
                **_duration_attrs(
                    min(state.last_changed for state in device_states),
                    datetime.now(timezone.utc),
                ),
            }
        )
    return sorted(details, key=lambda item: (item["area"] or "", item["name"]))


def _entity_details(
    hass: HomeAssistant,
    entity_registry: er.EntityRegistry,
    device_registry: dr.DeviceRegistry,
    area_registry: ar.AreaRegistry,
    entity_ids: list[str],
    extra_fn: Any | None = None,
) -> list[dict[str, Any]]:
    """Return display details for entities."""
    details = []
    now = datetime.now(timezone.utc)
    for entity_id in entity_ids[:MAX_DETAIL_ITEMS]:
        state = hass.states.get(entity_id)
        entity_entry = entity_registry.async_get(entity_id)
        device_entry = (
            device_registry.async_get(entity_entry.device_id)
            if entity_entry and entity_entry.device_id
            else None
        )
        area_id = None
        if entity_entry and entity_entry.area_id:
            area_id = entity_entry.area_id
        elif device_entry and device_entry.area_id:
            area_id = device_entry.area_id
        area_entry = area_registry.async_get_area(area_id) if area_id else None

        item = {
            "type": "entity",
            "entity_id": entity_id,
            "name": state.name if state else entity_id,
            "state": state.state if state else "missing",
            "area": area_entry.name if area_entry else None,
            "device": _device_name(device_entry),
            "device_id": entity_entry.device_id if entity_entry else None,
            "last_updated": state.last_updated.isoformat() if state else None,
            "last_changed": state.last_changed.isoformat() if state else None,
        }
        if state:
            item.update(_duration_attrs(state.last_changed, now))
        if state and extra_fn:
            item.update(extra_fn(state))
        details.append(item)
    return details


def _duration_attrs(issue_since: datetime, now: datetime) -> dict[str, Any]:
    """Return normalized problem duration attributes."""
    duration_seconds = max(int((now - issue_since).total_seconds()), 0)
    return {
        "problem_since": issue_since.isoformat(),
        "problem_duration_seconds": duration_seconds,
        "problem_duration_hours": round(duration_seconds / 3600, 1),
    }


def _duration_penalty(details: list[dict[str, Any]]) -> int:
    """Return a small global penalty for long-standing problems."""
    if not details:
        return 0
    longest_hours = max(
        (float(detail.get("problem_duration_hours") or 0) for detail in details),
        default=0,
    )
    if longest_hours >= 168:
        return 10
    if longest_hours >= 72:
        return 7
    if longest_hours >= 24:
        return 4
    if longest_hours >= 6:
        return 2
    return 0


def _device_health_details(
    states: list[Any],
    entity_registry: er.EntityRegistry,
    device_registry: dr.DeviceRegistry,
    area_registry: ar.AreaRegistry,
    issue_groups: dict[str, list[dict[str, Any]]],
) -> list[dict[str, Any]]:
    """Return aggregated health details per Home Assistant device."""
    devices: dict[str, dict[str, Any]] = {}
    for state in states:
        device_id = _device_id_for_entity(entity_registry, state.entity_id)
        if not device_id:
            continue
        device_entry = device_registry.async_get(device_id)
        area_entry = (
            area_registry.async_get_area(device_entry.area_id)
            if device_entry and device_entry.area_id
            else None
        )
        item = devices.setdefault(
            device_id,
            {
                "type": "device_health",
                "device_id": device_id,
                "name": _device_name(device_entry) or device_id,
                "area": area_entry.name if area_entry else None,
                "entity_count": 0,
                "problem_count": 0,
                "score": 100,
                "issues": [],
                "issue_categories": {},
                "longest_problem_duration_hours": 0,
            },
        )
        item["entity_count"] += 1

    for category, details in issue_groups.items():
        for detail in details:
            device_id = detail.get("device_id")
            if detail.get("type") == "device":
                device_id = detail.get("device_id")
            if not device_id or device_id not in devices:
                continue
            item = devices[device_id]
            severity = _device_issue_severity(category)
            item["problem_count"] += 1
            item["issue_categories"][category] = (
                item["issue_categories"].get(category, 0) + 1
            )
            item["issues"].append(
                {
                    "category": category,
                    "entity_id": detail.get("entity_id"),
                    "name": detail.get("name"),
                    "state": detail.get("state"),
                    "severity": severity,
                    "problem_duration_hours": detail.get("problem_duration_hours", 0),
                }
            )
            item["longest_problem_duration_hours"] = max(
                item["longest_problem_duration_hours"],
                float(detail.get("problem_duration_hours") or 0),
            )
            item["score"] = max(item["score"] - severity, 0)

    return sorted(
        devices.values(),
        key=lambda item: (item["score"], item["area"] or "", item["name"]),
    )


def _device_issue_severity(category: str) -> int:
    """Return device-level penalty by issue category."""
    return {
        "offline": 45,
        "critical_battery": 35,
        "zigbee_linkquality_low": 20,
        "low_battery": 15,
        "stale": 12,
        "temperature_outliers": 10,
    }.get(category, 10)


def _device_name(device_entry: dr.DeviceEntry | None) -> str | None:
    """Return a human-friendly device name."""
    if device_entry is None:
        return None
    return device_entry.name_by_user or device_entry.name
