"""Coordinator for Home Health Overview."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
import logging
from statistics import mean, median
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator

from .const import (
    CONF_API_ENTITIES,
    CONF_CRITICAL_BATTERY_THRESHOLD,
    CONF_LOW_BATTERY_THRESHOLD,
    CONF_STALE_HOURS,
    CONF_TEMPERATURE_OUTLIER_DELTA,
    DEFAULT_API_ENTITIES,
    DEFAULT_CRITICAL_BATTERY_THRESHOLD,
    DEFAULT_LOW_BATTERY_THRESHOLD,
    DEFAULT_SCAN_INTERVAL,
    DEFAULT_STALE_HOURS,
    DEFAULT_TEMPERATURE_OUTLIER_DELTA,
    DOMAIN,
    IGNORED_OFFLINE_PREFIXES,
    IGNORED_STALE_PREFIXES,
)

LOGGER = logging.getLogger(__name__)


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
        api_entities = _parse_entity_list(
            settings.get(CONF_API_ENTITIES, DEFAULT_API_ENTITIES)
        )

        states = list(self.hass.states.async_all())
        offline_entities = [
            state.entity_id
            for state in states
            if state.state in {"unavailable", "unknown"}
            and not _starts_with(state.entity_id, IGNORED_OFFLINE_PREFIXES)
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
        for state in states:
            if _starts_with(state.entity_id, IGNORED_STALE_PREFIXES):
                continue
            if state.state in {"unavailable", "unknown"}:
                continue
            age = now - state.last_updated
            if age > timedelta(hours=stale_hours):
                stale_entities.append(state.entity_id)

        temperature_entities = [
            (state.entity_id, _float_or_none(state.state))
            for state in states
            if state.entity_id.startswith("sensor.")
            and state.attributes.get("device_class") == "temperature"
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

        score = max(
            100
            - len(offline_entities) * 8
            - len(critical_battery_entities) * 6
            - len(low_battery_entities) * 3
            - len(stale_entities) * 2
            - len(api_offline_entities) * 10
            - len(temp_outliers) * 3,
            0,
        )

        return {
            "score": score,
            "offline_entities": offline_entities,
            "low_battery_entities": low_battery_entities,
            "critical_battery_entities": critical_battery_entities,
            "stale_entities": stale_entities,
            "temperature_median": temp_median,
            "temperature_average": temp_average,
            "temperature_outliers": temp_outliers,
            "api_offline_entities": api_offline_entities,
            "critical": score < 70
            or bool(offline_entities)
            or bool(api_offline_entities),
            "warning": score < 90
            or bool(low_battery_entities)
            or bool(stale_entities),
        }


def _parse_entity_list(value: str | list[str] | tuple[str, ...] | None) -> list[str]:
    """Parse a comma-separated entity list."""
    if value is None:
        return []
    if isinstance(value, str):
        return [item.strip() for item in value.split(",") if item.strip()]
    return [item.strip() for item in value if item.strip()]


def _float_or_none(value: Any) -> float | None:
    """Return a float if possible."""
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _starts_with(value: str, prefixes: tuple[str, ...]) -> bool:
    """Return whether value starts with one of the prefixes."""
    return any(value.startswith(prefix) for prefix in prefixes)
