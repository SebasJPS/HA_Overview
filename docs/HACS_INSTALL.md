# Installation über HACS

## Custom Repository hinzufügen

1. Home Assistant öffnen.
2. HACS öffnen.
3. `Integrationen` öffnen.
4. Oben rechts das Menü öffnen.
5. `Benutzerdefinierte Repositories` wählen.
6. Repository eintragen:

   ```text
   https://github.com/SebasJPS/HA_Overview
   ```

7. Kategorie wählen:

   ```text
   Integration
   ```

8. Repository hinzufügen.
9. `Home Health Overview` installieren.
10. Home Assistant neu starten.

## Integration aktivieren

Nach dem Neustart:

1. `Einstellungen`
2. `Geräte & Dienste`
3. `Integration hinzufügen`
4. `Home Health Overview` suchen
5. Hinzufügen

## Optionen

Beim Hinzufügen kannst du konfigurieren:

- Stunden ohne Update, bevor eine Entität als veraltet gilt
- Batterie-Warnschwelle
- Batterie-kritisch-Schwelle
- Temperatur-Ausreißer-Abstand
- API-/Watchlist-Entitäten, kommagetrennt
- Zigbee Linkquality-Warnschwelle
- Add-on-/Bridge-Watchlist-Entitäten, kommagetrennt

Beispiel für API-/Watchlist-Entitäten:

```text
binary_sensor.router_ping,binary_sensor.internet_ping,binary_sensor.nas_ping
```

## Dashboard

Die Integration erstellt Sensoren. Das Dashboard kannst du danach in Home Assistant mit diesen Entitäten bauen oder die YAML-Vorlage im Ordner `dashboards/` als Startpunkt verwenden.

Die Zähler-Sensoren zeigen nicht nur die Anzahl. Im Attribut `details` stehen die betroffenen Entitäten mit Name, Entity-ID, Bereich, Gerät, Status und letztem Update.

Ab Version `0.3.0` erscheint zusätzlich ein Eintrag `Home Health` in der linken Home-Assistant-Seitenleiste. Dort werden Score, Score-Berechnung und die betroffenen Entitäten direkt angezeigt.
