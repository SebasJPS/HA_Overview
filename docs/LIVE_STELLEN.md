# Home Health Dashboard live stellen

## Empfohlen: HACS

1. In HACS `Benutzerdefinierte Repositories` öffnen.
2. Repository hinzufügen:

   ```text
   https://github.com/SebasJPS/HA_Overview
   ```

3. Kategorie `Integration` wählen.
4. `Home Health Overview` installieren.
5. Home Assistant neu starten.
6. Unter `Einstellungen -> Geräte & Dienste -> Integration hinzufügen` nach `Home Health Overview` suchen.

Die Integration erzeugt die Health-Sensoren direkt. Das YAML-Paket unten ist nur noch die manuelle Alternative.

## Dateien

- `packages/home_health.yaml`
- `dashboards/home-health-dashboard.yaml`

## Installation in Home Assistant

1. Öffne dein Home-Assistant-Konfigurationsverzeichnis.
   - Home Assistant OS: meist `/config`
   - Docker: dein gemounteter Config-Ordner

2. Lege diese Ordner an, falls sie noch nicht existieren:

   ```yaml
   /config/packages
   /config/dashboards
   ```

3. Kopiere:

   ```yaml
   packages/home_health.yaml -> /config/packages/home_health.yaml
   dashboards/home-health-dashboard.yaml -> /config/dashboards/home-health-dashboard.yaml
   ```

4. Prüfe deine `/config/configuration.yaml`.
   Falls noch nicht vorhanden, ergänze:

   ```yaml
   homeassistant:
     packages: !include_dir_named packages
   ```

5. Dashboard einbinden:

   ```yaml
   lovelace:
     mode: storage
     dashboards:
       home-health:
         mode: yaml
         title: Home Health
         icon: mdi:heart-pulse
         show_in_sidebar: true
         filename: dashboards/home-health-dashboard.yaml
   ```

6. In Home Assistant:
   - Einstellungen
   - System
   - Neustart
   - Vorher "Konfiguration prüfen" ausführen

## API-Überwachung aktivieren

Lege in Home Assistant eine Gruppe namens `group.home_health_api_watchlist` an.
Dort kommen Binary-Sensoren rein, die API-Verfügbarkeit darstellen, zum Beispiel Ping-, REST- oder Integration-Statussensoren.

Beispiel:

```yaml
group:
  home_health_api_watchlist:
    name: Home Health API Watchlist
    entities:
      - binary_sensor.router_ping
      - binary_sensor.nas_ping
      - binary_sensor.internet_ping
```

## Energie-Seite

Die Energie-Karten nutzen dein bestehendes Home-Assistant-Energy-Dashboard.
Wenn du bereits Energy eingerichtet hast, funktionieren die Karten direkt.
Die SoC-Entitäten für Speicher/Auto musst du im Dashboard noch mit deinen echten Entity-IDs ersetzen.

## Wichtige Anpassungen

- Temperatur-Ausreißer: aktuell mehr als 4 °C Abstand zum Median.
- Veraltete Entitäten: aktuell `last_updated` älter als 4 Stunden.
- Batterie niedrig: unter 20 %.
- Batterie kritisch: unter 10 %.
- Health Score: einfache gewichtete Bewertung, bewusst transparent gehalten.

## Empfehlung

Starte erst mit diesem Paket und beobachte 2 bis 3 Tage, welche Entitäten zu oft falsch anschlagen.
Danach lohnt sich eine Ignore-Liste für bekannte statische Sensoren, z. B. selten aktualisierte Wasser-, Energie- oder Statistikwerte.
