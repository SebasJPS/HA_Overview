const TEXT = {
  de: {
    controlCenter: "Home Assistant Kontrollzentrum",
    stable: "Stabil",
    check: "Prüfen",
    critical: "Kritisch",
    hints: "Hinweise",
    systemHealth: "Systemzustand",
    explicitlyMonitored: "Explizit überwacht",
    ignored: "Ignoriert",
    ignoredDevices: "Ignorierte Geräte",
    filterProblems: "Nur Probleme",
    filterAll: "Alle Sektionen",
    filterOffline: "Offline",
    filterStale: "Keine Updates",
    filterBattery: "Batterien",
    filterTemperature: "Temperatur",
    filterZigbee: "Zigbee",
    filterSystem: "System",
    filterAddons: "Add-ons / APIs",
    filterUpdates: "Updates",
    offlineUnknown: "Offline / unbekannt",
    noUpdates: "Keine Updates",
    lowBatteries: "Batterien niedrig",
    criticalBatteries: "Batterien kritisch",
    tempOutliers: "Temp. Ausreißer",
    apisOffline: "APIs offline",
    zigbeeWeak: "Zigbee Signal schwach",
    addonProblems: "Add-on Probleme",
    highSystemLoad: "Systemlast hoch",
    updatesAvailable: "Updates verfügbar",
    tempMedian: "Temperatur Median",
    tempAverage: "Temperatur Mittelwert",
    lowBatterySection: "Batterien unter Schwelle",
    criticalBatterySection: "Kritische Batterien",
    temperatureOutlierSection: "Temperatur-Ausreißer",
    apisOfflineSection: "APIs nicht erreichbar",
    addonProblemSection: "Add-ons / Bridges mit Problemen",
    systemResourceSection: "CPU / RAM / Speicher kritisch",
    entries: "Einträge",
    noEntries: "Keine Einträge.",
    entity: "Entität",
    entityCount: "Entitäten",
    state: "Status",
    area: "Bereich",
    device: "Gerät",
    details: "Details",
    action: "Aktion",
    unknown: "Unbekannt",
    ignore: "Ignorieren",
    ignoreDevice: "Gerät ignorieren",
    monitor: "Überwachen",
    threshold: "Schwelle",
    update: "Update",
    installed: "Installiert",
    latest: "Neu",
    sources: "Gefundene Quellen",
    groups: "Gruppen",
    mqttEntities: "MQTT-Entitäten",
    zigbee2mqttEntities: "Zigbee2MQTT-Entitäten",
    zigbeeLinkqualitySensors: "Zigbee Linkquality-Sensoren",
    bridgeStatusEntities: "Bridge-Status-Entitäten",
    addonWatchlist: "Add-on Watchlist",
    supervisorHints: "Supervisor/Add-on Hinweise",
    systemResources: "Systemressourcen",
    updateEntities: "Update-Entitäten",
    ignoredEntities: "Ignorierte Entitäten",
    ignoredPrefixes: "Ignorierte Prefixe",
    scoreCalculation: "Score-Berechnung",
    components: "Komponenten",
    noScoreComponents: "Noch keine Score-Komponenten verfügbar.",
    affected: "Betroffen",
    of: "von",
    weight: "Gewicht",
    scoreLabels: {
      availability: "Verfügbarkeit",
      freshness: "Aktualität",
      battery: "Batterie",
      temperature: "Temperatur",
      api: "APIs",
      zigbee: "Zigbee",
      addons: "Add-ons / Bridges",
      system_resources: "Systemressourcen",
      updates: "Updates",
    },
  },
  en: {
    controlCenter: "Home Assistant Control Center",
    stable: "Stable",
    check: "Check",
    critical: "Critical",
    hints: "notices",
    systemHealth: "System health",
    explicitlyMonitored: "Explicitly monitored",
    ignored: "Ignored",
    ignoredDevices: "Ignored devices",
    filterProblems: "Problems only",
    filterAll: "All sections",
    filterOffline: "Offline",
    filterStale: "Stale",
    filterBattery: "Batteries",
    filterTemperature: "Temperature",
    filterZigbee: "Zigbee",
    filterSystem: "System",
    filterAddons: "Add-ons / APIs",
    filterUpdates: "Updates",
    offlineUnknown: "Offline / unknown",
    noUpdates: "No updates",
    lowBatteries: "Low batteries",
    criticalBatteries: "Critical batteries",
    tempOutliers: "Temp. outliers",
    apisOffline: "APIs offline",
    zigbeeWeak: "Weak Zigbee signal",
    addonProblems: "Add-on problems",
    highSystemLoad: "High system load",
    updatesAvailable: "Updates available",
    tempMedian: "Temperature median",
    tempAverage: "Temperature average",
    lowBatterySection: "Batteries below threshold",
    criticalBatterySection: "Critical batteries",
    temperatureOutlierSection: "Temperature outliers",
    apisOfflineSection: "APIs unreachable",
    addonProblemSection: "Add-ons / bridges with problems",
    systemResourceSection: "CPU / RAM / storage critical",
    entries: "entries",
    noEntries: "No entries.",
    entity: "Entity",
    entityCount: "Entities",
    state: "State",
    area: "Area",
    device: "Device",
    details: "Details",
    action: "Action",
    unknown: "Unknown",
    ignore: "Ignore",
    ignoreDevice: "Ignore device",
    monitor: "Monitor",
    threshold: "Threshold",
    update: "Update",
    installed: "Installed",
    latest: "Latest",
    sources: "Detected sources",
    groups: "groups",
    mqttEntities: "MQTT entities",
    zigbee2mqttEntities: "Zigbee2MQTT entities",
    zigbeeLinkqualitySensors: "Zigbee linkquality sensors",
    bridgeStatusEntities: "Bridge status entities",
    addonWatchlist: "Add-on watchlist",
    supervisorHints: "Supervisor/add-on hints",
    systemResources: "System resources",
    updateEntities: "Update entities",
    ignoredEntities: "Ignored entities",
    ignoredPrefixes: "Ignored prefixes",
    scoreCalculation: "Score calculation",
    components: "components",
    noScoreComponents: "No score components available yet.",
    affected: "Affected",
    of: "of",
    weight: "Weight",
    scoreLabels: {
      availability: "Availability",
      freshness: "Freshness",
      battery: "Battery",
      temperature: "Temperature",
      api: "APIs",
      zigbee: "Zigbee",
      addons: "Add-ons / Bridges",
      system_resources: "System resources",
      updates: "Updates",
    },
  },
};

