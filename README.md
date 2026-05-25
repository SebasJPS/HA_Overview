# Home Health Overview

Eine HACS-installierbare Home-Assistant-Integration, die den Zustand deines Smart Homes in einem kompakten Health Dashboard zusammenfasst.

A HACS-installable Home Assistant integration that summarizes your smart home health in one compact dashboard.

![Home Health Overview Panel Mockup](docs/assets/home-health-panel-mockup.svg)

## Deutsch

Home Health Overview erkennt problematische Entitäten, schwache Batterien, veraltete Sensorwerte, verfügbare Updates, API-/Bridge-Probleme, Zigbee-Signalqualität und Systemressourcen. Zusätzlich liefert die Integration einen gewichteten Health Score und ein eigenes Sidebar-Panel mit Suche, Filtern und direkten Aktionen.

### Highlights

- Moderner `Home Health` Sidebar-Bereich im Neo-Bauhaus-Stil
- Gewichteter Home Health Score von 0 bis 100
- Erkennung von `offline`- und `unknown`-Entitäten
- Warnungen für niedrige und kritische Batteriestände
- Erkennung von Entitäten ohne aktuelle Updates
- Anzeige verfügbarer Home-Assistant-Updates aus `update.*`-Entitäten
- Temperatur-Median, Mittelwert und Ausreißer
- API-, Add-on- und Bridge-Watchlists
- Zigbee2MQTT-/MQTT-Erkennung und schwache Linkquality
- CPU-, RAM- und Speicherüberwachung
- Konfigurierbare Ignore-Listen, Prefix-Filter und explizite Watchlists
- Lovelace-YAML-Dashboard als Alternative oder Ergänzung

### Installation über HACS

1. Öffne HACS in Home Assistant.
2. Gehe zu `Integrationen`.
3. Öffne das Menü oben rechts und wähle `Benutzerdefinierte Repositories`.
4. Füge dieses Repository hinzu:

   ```text
   https://github.com/SebasJPS/HA_Overview
   ```

5. Wähle als Kategorie `Integration`.
6. Installiere `Home Health Overview`.
7. Starte Home Assistant neu.
8. Öffne `Einstellungen -> Geräte & Dienste -> Integration hinzufügen`.
9. Suche nach `Home Health Overview` und füge die Integration hinzu.

Nach der Einrichtung erscheint links in Home Assistant das Sidebar-Panel `Home Health`.

### Nutzung

Das Sidebar-Panel zeigt den aktuellen Systemzustand als Score, wichtige Problemzähler als KPI-Kacheln, Score-Komponenten, gefundene Datenquellen und betroffene Entitäten als durchsuchbare Tabellen. Einzelne Entitäten können direkt ignoriert oder explizit überwacht werden.

Betroffene Entitäten können im Panel angeklickt werden, um die Home-Assistant-Detailansicht zu öffnen.

![Home Health Overview Workflow Mockup](docs/assets/home-health-workflow-mockup.svg)

### Wichtige Sensoren

```text
sensor.home_health_overview_health_score
sensor.home_health_overview_offline_entities
sensor.home_health_overview_stale_entities
sensor.home_health_overview_low_batteries
sensor.home_health_overview_critical_batteries
sensor.home_health_overview_temperature_median
sensor.home_health_overview_temperature_average
sensor.home_health_overview_temperature_outliers
sensor.home_health_overview_apis_offline
sensor.home_health_overview_zigbee_linkquality_low
sensor.home_health_overview_addon_problems
sensor.home_health_overview_system_resource_problems
sensor.home_health_overview_updates_available
binary_sensor.home_health_overview_critical
binary_sensor.home_health_overview_warning
```

Die Zähler-Sensoren enthalten ein Attribut `details`. Darin stehen die betroffenen Einträge mit Name, Entity-ID, Bereich, Gerät, Status und weiteren Kontextdaten wie letztem Update, Batteriewert, Temperaturabweichung, Linkquality oder installierter und verfügbarer Update-Version.

### Konfiguration

Die Optionen findest du in Home Assistant unter:

```text
Einstellungen -> Geräte & Dienste -> Home Health Overview -> Konfigurieren
```

Dort kannst du Entitäten explizit überwachen, Entitäten ignorieren, Prefixe ausblenden, API-/Add-on-/Bridge-Watchlists pflegen und Schwellenwerte passend zu deinem Setup setzen.

## English

Home Health Overview detects problematic entities, weak batteries, stale sensor values, available updates, API/bridge issues, Zigbee signal quality, and system resource problems. It also provides a weighted health score and a dedicated sidebar panel with search, filters, and direct actions.

### Highlights

