"""Config flow for Home Health Overview."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.core import callback

from .const import (
    CONF_API_ENTITIES,
    CONF_CRITICAL_BATTERY_THRESHOLD,
    CONF_LOW_BATTERY_THRESHOLD,
    CONF_STALE_HOURS,
    CONF_TEMPERATURE_OUTLIER_DELTA,
    DEFAULT_API_ENTITIES,
    DEFAULT_CRITICAL_BATTERY_THRESHOLD,
    DEFAULT_LOW_BATTERY_THRESHOLD,
    DEFAULT_NAME,
    DEFAULT_STALE_HOURS,
    DEFAULT_TEMPERATURE_OUTLIER_DELTA,
    DOMAIN,
)


class HomeHealthConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Home Health Overview."""

    VERSION = 1

    async def async_step_user(
        self,
        user_input: dict[str, Any] | None = None,
    ) -> config_entries.ConfigFlowResult:
        """Handle the initial step."""
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()

        if user_input is not None:
            return self.async_create_entry(title=DEFAULT_NAME, data=user_input)

        return self.async_show_form(
            step_id="user",
            data_schema=_schema(),
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry):
        """Create the options flow."""
        return HomeHealthOptionsFlow(config_entry)


class HomeHealthOptionsFlow(config_entries.OptionsFlow):
    """Handle Home Health options."""

    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        """Initialize options flow."""
        self._config_entry = config_entry

    async def async_step_init(
        self,
        user_input: dict[str, Any] | None = None,
    ) -> config_entries.ConfigFlowResult:
        """Manage options."""
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        values = {**self._config_entry.data, **self._config_entry.options}
        return self.async_show_form(
            step_id="init",
            data_schema=_schema(values),
        )


def _schema(values: dict[str, Any] | None = None) -> vol.Schema:
    """Return config schema."""
    values = values or {}
    return vol.Schema(
        {
            vol.Optional(
                CONF_STALE_HOURS,
                default=values.get(CONF_STALE_HOURS, DEFAULT_STALE_HOURS),
            ): vol.All(vol.Coerce(int), vol.Range(min=1, max=168)),
            vol.Optional(
                CONF_LOW_BATTERY_THRESHOLD,
                default=values.get(
                    CONF_LOW_BATTERY_THRESHOLD, DEFAULT_LOW_BATTERY_THRESHOLD
                ),
            ): vol.All(vol.Coerce(int), vol.Range(min=1, max=100)),
            vol.Optional(
                CONF_CRITICAL_BATTERY_THRESHOLD,
                default=values.get(
                    CONF_CRITICAL_BATTERY_THRESHOLD,
                    DEFAULT_CRITICAL_BATTERY_THRESHOLD,
                ),
            ): vol.All(vol.Coerce(int), vol.Range(min=1, max=100)),
            vol.Optional(
                CONF_TEMPERATURE_OUTLIER_DELTA,
                default=values.get(
                    CONF_TEMPERATURE_OUTLIER_DELTA,
                    DEFAULT_TEMPERATURE_OUTLIER_DELTA,
                ),
            ): vol.All(vol.Coerce(float), vol.Range(min=0.5, max=50)),
            vol.Optional(
                CONF_API_ENTITIES,
                default=values.get(CONF_API_ENTITIES, DEFAULT_API_ENTITIES),
            ): str,
        }
    )
