"""Sensors for Home Health Overview."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable

from homeassistant.components.sensor import SensorEntity, SensorEntityDescription
from homeassistant.const import PERCENTAGE, UnitOfTemperature
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from . import HomeHealthConfigEntry
from .const import DOMAIN
from .coordinator import HomeHealthCoordinator


@dataclass(frozen=True, kw_only=True)
class HomeHealthSensorDescription(SensorEntityDescription):
    """Description for a Home Health sensor."""

    value_fn: Callable[[dict[str, Any]], Any]
    attrs_fn: Callable[[dict[str, Any]], dict[str, Any]] | None = None


SENSORS: tuple[HomeHealthSensorDescription, ...] = (
    HomeHealthSensorDescription(
        key="score",
        translation_key="score",
        icon="mdi:heart-pulse",
        native_unit_of_measurement=PERCENTAGE,
        value_fn=lambda data: data["score"],
        attrs_fn=lambda data: {
            "breakdown": data["score_breakdown"],
            "total_monitored_entities": data["total_monitored_entities"],
            "total_battery_entities": data["total_battery_entities"],
            "total_temperature_entities": data["total_temperature_entities"],
            "total_api_entities": data["total_api_entities"],
            "total_zigbee_linkquality_entities": data[
                "total_zigbee_linkquality_entities"
            ],
            "total_addon_watchlist_entities": data["total_addon_watchlist_entities"],
            "total_system_resource_entities": data["total_system_resource_entities"],
            "include_entities": data["include_entities"],
            "ignore_entities": data["ignore_entities"],
            "ignore_prefixes": data["ignore_prefixes"],
            "source_status": data["source_status"],
            "temperature_median": data["temperature_median"],
            "temperature_average": data["temperature_average"],
            "categories": {
                "offline": {
                    "count": len(data["offline_entities"]),
                    "details": data["offline_details"],
                },
                "stale": {
                    "count": len(data["stale_entities"]),
                    "details": data["stale_details"],
                },
                "low_battery": {
                    "count": len(data["low_battery_entities"]),
                    "details": data["low_battery_details"],
                },
                "critical_battery": {
                    "count": len(data["critical_battery_entities"]),
                    "details": data["critical_battery_details"],
                },
                "temperature_outliers": {
                    "count": len(data["temperature_outliers"]),
                    "details": data["temperature_outlier_details"],
                },
                "apis_offline": {
                    "count": len(data["api_offline_entities"]),
                    "details": data["api_offline_details"],
                },
                "zigbee_linkquality_low": {
                    "count": len(data["zigbee_linkquality_low_entities"]),
                    "details": data["zigbee_linkquality_low_details"],
                },
                "addon_problems": {
                    "count": len(data["addon_problem_entities"]),
                    "details": data["addon_problem_details"],
                },
                "system_resource_problems": {
                    "count": len(data["system_resource_problem_entities"]),
                    "details": data["system_resource_problem_details"],
                },
            },
        },
    ),
    HomeHealthSensorDescription(
        key="offline_entities",
        translation_key="offline_entities",
        icon="mdi:lan-disconnect",
        native_unit_of_measurement="entities",
        value_fn=lambda data: len(data["offline_entities"]),
        attrs_fn=lambda data: {
            "entities": data["offline_entities"],
            "details": data["offline_details"],
        },
    ),
    HomeHealthSensorDescription(
        key="low_batteries",
        translation_key="low_batteries",
        icon="mdi:battery-alert",
        native_unit_of_measurement="entities",
        value_fn=lambda data: len(data["low_battery_entities"]),
        attrs_fn=lambda data: {
            "entities": data["low_battery_entities"],
            "details": data["low_battery_details"],
        },
    ),
    HomeHealthSensorDescription(
        key="critical_batteries",
        translation_key="critical_batteries",
        icon="mdi:battery-10",
        native_unit_of_measurement="entities",
        value_fn=lambda data: len(data["critical_battery_entities"]),
        attrs_fn=lambda data: {
            "entities": data["critical_battery_entities"],
            "details": data["critical_battery_details"],
        },
    ),
    HomeHealthSensorDescription(
        key="stale_entities",
        translation_key="stale_entities",
        icon="mdi:clock-alert-outline",
        native_unit_of_measurement="entities",
        value_fn=lambda data: len(data["stale_entities"]),
        attrs_fn=lambda data: {
            "entities": data["stale_entities"],
            "details": data["stale_details"],
        },
    ),
    HomeHealthSensorDescription(
        key="temperature_median",
        translation_key="temperature_median",
        icon="mdi:thermometer-lines",
        native_unit_of_measurement=UnitOfTemperature.CELSIUS,
        value_fn=lambda data: data["temperature_median"],
    ),
    HomeHealthSensorDescription(
        key="temperature_average",
        translation_key="temperature_average",
        icon="mdi:thermometer",
        native_unit_of_measurement=UnitOfTemperature.CELSIUS,
        value_fn=lambda data: data["temperature_average"],
    ),
    HomeHealthSensorDescription(
        key="temperature_outliers",
        translation_key="temperature_outliers",
        icon="mdi:thermometer-alert",
        native_unit_of_measurement="entities",
        value_fn=lambda data: len(data["temperature_outliers"]),
        attrs_fn=lambda data: {
            "entities": data["temperature_outliers"],
            "details": data["temperature_outlier_details"],
        },
    ),
    HomeHealthSensorDescription(
        key="apis_offline",
        translation_key="apis_offline",
        icon="mdi:api-off",
        native_unit_of_measurement="entities",
        value_fn=lambda data: len(data["api_offline_entities"]),
        attrs_fn=lambda data: {
            "entities": data["api_offline_entities"],
            "details": data["api_offline_details"],
        },
    ),
    HomeHealthSensorDescription(
        key="zigbee_linkquality_low",
        translation_key="zigbee_linkquality_low",
        icon="mdi:zigbee",
        native_unit_of_measurement="entities",
        value_fn=lambda data: len(data["zigbee_linkquality_low_entities"]),
        attrs_fn=lambda data: {
            "entities": data["zigbee_linkquality_low_entities"],
            "details": data["zigbee_linkquality_low_details"],
        },
    ),
    HomeHealthSensorDescription(
        key="addon_problems",
        translation_key="addon_problems",
        icon="mdi:puzzle-alert",
        native_unit_of_measurement="entities",
        value_fn=lambda data: len(data["addon_problem_entities"]),
        attrs_fn=lambda data: {
            "entities": data["addon_problem_entities"],
            "details": data["addon_problem_details"],
        },
    ),
    HomeHealthSensorDescription(
        key="system_resource_problems",
        translation_key="system_resource_problems",
        icon="mdi:server-network",
        native_unit_of_measurement="entities",
        value_fn=lambda data: len(data["system_resource_problem_entities"]),
        attrs_fn=lambda data: {
            "entities": data["system_resource_problem_entities"],
            "details": data["system_resource_problem_details"],
        },
    ),
)


async def async_setup_entry(
    hass,
    entry: HomeHealthConfigEntry,
    async_add_entities,
) -> None:
    """Set up Home Health sensors."""
    coordinator = entry.runtime_data
    async_add_entities(
        HomeHealthSensor(coordinator, entry, description) for description in SENSORS
    )


class HomeHealthSensor(CoordinatorEntity[HomeHealthCoordinator], SensorEntity):
    """Home Health sensor entity."""

    entity_description: HomeHealthSensorDescription
    _attr_has_entity_name = True

    def __init__(
        self,
        coordinator: HomeHealthCoordinator,
        entry: HomeHealthConfigEntry,
        description: HomeHealthSensorDescription,
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator)
        self.entity_description = description
        self._attr_unique_id = f"{entry.entry_id}_{description.key}"
        self._attr_device_info = {
            "identifiers": {(DOMAIN, entry.entry_id)},
            "name": "Home Health Overview",
            "manufacturer": "SebasJPS",
        }

    @property
    def native_value(self) -> Any:
        """Return the sensor value."""
        return self.entity_description.value_fn(self.coordinator.data or {})

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        """Return extra attributes."""
        if self.entity_description.attrs_fn is None:
            return None
        return self.entity_description.attrs_fn(self.coordinator.data or {})
