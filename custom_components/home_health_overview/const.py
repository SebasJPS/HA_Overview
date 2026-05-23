"""Constants for Home Health Overview."""

from __future__ import annotations

from datetime import timedelta

DOMAIN = "home_health_overview"

DEFAULT_NAME = "Home Health Overview"
DEFAULT_SCAN_INTERVAL = timedelta(minutes=1)

CONF_API_ENTITIES = "api_entities"
CONF_ADDON_ENTITIES = "addon_entities"
CONF_SYSTEM_RESOURCE_ENTITIES = "system_resource_entities"
CONF_INCLUDE_ENTITIES = "include_entities"
CONF_IGNORE_ENTITIES = "ignore_entities"
CONF_IGNORE_PREFIXES = "ignore_prefixes"
CONF_STALE_HOURS = "stale_hours"
CONF_LOW_BATTERY_THRESHOLD = "low_battery_threshold"
CONF_CRITICAL_BATTERY_THRESHOLD = "critical_battery_threshold"
CONF_TEMPERATURE_OUTLIER_DELTA = "temperature_outlier_delta"
CONF_LINKQUALITY_THRESHOLD = "linkquality_threshold"
CONF_CPU_WARNING_THRESHOLD = "cpu_warning_threshold"
CONF_MEMORY_WARNING_THRESHOLD = "memory_warning_threshold"
CONF_STORAGE_WARNING_THRESHOLD = "storage_warning_threshold"

DEFAULT_API_ENTITIES = ""
DEFAULT_ADDON_ENTITIES = ""
DEFAULT_SYSTEM_RESOURCE_ENTITIES = ""
DEFAULT_INCLUDE_ENTITIES = ""
DEFAULT_IGNORE_ENTITIES = ""
DEFAULT_IGNORE_PREFIXES = ""
DEFAULT_STALE_HOURS = 4
DEFAULT_LOW_BATTERY_THRESHOLD = 20
DEFAULT_CRITICAL_BATTERY_THRESHOLD = 10
DEFAULT_TEMPERATURE_OUTLIER_DELTA = 4
DEFAULT_LINKQUALITY_THRESHOLD = 40
DEFAULT_CPU_WARNING_THRESHOLD = 85
DEFAULT_MEMORY_WARNING_THRESHOLD = 85
DEFAULT_STORAGE_WARNING_THRESHOLD = 90

IGNORED_STALE_PREFIXES = (
    "automation.",
    "button.",
    "calendar.",
    "camera.",
    "event.",
    "group.",
    "input_",
    "person.",
    "scene.",
    "script.",
    "sun.",
    "update.",
    "zone.",
    f"sensor.{DOMAIN}_",
    f"binary_sensor.{DOMAIN}_",
)

IGNORED_OFFLINE_PREFIXES = (
    "button.",
    "event.",
)

PLATFORMS = ["sensor", "binary_sensor"]
