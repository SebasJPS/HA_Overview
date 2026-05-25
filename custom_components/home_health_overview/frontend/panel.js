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
    searchPlaceholder: "Suchen nach Name, Entity, Bereich, Gerät",
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
    state: "Status",
    area: "Bereich",
    device: "Gerät",
    details: "Details",
    action: "Aktion",
    unknown: "Unbekannt",
    ignore: "Ignorieren",
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
    searchPlaceholder: "Search by name, entity, area, device",
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
    state: "State",
    area: "Area",
    device: "Device",
    details: "Details",
    action: "Action",
    unknown: "Unknown",
    ignore: "Ignore",
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
    this._search = "";
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
    const breakdown = attrs.breakdown?.components || [];
    const categories = attrs.categories || {};
    const sourceStatus = attrs.source_status || {};
    const includeEntities = attrs.include_entities || [];
    const ignoreEntities = attrs.ignore_entities || [];
    const temperatureMedian = attrs.temperature_median ?? entities.tempMedian?.state ?? "?";
    const temperatureAverage = attrs.temperature_average ?? entities.tempAverage?.state ?? "?";
    const text = getText(hass);
    const sections = buildSections(categories, entities, text);
    const visibleSections = sections
      .map((section) => ({ ...section, rows: filterRows(section.rows, this._search, this._filter, section.key) }))
      .filter((section) => this._filter === "all" || section.rows.length || ["sources", "score"].includes(section.key));
    const problemCount = sections.reduce((sum, section) => sum + section.rows.length, 0);
    const statusLabel = score >= 90 ? text.stable : score >= 70 ? text.check : text.critical;

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
          background:
            linear-gradient(90deg, rgba(17, 17, 17, .045) 1px, transparent 1px),
            linear-gradient(180deg, rgba(17, 17, 17, .045) 1px, transparent 1px),
            var(--hh-paper);
          background-size: 42px 42px;
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
          background: ${statusColor(score)};
          color: ${score >= 70 && score < 90 ? "var(--hh-ink)" : "#ffffff"};
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
          margin-top: 20px;
          padding: 12px;
          flex-wrap: wrap;
          box-shadow: 4px 4px 0 var(--hh-ink);
        }
        .search { flex: 1 1 260px; min-width: 180px; }
        input, select {
          width: 100%;
          border: 2px solid var(--hh-ink);
          border-radius: 4px;
          padding: 12px 13px;
          color: var(--hh-ink);
          background: #ffffff;
          font: inherit;
          font-weight: 700;
        }
        input:focus, select:focus { outline: 3px solid var(--hh-yellow); outline-offset: 1px; }
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
        .entity { color: var(--hh-blue); cursor: pointer; overflow-wrap: anywhere; font-weight: 900; }
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
        }
      </style>
      <div class="page">
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
          <div class="search">
            <input id="hh-search" type="search" placeholder="${escapeAttr(text.searchPlaceholder)}" value="${escapeAttr(this._search)}">
          </div>
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
    this.querySelector("#hh-search")?.addEventListener("input", (event) => {
      this._search = event.target.value;
      this.render();
    });
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

function filterRows(rows, search, filter, group) {
  if (filter !== "all" && filter !== "problems" && filter !== group) return [];
  const query = search.trim().toLowerCase();
  if (!query) return rows;
  return rows.filter((row) => [
    row.name,
    row.entity_id,
    row.area,
    row.device,
    row.state,
  ].filter(Boolean).join(" ").toLowerCase().includes(query));
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
  return `
    <tr>
      <td>
        <div class="entity" data-entity="${escapeAttr(entityId)}">${escapeHtml(row.name || entityId || text.unknown)}</div>
        <div class="small">${escapeHtml(entityId)}</div>
      </td>
      <td class="state">${escapeHtml(row.state ?? "-")}</td>
      <td>${escapeHtml(row.area || "-")}</td>
      <td>${escapeHtml(row.device || "-")}</td>
      <td>${detailMeta(row, meta, text)}</td>
      <td>
        <div class="actions">
          ${actionButton("ignore", text.ignore, entityId, busy)}
          ${actionButton("monitor", text.monitor, entityId, busy)}
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

function statusColor(score) {
  if (score >= 90) return "var(--hh-green)";
  if (score >= 70) return "var(--hh-yellow)";
  return "var(--hh-red)";
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