- Modern `Home Health` sidebar panel in a neo-Bauhaus style
- Weighted Home Health Score from 0 to 100
- Detection of `offline` and `unknown` entities
- Warnings for low and critical batteries
- Detection of entities without recent updates
- Display of available Home Assistant updates from `update.*` entities
- Temperature median, average, and outliers
- API, add-on, and bridge watchlists
- Zigbee2MQTT/MQTT detection and weak linkquality
- CPU, RAM, and storage monitoring
- Configurable ignore lists, prefix filters, and explicit watchlists
- Optional Lovelace YAML dashboard

### HACS Installation

1. Open HACS in Home Assistant.
2. Go to `Integrations`.
3. Open the menu in the top right and choose `Custom repositories`.
4. Add this repository:

   ```text
   https://github.com/SebasJPS/HA_Overview
   ```

5. Select `Integration` as the category.
6. Install `Home Health Overview`.
7. Restart Home Assistant.
8. Open `Settings -> Devices & services -> Add integration`.
9. Search for `Home Health Overview` and add the integration.

After setup, the `Home Health` sidebar panel appears in Home Assistant.

### Usage

The sidebar panel shows the current system health score, important problem counters as KPI tiles, score components, detected data sources, and affected entities in searchable tables. Individual entities can be ignored or explicitly monitored from the panel.

Affected entities can be clicked in the panel to open the Home Assistant more-info dialog.

### Important Sensors

```text
sensor.home_health_overview_health_score
sensor.home_health_overview_offline_entities
sensor.home_health_overview_stale_entities
sensor.home_health_overview_low_batteries
sensor.home_health_overview_critical_batteries
sensor.home_health_overview_temperature_median
sensor.home_health_overview_temperature_average
sensor.home_health_overview_temperature_outliers
sensor.home_health_overview_apis_offline
sensor.home_health_overview_zigbee_linkquality_low
sensor.home_health_overview_addon_problems
sensor.home_health_overview_system_resource_problems
sensor.home_health_overview_updates_available
binary_sensor.home_health_overview_critical
binary_sensor.home_health_overview_warning
```

Counter sensors include a `details` attribute with affected entries, including name, entity ID, area, device, state, and context such as last update, battery value, temperature delta, linkquality, or installed and available update versions.

### Configuration

Options are available in Home Assistant under:

```text
Settings -> Devices & services -> Home Health Overview -> Configure
```

You can explicitly monitor entities, ignore entities, hide prefixes, maintain API/add-on/bridge watchlists, and adjust thresholds for your setup.

## Lovelace Dashboard

Zusätzlich zum Sidebar-Panel liegt ein YAML-Dashboard bei:

In addition to the sidebar panel, a YAML dashboard is included:

```text
dashboards/home-health-dashboard.yaml
```

Die ältere YAML-Paket-Variante bleibt als Alternative erhalten:

The older YAML package variant remains available as an alternative:

```text
packages/home_health.yaml
```

## Support

Home Health Overview ist kostenlos und bleibt kostenlos.

Home Health Overview is free and will remain free.

[Buy me a coffee](https://buymeacoffee.com/sebasbe)

## Projektdateien / Project Files

- [custom_components/home_health_overview](custom_components/home_health_overview) contains the HACS integration.
- [custom_components/home_health_overview/frontend/panel.js](custom_components/home_health_overview/frontend/panel.js) contains the sidebar panel.
- [dashboards/home-health-dashboard.yaml](dashboards/home-health-dashboard.yaml) contains the optional Lovelace dashboard.
- [packages/home_health.yaml](packages/home_health.yaml) contains the alternative YAML package.
- [docs/HACS_INSTALL.md](docs/HACS_INSTALL.md) describes HACS installation.
- [docs/GITHUB_DEPLOY.md](docs/GITHUB_DEPLOY.md) describes GitHub deployment.
- [docs/RELEASE_PROCESS.md](docs/RELEASE_PROCESS.md) describes releases and tags.

## Releases

Dieses Repository nutzt GitHub Actions für Validierung und Releases. Der Release-Prozess ist:

This repository uses GitHub Actions for validation and releases. The release process is:

1. Version in `custom_components/home_health_overview/manifest.json` erhöhen / bump the version.
2. Änderung nach `main` committen und pushen / commit and push to `main`.
3. Passenden Tag erstellen, zum Beispiel `v0.7.6` / create the matching tag, for example `v0.7.6`.
4. Tag pushen / push the tag.

Der Release-Workflow prüft, ob Tag und Manifest-Version zusammenpassen.

The release workflow checks that the tag and manifest version match.

## Status

Aktuelle Version / Current version: `0.7.6`
