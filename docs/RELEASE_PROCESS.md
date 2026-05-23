# Release-Prozess

Dieses Repository nutzt GitHub Actions, damit HACS-Updates sauberer werden.

## Validierung

Der Workflow `.github/workflows/validate.yml` läuft bei:

- Push auf `main`
- Pull Requests
- täglich automatisch
- manuell per `workflow_dispatch`

Er prüft:

- Python-Dateien kompilieren
- JSON-Dateien sind gültig
- Frontend-JavaScript ist syntaktisch gültig
- HACS validiert das Repository als `integration`

## Release erstellen

1. Version in `custom_components/home_health_overview/manifest.json` erhöhen.
2. Änderung committen und nach `main` pushen.
3. Tag erstellen:

   ```text
   git tag -a v0.6.1 -m "Home Health Overview 0.6.1"
   git push origin v0.6.1
   ```

4. GitHub Actions erstellt automatisch einen GitHub Release.

Der Release-Workflow bricht ab, wenn der Tag nicht zur `manifest.json`-Version passt.

## Warum Releases?

HACS kann Custom Repositories zwar auch direkt vom Branch laden, aber GitHub Releases machen Versionen klarer sichtbar. HACS zeigt beim Neuherunterladen dann konkrete Versionen wie `v0.6.1` statt nur den aktuellen Branch-Stand.
