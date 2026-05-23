"""Binary sensors for Home Health Overview."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable

from homeassistant.components.binary_sensor import (
    BinarySensorDeviceClass,
    BinarySensorEntity,
    BinarySensorEntityDescription,
)
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from . import HomeHealthConfigEntry
from .const import DOMAIN
from .coordinator import HomeHealthCoordinator


@dataclass(frozen=True, kw_only=True)
class HomeHealthBinarySensorDescription(BinarySensorEntityDescription):
    """Description for a Home Health binary sensor."""

    value_fn: Callable[[dict[str, Any]], bool]


BINARY_SENSORS: tuple[HomeHealthBinarySensorDescription, ...] = (
    HomeHealthBinarySensorDescription(
        key="critical",
        translation_key="critical",
        icon="mdi:alert-octagon",
        device_class=BinarySensorDeviceClass.PROBLEM,
        value_fn=lambda data: bool(data["critical"]),
    ),
    HomeHealthBinarySensorDescription(
        key="warning",
        translation_key="warning",
        icon="mdi:alert",
        device_class=BinarySensorDeviceClass.PROBLEM,
        value_fn=lambda data: bool(data["warning"]),
    ),
)


async def async_setup_entry(
    hass,
    entry: HomeHealthConfigEntry,
    async_add_entities,
) -> None:
    """Set up Home Health binary sensors."""
    coordinator = entry.runtime_data
    async_add_entities(
        HomeHealthBinarySensor(coordinator, entry, description)
        for description in BINARY_SENSORS
    )


class HomeHealthBinarySensor(
    CoordinatorEntity[HomeHealthCoordinator],
    BinarySensorEntity,
):
    """Home Health binary sensor entity."""

    entity_description: HomeHealthBinarySensorDescription
    _attr_has_entity_name = True

    def __init__(
        self,
        coordinator: HomeHealthCoordinator,
        entry: HomeHealthConfigEntry,
        description: HomeHealthBinarySensorDescription,
    ) -> None:
        """Initialize the binary sensor."""
        super().__init__(coordinator)
        self.entity_description = description
        self._attr_unique_id = f"{entry.entry_id}_{description.key}"
        self._attr_device_info = {
            "identifiers": {(DOMAIN, entry.entry_id)},
            "name": "Home Health Overview",
            "manufacturer": "SebasJPS",
        }

    @property
    def is_on(self) -> bool:
        """Return true if the binary sensor is on."""
        return self.entity_description.value_fn(self.coordinator.data or {})
