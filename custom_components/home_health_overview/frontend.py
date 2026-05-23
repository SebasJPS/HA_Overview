"""Frontend panel support for Home Health Overview."""

from __future__ import annotations

from pathlib import Path

from homeassistant.components.frontend import (
    async_register_built_in_panel,
    async_remove_panel,
)
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

from .const import DOMAIN

PANEL_URL_PATH = "home-health-overview"
PANEL_COMPONENT_NAME = "home-health-overview-panel"
FRONTEND_URL = f"/{DOMAIN}/frontend"
FRONTEND_PATH = Path(__file__).parent / "frontend"


async def async_register_panel(hass: HomeAssistant) -> None:
    """Register the Home Health sidebar panel."""
    await hass.http.async_register_static_paths(
        [
            StaticPathConfig(
                FRONTEND_URL,
                str(FRONTEND_PATH),
                False,
            )
        ]
    )

    async_register_built_in_panel(
        hass,
        component_name="custom",
        sidebar_title="Home Health",
        sidebar_icon="mdi:heart-pulse",
        frontend_url_path=PANEL_URL_PATH,
        config={
            "_panel_custom": {
                "name": PANEL_COMPONENT_NAME,
                "module_url": f"{FRONTEND_URL}/panel.js",
                "embed_iframe": False,
                "trust_external": False,
            }
        },
        require_admin=False,
    )


async def async_remove_home_health_panel(hass: HomeAssistant) -> None:
    """Remove the Home Health sidebar panel."""
    async_remove_panel(hass, PANEL_URL_PATH)
