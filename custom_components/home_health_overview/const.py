"""Constants for Home Health Overview."""

from __future__ import annotations

from datetime import timedelta

DOMAIN = "home_health_overview"

DEFAULT_NAME = "Home Health Overview"
DEFAULT_SCAN_INTERVAL = timedelta(minutes=1)

CONF_API_ENTITIES = "api_entities"
CONF_ADDON_ENTITIES = "addon_entities"
CONF_STALE_HOURS = "stale_hours"
CONF_LOW_BATTERY_THRESHOLD = "low_battery_threshold"
CONF_CRITICAL_BATTERY_THRESHOLD = "critical_battery_threshold"
CONF_TEMPERATURE_OUTLIER_DELTA = "temperature_outlier_delta"
CONF_LINKQUALITY_THRESHOLD = "linkquality_threshold"

DEFAULT_API_ENTITIES = ""
DEFAULT_ADDON_ENTITIES = ""
DEFAULT_STALE_HOURS = 4
DEFAULT_LOW_BATTERY_THRESHOLD = 20
DEFAULT_CRITICAL_BATTERY_THRESHOLD = 10
DEFAULT_TEMPERATURE_OUTLIER_DELTA = 4
DEFAULT_LINKQUALITY_THRESHOLD = 40

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
