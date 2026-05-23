# Deployment über GitHub

Ja, das Dashboard kann über GitHub live gestellt werden.

Es gibt zwei sinnvolle Wege:

1. **Home Assistant zieht aus GitHub**
   - Einfacher für private Heimnetze.
   - Home Assistant nutzt zum Beispiel das Git Pull Add-on.
   - Du pullst die Dateien nach `/config`.

2. **GitHub Actions deployed zu Home Assistant**
   - Automatischer bei jedem Push auf `main`.
   - GitHub braucht Netzwerkzugriff auf Home Assistant.
   - Praktisch nur sauber mit VPN/Tailscale, fester Domain oder freigegebenem SSH.

Die vorbereitete Vorlage liegt hier:

```text
.github/workflows/deploy-home-assistant.yml
```

## Empfohlener Weg

Für dein Setup ist wahrscheinlich **GitHub Actions + SSH über Tailscale** am saubersten:

- kein öffentlich offener SSH-Port nötig
- GitHub kann über Tailscale ins Heimnetz
- Deployment passiert automatisch nach Push

Ohne Tailscale/VPN müsste Home Assistant von GitHub aus erreichbar sein. Das würde ich für ein Heimnetz nur machen, wenn du genau weißt, wie du SSH sicher absicherst.

## Benötigte GitHub Secrets

Im GitHub Repository unter:

```text
Settings -> Secrets and variables -> Actions -> New repository secret
```

diese Secrets anlegen:

```text
HA_SSH_HOST
HA_SSH_PORT
HA_SSH_USER
HA_SSH_KEY
HA_CONFIG_PATH
```

Beispielwerte:

```text
HA_SSH_HOST=homeassistant.local
HA_SSH_PORT=22
HA_SSH_USER=root
HA_CONFIG_PATH=/config
```

`HA_SSH_KEY` ist der private SSH-Key, mit dem GitHub sich auf Home Assistant einloggen darf.

## Home Assistant vorbereiten

1. SSH/Add-on aktivieren.
2. Public Key des Deploy-Keys in Home Assistant erlauben.
3. Sicherstellen, dass der Benutzer in `/config` schreiben darf.
4. In `/config/configuration.yaml` eintragen:

```yaml
homeassistant:
  packages: !include_dir_named packages

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

## Ablauf nach Einrichtung

1. Änderung an `packages/` oder `dashboards/` machen.
2. Nach GitHub pushen.
3. GitHub Actions kopiert die Dateien nach Home Assistant.
4. Home Assistant prüft die Konfiguration.
5. Wenn die Prüfung erfolgreich ist, wird Home Assistant neu gestartet.

## Wichtig

Die Workflow-Vorlage verwendet `ha core check` und `ha core restart`.
Das funktioniert auf Home Assistant OS oder Supervised-Installationen mit HA CLI.
Bei Docker/Core ohne HA CLI müsste der letzte Schritt angepasst werden, zum Beispiel auf einen Container-Restart oder nur Datei-Deploy ohne Neustart.
