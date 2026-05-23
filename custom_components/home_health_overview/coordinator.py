"""Coordinator for Home Health Overview."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
import logging
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
    CONF_LINKQUALITY_THRESHOLD,
    CONF_LOW_BATTERY_THRESHOLD,
    CONF_MEMORY_WARNING_THRESHOLD,
    CONF_STALE_HOURS,
    CONF_STORAGE_WARNING_THRESHOLD,
    CONF_SYSTEM_RESOURCE_ENTITIES,
    CONF_TEMPERATURE_OUTLIER_DELTA,
    DEFAULT_ADDON_ENTITIES,
    DEFAULT_API_ENTITIES,
    DEFAULT_CPU_WARNING_THRESHOLD,
    DEFAULT_CRITICAL_BATTERY_THRESHOLD,
    DEFAULT_LINKQUALITY_THRESHOLD,
    DEFAULT_LOW_BATTERY_THRESHOLD,
    DEFAULT_MEMORY_WARNING_THRESHOLD,
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
        entity_registry = er.async_get(self.hass)
        device_registry = dr.async_get(self.hass)
        area_registry = ar.async_get(self.hass)

        states = list(self.hass.states.async_all())
        monitored_states = [
            state
            for state in states
            if not _starts_with(state.entity_id, IGNORED_STALE_PREFIXES)
            and not state.entity_id.startswith(f"sensor.{DOMAIN}_")
            and not state.entity_id.startswith(f"binary_sensor.{DOMAIN}_")
        ]
        offline_entities = [
            state.entity_id
            for state in monitored_states
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
        for state in monitored_states:
            if state.state in {"unavailable", "unknown"}:
                continue
            age = now - state.last_updated
            if age > timedelta(hours=stale_hours):
                stale_entities.append(state.entity_id)

        temperature_entities = [
            (state.entity_id, _float_or_none(state.state))
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
        )
        temperature_outlier_details = _entity_details(
            self.hass,
            entity_registry,
            device_registry,
            area_registry,
            temp_outliers,
            extra_fn=lambda state: {
                "median": temp_median,
                "difference": round(float(state.state) - temp_median, 1)
                if temp_median is not None and _float_or_none(state.state) is not None
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
        }

        score, score_breakdown = _calculate_score(
            total_entities=len(monitored_states),
            offline_count=len(offline_entities),
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
            "source_status": source_status,
            "offline_entities": offline_entities,
            "offline_details": offline_details,
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
            "critical": score < 60 or bool(critical_battery_entities),
            "warning": score < 90
            or bool(offline_entities)
            or bool(api_offline_entities)
            or bool(low_battery_entities)
            or bool(zigbee_linkquality_low_entities)
            or bool(addon_problem_entities)
            or bool(system_resource_problem_entities)
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
        battery_penalty = (
            (low_battery_count / battery_count) * 50
            + (critical_battery_count / battery_count) * 50
        )
        components.append(
            {
                "key": "battery",
                "label": "Battery",
                "weight": 20,
                "score": round(max(100 - battery_penalty, 0), 1),
                "affected": low_battery_count,
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

    total_weight = sum(component["weight"] for component in components)
    if not total_weight:
        return 100, {"components": [], "method": "weighted_average"}

    score = round(
        sum(component["score"] * component["weight"] for component in components)
        / total_weight
    )
    return max(min(score, 100), 0), {
        "method": "weighted_average",
        "components": components,
    }


def _ratio_score(total: int, affected: int) -> float:
    """Return a 0-100 score based on the affected ratio."""
    if total <= 0:
        return 100
    return round(max(100 - (affected / total) * 100, 0), 1)


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
            "entity_id": entity_id,
            "name": state.name if state else entity_id,
            "state": state.state if state else "missing",
            "area": area_entry.name if area_entry else None,
            "device": _device_name(device_entry),
            "last_updated": state.last_updated.isoformat() if state else None,
            "last_changed": state.last_changed.isoformat() if state else None,
        }
        if state and extra_fn:
            item.update(extra_fn(state))
        details.append(item)
    return details


def _device_name(device_entry: dr.DeviceEntry | None) -> str | None:
    """Return a human-friendly device name."""
    if device_entry is None:
        return None
    return device_entry.name_by_user or device_entry.name
