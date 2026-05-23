# Home Health Dashboard for Home Assistant

Ein fertiger Startpunkt für ein Home-Assistant-Dashboard, das Geräte-, Sensor-, Batterie-, API-, Klima- und Energiezustand sichtbar macht.

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
- Lovelace-Dashboard mit Seiten für Übersicht, Sensoren, Batterien, Klima, Energie, Integrationen und Wartung

## Dateien

- [packages/home_health.yaml](packages/home_health.yaml)
- [dashboards/home-health-dashboard.yaml](dashboards/home-health-dashboard.yaml)
- [docs/LIVE_STELLEN.md](docs/LIVE_STELLEN.md)

## Live stellen

Die genaue Anleitung steht in [docs/LIVE_STELLEN.md](docs/LIVE_STELLEN.md).

## Deployment über GitHub

Eine GitHub-Actions-Vorlage liegt in [.github/workflows/deploy-home-assistant.yml](.github/workflows/deploy-home-assistant.yml).
Die Anleitung dazu steht in [docs/GITHUB_DEPLOY.md](docs/GITHUB_DEPLOY.md).