class HomeHealthOverviewPanel extends HTMLElement {
  constructor() {
    super();
    this._filter = "problems";
    this._busy = new Set();
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    if (!this._hass) return;

    const hass = this._hass;
    const entities = getEntities(hass);
    const score = asNumber(entities.score?.state, 0);
    const attrs = entities.score?.attributes || {};
    const panelStyle = ["nothing", "bauhaus"].includes(attrs.panel_style) ? attrs.panel_style : "nothing";
    const breakdown = attrs.breakdown?.components || [];
    const categories = attrs.categories || {};
    const sourceStatus = attrs.source_status || {};
    const includeEntities = attrs.include_entities || [];
    const ignoreEntities = attrs.ignore_entities || [];
    const ignoreDevices = attrs.ignore_devices || [];
    const temperatureMedian = attrs.temperature_median ?? entities.tempMedian?.state ?? "?";
    const temperatureAverage = attrs.temperature_average ?? entities.tempAverage?.state ?? "?";
    const text = getText(hass);
    const sections = buildSections(categories, entities, text);
    const visibleSections = sections
      .map((section) => ({ ...section, rows: filterRows(section.rows, this._filter, section.key) }))
      .filter((section) => this._filter === "all" || section.rows.length || ["sources", "score"].includes(section.key));
    const problemCount = sections.reduce((sum, section) => sum + section.rows.length, 0);
    const statusLevel = getStatusLevel(score, problemCount);
    const statusLabel = statusLevel === "stable" ? text.stable : statusLevel === "check" ? text.check : text.critical;

    this.innerHTML = `
      <style>
        :host {
          --hh-ink: #111111;
          --hh-paper: #f7f4ed;
          --hh-surface: #fffdf7;
          --hh-line: rgba(17, 17, 17, .18);
          --hh-muted: rgba(17, 17, 17, .62);
          --hh-red: #e53935;
          --hh-blue: #1565c0;
          --hh-yellow: #f6c431;
          --hh-green: #1b8a5a;
          display: block;
          min-height: 100vh;
          color: var(--hh-ink);
          background: ${panelBackground(panelStyle)};
          background-size: ${panelStyle === "bauhaus" ? "42px 42px" : "24px 24px, auto, auto"};
          font-family: Inter, "IBM Plex Sans", var(--paper-font-body1_-_font-family, Roboto, system-ui, sans-serif);
        }
        * { box-sizing: border-box; }
        .page { max-width: 1480px; margin: 0 auto; padding: 28px; }
        .masthead {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 18px;
          align-items: end;
          margin-bottom: 18px;
        }
        .brand {
          display: flex;
          gap: 14px;
          align-items: center;
          min-width: 0;
        }
        .mark {
          position: relative;
          width: 54px;
          height: 54px;
          flex: 0 0 auto;
          background: var(--hh-ink);
          overflow: hidden;
        }
        .mark::before {
          content: "";
          position: absolute;
          width: 24px;
          height: 24px;
          left: 7px;
          top: 7px;
          border-radius: 50%;
          background: var(--hh-yellow);
        }
        .mark::after {
          content: "";
          position: absolute;
          right: 0;
          bottom: 0;
          width: 27px;
          height: 27px;
          background: var(--hh-red);
        }
        .eyebrow {
          color: var(--hh-muted);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0;
          text-transform: uppercase;
        }
        h1 {
          margin: 2px 0 0;
          font-size: 46px;
          line-height: .96;
          font-weight: 900;
          letter-spacing: 0;
        }
        .status-chip {
          display: inline-flex;
          align-items: center;
          min-height: 40px;
          padding: 0 14px;
          border: 2px solid var(--hh-ink);
          background: ${statusColor(statusLevel)};
          color: ${statusLevel === "check" ? "var(--hh-ink)" : "#ffffff"};
          font-weight: 900;
          text-transform: uppercase;
        }
        .header {
          display: grid;
          grid-template-columns: minmax(250px, 360px) 1fr;
          gap: 14px;
          align-items: stretch;
        }
        .score, .kpi, .section, .toolbar {
          border: 2px solid var(--hh-ink);
          border-radius: 6px;
          background: var(--hh-surface);
          box-shadow: 6px 6px 0 var(--hh-ink);
        }
        .score {
          position: relative;
          display: grid;
          align-content: space-between;
          min-height: 230px;
          padding: 22px;
          overflow: hidden;
        }
        .score::after {
          content: "";
          position: absolute;
          right: -34px;
          top: -34px;
          width: 118px;
          height: 118px;
          border-radius: 50%;
          background: ${scoreColor(score)};
        }
        .score-value {
          position: relative;
          z-index: 1;
          font-size: 104px;
          line-height: .82;
          font-weight: 950;
          color: var(--hh-ink);
        }
        .score-label, .kpi-label, .muted { color: var(--hh-muted); }
        .score-label {
          margin-top: 10px;
          font-size: 16px;
          font-weight: 800;
          text-transform: uppercase;
        }
        .score-meta {
          display: grid;
          gap: 4px;
          margin-top: 24px;
        }
        .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(155px, 1fr)); gap: 10px; }
        .kpi {
          position: relative;
          min-height: 100px;
          padding: 14px 14px 16px;
          box-shadow: none;
          overflow: hidden;
        }
        .kpi::before {
          content: "";
          position: absolute;
          inset: 0 auto 0 0;
          width: 8px;
          background: var(--hh-blue);
        }
        .kpi:nth-child(3n)::before { background: var(--hh-yellow); }
        .kpi:nth-child(4n)::before { background: var(--hh-red); }
        .kpi-value { font-size: 34px; line-height: .95; font-weight: 900; color: var(--hh-ink); }
        .kpi-label { margin-top: 10px; padding-left: 2px; font-size: 12px; font-weight: 750; text-transform: uppercase; }
        .toolbar {
          display: flex;
          gap: 10px;
          align-items: center;
          justify-content: flex-end;
          margin-top: 20px;
          padding: 12px;
          flex-wrap: wrap;
          box-shadow: 4px 4px 0 var(--hh-ink);
        }
        select {
          width: 100%;
          border: 2px solid var(--hh-ink);
          border-radius: 4px;
          padding: 12px 13px;
          color: var(--hh-ink);
          background: #ffffff;
          font: inherit;
          font-weight: 700;
        }
        select:focus { outline: 3px solid var(--hh-yellow); outline-offset: 1px; }
        .filter { flex: 0 0 220px; }
        .grid { display: grid; grid-template-columns: 1fr; gap: 18px; margin-top: 20px; }
        .section { overflow: hidden; }
        .section-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-bottom: 2px solid var(--hh-ink);
          background: var(--hh-ink);
          color: #ffffff;
        }
        .section h2 { margin: 0; font-size: 18px; line-height: 1.1; font-weight: 900; }
        .count { color: rgba(255, 255, 255, .78); font-size: 12px; font-weight: 800; white-space: nowrap; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        th, td { padding: 12px; border-bottom: 1px solid var(--hh-line); text-align: left; vertical-align: top; font-size: 13px; }
        th { color: var(--hh-muted); font-weight: 900; background: #f0eadf; text-transform: uppercase; font-size: 11px; }
        tr:last-child td { border-bottom: 0; }
        tr:hover td { background: rgba(21, 101, 192, .06); }
        .entity { color: var(--hh-blue); overflow-wrap: anywhere; font-weight: 900; }
        .entity[data-entity] { cursor: pointer; }
        .small { color: var(--hh-muted); font-size: 12px; margin-top: 4px; line-height: 1.35; overflow-wrap: anywhere; }
        .state { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-weight: 800; }
        .actions { display: flex; gap: 6px; flex-wrap: wrap; }
        button {
          border: 2px solid var(--hh-ink);
          border-radius: 4px;
          padding: 8px 10px;
          color: var(--hh-ink);
          background: #ffffff;
          cursor: pointer;
          font: inherit;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
        }
        button:hover { background: var(--hh-yellow); }
        button[disabled] { opacity: .5; cursor: wait; }
        .empty { padding: 20px 16px; color: var(--hh-muted); font-weight: 700; }
        .bar { height: 10px; border: 2px solid var(--hh-ink); border-radius: 0; background: #ffffff; overflow: hidden; margin-top: 10px; }
        .fill { height: 100%; background: var(--hh-blue); }
        .score-grid, .source-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; padding: 14px; }
        .mini { border: 2px solid var(--hh-line); border-radius: 4px; padding: 12px; background: #ffffff; }
        .mini strong { font-weight: 900; }
        .theme-nothing {
          --hh-ink: #111111;
          --hh-paper: #f8f8f6;
          --hh-surface: rgba(255, 255, 255, .78);
          --hh-line: rgba(17, 17, 17, .1);
          --hh-muted: rgba(17, 17, 17, .58);
          --hh-red: #ff3b30;
          --hh-blue: #0a84ff;
          --hh-yellow: #ffcc00;
          --hh-green: #30d158;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", var(--paper-font-body1_-_font-family, Roboto, system-ui, sans-serif);
        }
        .theme-nothing.page {
          max-width: 1480px;
          padding: 26px 18px 36px;
        }
        .theme-nothing .masthead {
          margin-bottom: 18px;
        }
        .theme-nothing .mark {
          width: 50px;
          height: 50px;
          border: 1px solid rgba(17, 17, 17, .16);
          border-radius: 16px;
          background:
            radial-gradient(circle, var(--hh-ink) 1.4px, transparent 1.7px) 8px 8px / 8px 8px,
            rgba(255, 255, 255, .84);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, .88), 0 12px 30px rgba(0, 0, 0, .09);
        }
        .theme-nothing .mark::before { display: none; }
        .theme-nothing .mark::after {
          right: 8px;
          bottom: 8px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--hh-red);
          box-shadow: 0 0 0 5px rgba(255, 59, 48, .12);
        }
        .theme-nothing .eyebrow {
          font-size: 12px;
          font-weight: 750;
        }
        .theme-nothing h1 {
          font-size: 56px;
          line-height: .96;
          font-weight: 850;
        }
        .theme-nothing .status-chip {
          min-height: 42px;
          padding: 0 15px;
          border: 1px solid rgba(17, 17, 17, .1);
          border-radius: 999px;
          background: rgba(255, 255, 255, .72);
          color: #202024;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, .9), 0 12px 28px rgba(0, 0, 0, .08);
          text-transform: none;
          backdrop-filter: blur(22px);
        }
        .theme-nothing .header {
          grid-template-columns: minmax(320px, 430px) 1fr;
          gap: 16px;
        }
        .theme-nothing .score,
        .theme-nothing .kpi,
        .theme-nothing .section,
        .theme-nothing .toolbar {
          border: 1px solid rgba(17, 17, 17, .1);
          border-radius: 28px;
          background: rgba(255, 255, 255, .76);
          box-shadow: 0 24px 70px rgba(0, 0, 0, .12);
          backdrop-filter: blur(24px) saturate(150%);
        }
        .theme-nothing .score {
          min-height: 340px;
          padding: 28px;
        }
        .theme-nothing .score::after {
          right: 28px;
          bottom: 28px;
          top: auto;
          width: 118px;
          height: 118px;
          border-radius: 50%;
          background: conic-gradient(${scoreColor(score)} 0 ${Math.min(Math.max(score, 0), 100)}%, rgba(17, 17, 17, .08) ${Math.min(Math.max(score, 0), 100)}% 100%);
          box-shadow: inset 0 0 0 14px rgba(255, 255, 255, .82);
        }
        .theme-nothing .score::before {
          content: "";
          position: absolute;
          inset: 18px 18px auto auto;
          width: 130px;
          height: 130px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(17, 17, 17, .55) 1.3px, transparent 1.6px) 0 0 / 8px 8px;
          opacity: .2;
        }
        .theme-nothing .score-value {
          font-size: 108px;
          font-weight: 850;
          letter-spacing: 0;
        }
        .theme-nothing .score-label,
        .theme-nothing .kpi-label {
          text-transform: none;
          font-weight: 720;
        }
        .theme-nothing .score-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          max-width: 230px;
        }
        .theme-nothing .score-meta .small {
          margin: 0;
          padding: 7px 10px;
          border: 1px solid rgba(17, 17, 17, .09);
          border-radius: 999px;
          background: rgba(255, 255, 255, .64);
          color: #2d2d31;
          font-size: 12px;
          font-weight: 700;
        }
        .theme-nothing .kpis {
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
        }
        .theme-nothing .kpi {
          min-height: 150px;
          padding: 18px;
          background: rgba(255, 255, 255, .9);
          box-shadow: 0 16px 42px rgba(0, 0, 0, .07);
        }
        .theme-nothing .kpi::before {
          inset: 18px auto auto 18px;
          width: 42px;
          height: 18px;
          background: radial-gradient(circle, rgba(17, 17, 17, .34) 1.3px, transparent 1.6px) 0 0 / 6px 6px;
        }
        .theme-nothing .kpi-value {
          margin-top: 42px;
          font-size: 42px;
          font-weight: 820;
        }
        .theme-nothing .toolbar {
          margin-top: 18px;
          padding: 10px;
          box-shadow: 0 18px 44px rgba(0, 0, 0, .1);
        }
        .theme-nothing select {
          border: 1px solid rgba(17, 17, 17, .1);
          border-radius: 16px;
          background: rgba(255, 255, 255, .76);
          font-weight: 520;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, .85);
        }
        .theme-nothing select:focus {
          outline: 3px solid rgba(10, 132, 255, .22);
        }
        .theme-nothing .grid {
          gap: 16px;
          margin-top: 18px;
        }
        .theme-nothing .section {
          overflow: hidden;
        }
        .theme-nothing .section-head {
          padding: 18px 18px 12px;
          border-bottom: 0;
          background: transparent;
          color: var(--hh-ink);
        }
        .theme-nothing .section h2 {
          font-size: 20px;
          font-weight: 820;
        }
        .theme-nothing .count {
          color: var(--hh-muted);
        }
        .theme-nothing th {
          background: rgba(255, 255, 255, .42);
        }
        .theme-nothing th,
        .theme-nothing td {
          border-bottom: 1px solid rgba(17, 17, 17, .08);
        }
        .theme-nothing tr:hover td {
          background: rgba(10, 132, 255, .06);
        }
        .theme-nothing .entity {
          color: #111111;
        }
        .theme-nothing button {
          border: 1px solid rgba(17, 17, 17, .11);
          border-radius: 999px;
          background: #111111;
          color: #ffffff;
          text-transform: none;
        }
        .theme-nothing button:hover {
          background: #2a2a2d;
        }
        .theme-nothing .bar {
          height: 8px;
          border: 0;
          border-radius: 999px;
          background: rgba(17, 17, 17, .08);
        }
        .theme-nothing .fill {
          border-radius: inherit;
          background: linear-gradient(90deg, #111111, var(--hh-red));
        }
        .theme-nothing .mini {
          border: 1px solid rgba(17, 17, 17, .08);
          border-radius: 20px;
          background: rgba(255, 255, 255, .65);
        }
        @media (max-width: 760px) {
          .page { padding: 12px; }
          .masthead { grid-template-columns: 1fr; align-items: start; }
          .header { grid-template-columns: 1fr; }
          .score, .toolbar, .section { box-shadow: 3px 3px 0 var(--hh-ink); }
          .score { min-height: 190px; }
          h1 { font-size: 32px; }
          .score-value { font-size: 76px; }
          .filter { flex: 1 1 220px; }
          th:nth-child(3), td:nth-child(3), th:nth-child(4), td:nth-child(4) { display: none; }
          th, td { padding: 10px 8px; }
          .actions { gap: 4px; }
          button { padding: 7px 8px; }
          .theme-nothing h1 { font-size: 38px; }
          .theme-nothing .header { grid-template-columns: 1fr; }
          .theme-nothing .score { min-height: 300px; }
          .theme-nothing .score-value { font-size: 82px; }
          .theme-nothing .score::after {
            width: 96px;
            height: 96px;
          }
        }
      </style>
      <div class="page theme-${panelStyle}">
        <div class="masthead">
          <div class="brand">
            <div class="mark" aria-hidden="true"></div>
            <div>
              <div class="eyebrow">${text.controlCenter}</div>
              <h1>Home Health</h1>
            </div>
          </div>
          <div class="status-chip">${statusLabel} · ${problemCount} ${text.hints}</div>
        </div>

        <div class="header">
          <section class="score">
            <div>
              <div class="score-value">${score}%</div>
              <div class="score-label">${text.systemHealth}</div>
            </div>
            <div class="score-meta">
              <div class="small">${text.explicitlyMonitored}: ${includeEntities.length}</div>
              <div class="small">${text.ignored}: ${ignoreEntities.length}</div>
              <div class="small">${text.ignoredDevices}: ${ignoreDevices.length}</div>
            </div>
          </section>
          <div class="kpis">
            ${categoryKpi(categories.offline, entities.offline, text.offlineUnknown)}
            ${categoryKpi(categories.stale, entities.stale, text.noUpdates)}
            ${categoryKpi(categories.low_battery, entities.lowBattery, text.lowBatteries)}
            ${categoryKpi(categories.critical_battery, entities.criticalBattery, text.criticalBatteries)}
            ${categoryKpi(categories.temperature_outliers, entities.temperatureOutliers, text.tempOutliers)}
            ${categoryKpi(categories.apis_offline, entities.apisOffline, text.apisOffline)}
            ${categoryKpi(categories.zigbee_linkquality_low, entities.zigbeeLinkqualityLow, text.zigbeeWeak)}
            ${categoryKpi(categories.addon_problems, entities.addonProblems, text.addonProblems)}
            ${categoryKpi(categories.system_resource_problems, entities.systemResourceProblems, text.highSystemLoad)}
            ${categoryKpi(categories.updates_available, entities.updatesAvailable, text.updatesAvailable)}
            ${valueKpi(temperatureMedian, text.tempMedian, "°C")}
            ${valueKpi(temperatureAverage, text.tempAverage, "°C")}
          </div>
        </div>

        <div class="toolbar">
          <div class="filter">
            <select id="hh-filter">
              ${option("problems", text.filterProblems, this._filter)}
              ${option("all", text.filterAll, this._filter)}
              ${option("offline", text.filterOffline, this._filter)}
              ${option("stale", text.filterStale, this._filter)}
              ${option("battery", text.filterBattery, this._filter)}
              ${option("temperature", text.filterTemperature, this._filter)}
              ${option("zigbee", text.filterZigbee, this._filter)}
              ${option("system", text.filterSystem, this._filter)}
              ${option("addons", text.filterAddons, this._filter)}
              ${option("updates", text.filterUpdates, this._filter)}
            </select>
          </div>
        </div>

        <div class="grid">
          ${scoreSection(breakdown, text)}
          ${sourceSection(sourceStatus, text)}
          ${visibleSections.map((section) => tableSection(section, this._busy, text)).join("")}
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    this.querySelector("#hh-filter")?.addEventListener("change", (event) => {
      this._filter = event.target.value;
      this.render();
    });
    this.querySelectorAll("[data-entity]").forEach((element) => {
      element.addEventListener("click", () => this.openMoreInfo(element.dataset.entity));
    });
    this.querySelectorAll("[data-action][data-target]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        this.applyAction(button.dataset.action, button.dataset.target);
      });
    });
  }

  openMoreInfo(entityId) {
    this.dispatchEvent(new CustomEvent("hass-more-info", {
      detail: { entityId },
      bubbles: true,
      composed: true,
    }));
  }

  async applyAction(action, entityId) {
    const key = `${action}:${entityId}`;
    this._busy.add(key);
    this.render();
    try {
      await this._hass.callApi("POST", "home_health_overview/config", {
        action,
        entity_id: entityId,
      });
    } finally {
      this._busy.delete(key);
    }
  }
}

function getEntities(hass) {
  return {
    score: findEntity(hass, "sensor.home_health_overview_health_score", "health_score"),
    offline: findEntity(hass, "sensor.home_health_overview_offline_entities", "offline_entities"),
    stale: findEntity(hass, "sensor.home_health_overview_stale_entities", "stale_entities"),
    lowBattery: findEntity(hass, "sensor.home_health_overview_low_batteries", "low_batteries"),
    criticalBattery: findEntity(hass, "sensor.home_health_overview_critical_batteries", "critical_batteries"),
    temperatureOutliers: findEntity(hass, "sensor.home_health_overview_temperature_outliers", "temperature_outliers"),
    apisOffline: findEntity(hass, "sensor.home_health_overview_apis_offline", "apis_offline"),
    zigbeeLinkqualityLow: findEntity(hass, "sensor.home_health_overview_zigbee_linkquality_low", "zigbee_linkquality_low"),
    addonProblems: findEntity(hass, "sensor.home_health_overview_addon_problems", "addon_problems"),
    systemResourceProblems: findEntity(hass, "sensor.home_health_overview_system_resource_problems", "system_resource_problems"),
    updatesAvailable: findEntity(hass, "sensor.home_health_overview_updates_available", "updates_available"),
    tempMedian: findEntity(hass, "sensor.home_health_overview_temperature_median", "temperature_median"),
    tempAverage: findEntity(hass, "sensor.home_health_overview_temperature_average", "temperature_average"),
  };
}

function buildSections(categories, entities, text) {
  return [
    section("offline", text.offlineUnknown, "offline", categories.offline, entities.offline),
    section("stale", text.noUpdates, "stale", categories.stale, entities.stale, { lastUpdate: true }),
    section("low_battery", text.lowBatterySection, "battery", categories.low_battery, entities.lowBattery),
    section("critical_battery", text.criticalBatterySection, "battery", categories.critical_battery, entities.criticalBattery),
    section("temperature_outliers", text.temperatureOutlierSection, "temperature", categories.temperature_outliers, entities.temperatureOutliers, { temperature: true }),
    section("apis_offline", text.apisOfflineSection, "addons", categories.apis_offline, entities.apisOffline),
    section("zigbee_linkquality_low", text.zigbeeWeak, "zigbee", categories.zigbee_linkquality_low, entities.zigbeeLinkqualityLow, { zigbee: true }),
    section("addon_problems", text.addonProblemSection, "addons", categories.addon_problems, entities.addonProblems),
    section("system_resource_problems", text.systemResourceSection, "system", categories.system_resource_problems, entities.systemResourceProblems, { resource: true }),
    section("updates_available", text.updatesAvailable, "updates", categories.updates_available, entities.updatesAvailable, { update: true }),
  ];
}

function section(key, title, group, category, entity, meta = {}) {
  return {
    key,
    title,
    group,
    rows: category?.details || entity?.attributes?.details || [],
    meta,
  };
}

function filterRows(rows, filter, group) {
  if (filter !== "all" && filter !== "problems" && filter !== group) return [];
  return rows;
}

function tableSection(sectionData, busy, text) {
  const rows = sectionData.rows;
  return `
    <section class="section">
      <div class="section-head">
        <h2>${escapeHtml(sectionData.title)}</h2>
        <div class="count">${rows.length} ${text.entries}</div>
      </div>
      ${rows.length ? table(rows, sectionData.meta, busy, text) : `<div class="empty">${text.noEntries}</div>`}
    </section>
  `;
}

function table(rows, meta, busy, text) {
  return `
    <table>
      <thead>
        <tr>
          <th style="width:32%">${text.entity}</th>
          <th style="width:12%">${text.state}</th>
          <th style="width:18%">${text.area}</th>
          <th style="width:20%">${text.device}</th>
          <th>${text.details}</th>
          <th style="width:170px">${text.action}</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((row) => tableRow(row, meta, busy, text)).join("")}
      </tbody>
    </table>
  `;
}

function tableRow(row, meta, busy, text) {
  const entityId = row.entity_id || "";
  const isDevice = row.type === "device";
  const targetId = isDevice ? row.device_id : entityId;
  return `
    <tr>
      <td>
        ${
          isDevice
            ? `<div class="entity">${escapeHtml(row.name || text.unknown)}</div>`
            : `<div class="entity" data-entity="${escapeAttr(entityId)}">${escapeHtml(row.name || entityId || text.unknown)}</div>`
        }
        <div class="small">${escapeHtml(isDevice ? `${row.entity_count || 0} ${text.entityCount}` : entityId)}</div>
      </td>
      <td class="state">${escapeHtml(row.state ?? "-")}</td>
      <td>${escapeHtml(row.area || "-")}</td>
      <td>${escapeHtml(row.device || "-")}</td>
      <td>${detailMeta(row, meta, text)}</td>
      <td>
        <div class="actions">
          ${
            isDevice
              ? actionButton("ignore_device", text.ignoreDevice, targetId, busy)
              : `${actionButton("ignore", text.ignore, targetId, busy)}${actionButton("monitor", text.monitor, targetId, busy)}`
          }
        </div>
      </td>
    </tr>
  `;
}

function detailMeta(row, meta, text) {
  const details = [];
  if (meta.temperature) details.push(`Median ${row.median ?? "-"} °C`, `Δ ${row.difference ?? "-"} °C`);
  if (meta.zigbee) details.push(`LQI ${row.linkquality ?? "-"}`, `${text.threshold} ${row.threshold ?? "-"}`);
  if (meta.resource) details.push(`${row.resource_type ?? "resource"}`, `${row.usage ?? "-"}% / ${row.threshold ?? "-"}%`);
  if (meta.update) details.push(`${text.installed} ${row.installed_version ?? "-"}`, `${text.latest} ${row.latest_version ?? "-"}`);
  if (meta.lastUpdate && row.last_updated) details.push(`${text.update} ${formatDate(row.last_updated)}`);
  if (row.type === "device") details.push(`${row.unavailable_count || row.entity_count || 0} ${text.of} ${row.entity_count || 0}`);
  return details.length ? `<span class="small">${escapeHtml(details.join(" · "))}</span>` : `<span class="muted">-</span>`;
}

function actionButton(action, label, entityId, busy) {
  const key = `${action}:${entityId}`;
  return `<button data-action="${action}" data-target="${escapeAttr(entityId)}" ${busy.has(key) ? "disabled" : ""}>${label}</button>`;
}

function findEntity(hass, preferredId, keyPart) {
  if (hass.states[preferredId]) return hass.states[preferredId];
  return Object.entries(hass.states)
    .filter(([entityId]) => entityId.startsWith("sensor.home_health_overview_") || entityId.startsWith("binary_sensor.home_health_overview_"))
    .find(([entityId]) => entityId.includes(keyPart))?.[1];
}

function asNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function categoryKpi(category, entity, label, suffix = "") {
  const value = category?.count ?? entity?.state ?? "?";
  return valueKpi(value, label, suffix);
}

function valueKpi(value, label, suffix = "") {
  return `
    <div class="kpi">
      <div class="kpi-value">${escapeHtml(value)}${suffix}</div>
      <div class="kpi-label">${escapeHtml(label)}</div>
    </div>
  `;
}

function option(value, label, selected) {
  return `<option value="${value}" ${value === selected ? "selected" : ""}>${escapeHtml(label)}</option>`;
}

function sourceSection(sourceStatus, text) {
  const items = [
    [text.mqttEntities, sourceStatus.mqtt_entities_found],
    [text.zigbee2mqttEntities, sourceStatus.zigbee2mqtt_entities_found],
    [text.zigbeeLinkqualitySensors, sourceStatus.zigbee_linkquality_sensors_found],
    [text.bridgeStatusEntities, sourceStatus.zigbee_bridge_entities_found],
    [text.addonWatchlist, sourceStatus.addon_watchlist_entities_found],
    [text.supervisorHints, sourceStatus.supervisor_entities_found],
    [text.systemResources, sourceStatus.system_resource_entities_found],
    [text.updateEntities, sourceStatus.update_entities_found],
    [text.explicitlyMonitored, sourceStatus.explicitly_included_entities],
    [text.ignoredEntities, sourceStatus.ignored_entities],
    [text.ignoredDevices, sourceStatus.ignored_devices],
    [text.ignoredPrefixes, sourceStatus.ignored_prefixes],
  ];
  return `
    <section class="section">
      <div class="section-head"><h2>${text.sources}</h2><div class="count">${items.length} ${text.groups}</div></div>
      <div class="source-grid">
        ${items.map(([label, value]) => `<div class="mini"><div class="small">${escapeHtml(label)}</div><div class="kpi-value">${value ?? 0}</div></div>`).join("")}
      </div>
    </section>
  `;
}

function scoreSection(components, text) {
  const rows = components.length
    ? components.map((component) => `
      <div class="mini">
        <div><strong>${escapeHtml(componentLabel(component, text))}</strong>: ${component.score}%</div>
        <div class="small">${text.affected}: ${component.affected || 0} ${text.of} ${component.total || 0} · ${text.weight}: ${component.weight}</div>
        <div class="bar"><div class="fill" style="width:${component.score}%"></div></div>
      </div>
    `).join("")
    : `<div class="empty">${text.noScoreComponents}</div>`;

  return `
    <section class="section">
      <div class="section-head"><h2>${text.scoreCalculation}</h2><div class="count">${components.length} ${text.components}</div></div>
      <div class="score-grid">${rows}</div>
    </section>
  `;
}

function getText(hass) {
  const language = (hass.locale?.language || hass.selectedLanguage || navigator.language || "en")
    .toLowerCase()
    .split("-")[0];
  return TEXT[language] || TEXT.en;
}

function componentLabel(component, text) {
  return text.scoreLabels?.[component.key] || component.label;
}

function scoreColor(score) {
  if (score >= 90) return "var(--success-color, #2e7d32)";
  if (score >= 70) return "var(--warning-color, #f9a825)";
  return "var(--error-color, #c62828)";
}

function getStatusLevel(score, problemCount) {
  if (score < 70) return "critical";
  if (problemCount > 0 || score < 90) return "check";
  return "stable";
}

function statusColor(statusLevel) {
  if (statusLevel === "stable") return "var(--hh-green)";
  if (statusLevel === "check") return "var(--hh-yellow)";
  return "var(--hh-red)";
}

function panelBackground(panelStyle) {
  if (panelStyle === "bauhaus") {
    return `
            linear-gradient(90deg, rgba(17, 17, 17, .045) 1px, transparent 1px),
            linear-gradient(180deg, rgba(17, 17, 17, .045) 1px, transparent 1px),
            var(--hh-paper)`;
  }
  return `
            radial-gradient(circle at 12px 12px, rgba(17, 17, 17, .1) 1.2px, transparent 1.3px) 0 0 / 24px 24px,
            radial-gradient(circle at 78% 14%, rgba(255, 59, 48, .11), transparent 28%),
            linear-gradient(135deg, #f8f8f6 0%, #ffffff 42%, #eef1f4 100%)`;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

customElements.define("home-health-overview-panel", HomeHealthOverviewPanel);
