# Home Health Overview for Home Assistant

Eine HACS-installierbare Home-Assistant-Integration für Geräte-, Sensor-, Batterie-, API-, Klima- und Energiezustand.

## Enthalten

- Health Score
- Offline/Unknown-Entitäten
- Batterien unter 20 %
- kritische Batterien unter 10 %
- Entitäten ohne Update seit mehr als 4 Stunden
- Temperatur-Median
- Temperatur-Mittelwert
- Temperatur-Ausreißer
- API-Watchlist
- Zigbee2MQTT/MQTT-Quellen-Erkennung
- schwache Zigbee-Linkquality
- Add-on-/Bridge-Watchlist
- Sidebar-Panel `Home Health`
- Lovelace-Dashboard mit Seiten für Übersicht, Sensoren, Batterien, Klima, Energie, Integrationen und Wartung

## Installation über HACS

1. Öffne HACS in Home Assistant.
2. Gehe zu `Integrationen`.
3. Öffne das Menü oben rechts.
4. Wähle `Benutzerdefinierte Repositories`.
5. Füge dieses Repository hinzu:

   ```text
   https://github.com/SebasJPS/HA_Overview
   ```

6. Kategorie: `Integration`
7. Installiere `Home Health Overview`.
8. Starte Home Assistant neu.
9. Gehe zu `Einstellungen -> Geräte & Dienste -> Integration hinzufügen`.
10. Suche nach `Home Health Overview` und füge die Integration hinzu.

Danach erscheinen eigene Sensoren wie:

- `sensor.home_health_overview_health_score`
- `sensor.home_health_overview_offline_entities`
- `sensor.home_health_overview_low_batteries`
- `sensor.home_health_overview_stale_entities`
- `sensor.home_health_overview_temperature_median`
- `sensor.home_health_overview_apis_offline`
- `binary_sensor.home_health_overview_critical`
- `binary_sensor.home_health_overview_warning`

Die Zähler-Sensoren enthalten zusätzlich ein Attribut `details` mit Name, Entity-ID, Bereich, Gerät, Status und letztem Update der betroffenen Entitäten.

Der Home Health Score ist eine gewichtete Bewertung über alle überwachten Bereiche:

- Verfügbarkeit aller überwachten Entitäten
- Aktualität aller überwachten Entitäten
- Batteriezustand
- Temperatur-Ausreißer
- API-/Watchlist-Verfügbarkeit
- Zigbee-Linkquality
- Add-on-/Bridge-Watchlist

Eine einzelne Offline-Entität senkt den Score nur proportional zum Gesamtbestand und markiert den Zustand nicht automatisch als kritisch.

## Dateien

- [custom_components/home_health_overview](custom_components/home_health_overview)
- [packages/home_health.yaml](packages/home_health.yaml)
- [dashboards/home-health-dashboard.yaml](dashboards/home-health-dashboard.yaml)
- [docs/LIVE_STELLEN.md](docs/LIVE_STELLEN.md)

## Live stellen

Für HACS ist keine manuelle Kopie der Integration nötig. Die ältere YAML-Paket-Variante bleibt als Alternative erhalten; die Anleitung steht in [docs/LIVE_STELLEN.md](docs/LIVE_STELLEN.md).

## Deployment über GitHub

Eine GitHub-Actions-Vorlage liegt in [.github/workflows/deploy-home-assistant.yml](.github/workflows/deploy-home-assistant.yml).
Die Anleitung dazu steht in [docs/GITHUB_DEPLOY.md](docs/GITHUB_DEPLOY.md).
