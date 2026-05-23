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
    const sections = buildSections(categories, entities);
    const visibleSections = sections
      .map((section) => ({ ...section, rows: filterRows(section.rows, this._search, this._filter, section.key) }))
      .filter((section) => this._filter === "all" || section.rows.length || ["sources", "score"].includes(section.key));

    this.innerHTML = `
      <style>
        :host {
          display: block;
          min-height: 100vh;
          color: var(--primary-text-color);
          background: var(--primary-background-color);
          font-family: var(--paper-font-body1_-_font-family, Roboto, system-ui, sans-serif);
        }
        .page { max-width: 1440px; margin: 0 auto; padding: 24px; }
        .header { display: grid; grid-template-columns: minmax(220px, 320px) 1fr; gap: 16px; align-items: stretch; }
        .score, .kpi, .section, .toolbar { border: 1px solid var(--divider-color); border-radius: 8px; background: var(--card-background-color); }
        .score { padding: 20px; }
        .score-value { font-size: 56px; line-height: 1; font-weight: 650; color: ${scoreColor(score)}; }
        .score-label, .kpi-label, .muted { color: var(--secondary-text-color); }
        .score-label { margin-top: 8px; }
        .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
        .kpi { padding: 14px; min-height: 74px; }
        .kpi-value { font-size: 28px; line-height: 1; font-weight: 600; }
        .kpi-label { margin-top: 8px; font-size: 13px; }
        .toolbar { display: flex; gap: 10px; align-items: center; margin-top: 16px; padding: 12px; flex-wrap: wrap; }
        .search { flex: 1 1 260px; min-width: 180px; }
        input, select {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid var(--divider-color);
          border-radius: 6px;
          padding: 10px 12px;
          color: var(--primary-text-color);
          background: var(--secondary-background-color);
          font: inherit;
        }
        .filter { flex: 0 0 220px; }
        .grid { display: grid; grid-template-columns: 1fr; gap: 16px; margin-top: 16px; }
        .section { overflow: hidden; }
        .section-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 14px 16px; border-bottom: 1px solid var(--divider-color); }
        .section h2 { margin: 0; font-size: 17px; }
        .count { color: var(--secondary-text-color); font-size: 13px; white-space: nowrap; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        th, td { padding: 10px 12px; border-bottom: 1px solid var(--divider-color); text-align: left; vertical-align: top; font-size: 13px; }
        th { color: var(--secondary-text-color); font-weight: 600; background: var(--secondary-background-color); }
        tr:last-child td { border-bottom: 0; }
        .entity { color: var(--primary-color); cursor: pointer; overflow-wrap: anywhere; font-weight: 600; }
        .small { color: var(--secondary-text-color); font-size: 12px; margin-top: 3px; overflow-wrap: anywhere; }
        .state { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
        .actions { display: flex; gap: 6px; flex-wrap: wrap; }
        button {
          border: 1px solid var(--divider-color);
          border-radius: 6px;
          padding: 7px 10px;
          color: var(--primary-text-color);
          background: var(--secondary-background-color);
          cursor: pointer;
          font: inherit;
          font-size: 12px;
        }
        button:hover { border-color: var(--primary-color); }
        button[disabled] { opacity: .5; cursor: wait; }
        .empty { padding: 18px 16px; color: var(--secondary-text-color); }
        .bar { height: 8px; border-radius: 999px; background: var(--divider-color); overflow: hidden; margin-top: 6px; }
        .fill { height: 100%; background: var(--primary-color); }
        .score-grid, .source-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; padding: 12px; }
        .mini { border: 1px solid var(--divider-color); border-radius: 8px; padding: 10px; }
        @media (max-width: 760px) {
          .page { padding: 12px; }
          .header { grid-template-columns: 1fr; }
          .filter { flex: 1 1 220px; }
          th:nth-child(3), td:nth-child(3), th:nth-child(4), td:nth-child(4) { display: none; }
        }
      </style>
      <div class="page">
        <div class="header">
          <section class="score">
            <div class="score-value">${score}%</div>
            <div class="score-label">Home Health Score</div>
            <div class="small">Explizit überwacht: ${includeEntities.length} · Ignoriert: ${ignoreEntities.length}</div>
          </section>
          <div class="kpis">
            ${categoryKpi(categories.offline, entities.offline, "Offline / unbekannt")}
            ${categoryKpi(categories.stale, entities.stale, "Keine Updates")}
            ${categoryKpi(categories.low_battery, entities.lowBattery, "Batterien niedrig")}
            ${categoryKpi(categories.critical_battery, entities.criticalBattery, "Batterien kritisch")}
            ${categoryKpi(categories.temperature_outliers, entities.temperatureOutliers, "Temp. Ausreißer")}
            ${categoryKpi(categories.apis_offline, entities.apisOffline, "APIs offline")}
            ${categoryKpi(categories.zigbee_linkquality_low, entities.zigbeeLinkqualityLow, "Zigbee Signal schwach")}
            ${categoryKpi(categories.addon_problems, entities.addonProblems, "Add-on Probleme")}
            ${categoryKpi(categories.system_resource_problems, entities.systemResourceProblems, "Systemlast hoch")}
            ${valueKpi(temperatureMedian, "Temperatur Median", "°C")}
            ${valueKpi(temperatureAverage, "Temperatur Mittelwert", "°C")}
          </div>
        </div>

        <div class="toolbar">
          <div class="search">
            <input id="hh-search" type="search" placeholder="Suchen nach Name, Entity, Bereich, Gerät" value="${escapeAttr(this._search)}">
          </div>
          <div class="filter">
            <select id="hh-filter">
              ${option("problems", "Nur Probleme", this._filter)}
              ${option("all", "Alle Sektionen", this._filter)}
              ${option("offline", "Offline", this._filter)}
              ${option("stale", "Keine Updates", this._filter)}
              ${option("battery", "Batterien", this._filter)}
              ${option("temperature", "Temperatur", this._filter)}
              ${option("zigbee", "Zigbee", this._filter)}
              ${option("system", "System", this._filter)}
              ${option("addons", "Add-ons / APIs", this._filter)}
            </select>
          </div>
        </div>

        <div class="grid">
          ${scoreSection(breakdown)}
          ${sourceSection(sourceStatus)}
          ${visibleSections.map((section) => tableSection(section, this._busy)).join("")}
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
    tempMedian: findEntity(hass, "sensor.home_health_overview_temperature_median", "temperature_median"),
    tempAverage: findEntity(hass, "sensor.home_health_overview_temperature_average", "temperature_average"),
  };
}

function buildSections(categories, entities) {
  return [
    section("offline", "Offline / unbekannt", "offline", categories.offline, entities.offline),
    section("stale", "Keine Updates", "stale", categories.stale, entities.stale, { lastUpdate: true }),
    section("low_battery", "Batterien unter Schwelle", "battery", categories.low_battery, entities.lowBattery),
    section("critical_battery", "Kritische Batterien", "battery", categories.critical_battery, entities.criticalBattery),
    section("temperature_outliers", "Temperatur-Ausreißer", "temperature", categories.temperature_outliers, entities.temperatureOutliers, { temperature: true }),
    section("apis_offline", "APIs nicht erreichbar", "addons", categories.apis_offline, entities.apisOffline),
    section("zigbee_linkquality_low", "Zigbee Signal schwach", "zigbee", categories.zigbee_linkquality_low, entities.zigbeeLinkqualityLow, { zigbee: true }),
    section("addon_problems", "Add-ons / Bridges mit Problemen", "addons", categories.addon_problems, entities.addonProblems),
    section("system_resource_problems", "CPU / RAM / Speicher kritisch", "system", categories.system_resource_problems, entities.systemResourceProblems, { resource: true }),
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

function tableSection(sectionData, busy) {
  const rows = sectionData.rows;
  return `
    <section class="section">
      <div class="section-head">
        <h2>${escapeHtml(sectionData.title)}</h2>
        <div class="count">${rows.length} Einträge</div>
      </div>
      ${rows.length ? table(rows, sectionData.meta, busy) : `<div class="empty">Keine Einträge.</div>`}
    </section>
  `;
}

function table(rows, meta, busy) {
  return `
    <table>
      <thead>
        <tr>
          <th style="width:32%">Entität</th>
          <th style="width:12%">Status</th>
          <th style="width:18%">Bereich</th>
          <th style="width:20%">Gerät</th>
          <th>Details</th>
          <th style="width:170px">Aktion</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((row) => tableRow(row, meta, busy)).join("")}
      </tbody>
    </table>
  `;
}

function tableRow(row, meta, busy) {
  const entityId = row.entity_id || "";
  return `
    <tr>
      <td>
        <div class="entity" data-entity="${escapeAttr(entityId)}">${escapeHtml(row.name || entityId || "Unbekannt")}</div>
        <div class="small">${escapeHtml(entityId)}</div>
      </td>
      <td class="state">${escapeHtml(row.state ?? "-")}</td>
      <td>${escapeHtml(row.area || "-")}</td>
      <td>${escapeHtml(row.device || "-")}</td>
      <td>${detailMeta(row, meta)}</td>
      <td>
        <div class="actions">
          ${actionButton("ignore", "Ignorieren", entityId, busy)}
          ${actionButton("monitor", "Überwachen", entityId, busy)}
        </div>
      </td>
    </tr>
  `;
}

function detailMeta(row, meta) {
  const details = [];
  if (meta.temperature) details.push(`Median ${row.median ?? "-"} °C`, `Δ ${row.difference ?? "-"} °C`);
  if (meta.zigbee) details.push(`LQI ${row.linkquality ?? "-"}`, `Schwelle ${row.threshold ?? "-"}`);
  if (meta.resource) details.push(`${row.resource_type ?? "resource"}`, `${row.usage ?? "-"}% / ${row.threshold ?? "-"}%`);
  if (meta.lastUpdate && row.last_updated) details.push(`Update ${formatDate(row.last_updated)}`);
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

function sourceSection(sourceStatus) {
  const items = [
    ["MQTT-Entitäten", sourceStatus.mqtt_entities_found],
    ["Zigbee2MQTT-Entitäten", sourceStatus.zigbee2mqtt_entities_found],
    ["Zigbee Linkquality-Sensoren", sourceStatus.zigbee_linkquality_sensors_found],
    ["Bridge-Status-Entitäten", sourceStatus.zigbee_bridge_entities_found],
    ["Add-on Watchlist", sourceStatus.addon_watchlist_entities_found],
    ["Supervisor/Add-on Hinweise", sourceStatus.supervisor_entities_found],
    ["Systemressourcen", sourceStatus.system_resource_entities_found],
    ["Explizit überwacht", sourceStatus.explicitly_included_entities],
    ["Ignorierte Entitäten", sourceStatus.ignored_entities],
    ["Ignorierte Prefixe", sourceStatus.ignored_prefixes],
  ];
  return `
    <section class="section">
      <div class="section-head"><h2>Gefundene Quellen</h2><div class="count">${items.length} Gruppen</div></div>
      <div class="source-grid">
        ${items.map(([label, value]) => `<div class="mini"><div class="small">${escapeHtml(label)}</div><div class="kpi-value">${value ?? 0}</div></div>`).join("")}
      </div>
    </section>
  `;
}

function scoreSection(components) {
  const rows = components.length
    ? components.map((component) => `
      <div class="mini">
        <div><strong>${escapeHtml(component.label)}</strong>: ${component.score}%</div>
        <div class="small">Betroffen: ${component.affected || 0} von ${component.total || 0} · Gewicht: ${component.weight}</div>
        <div class="bar"><div class="fill" style="width:${component.score}%"></div></div>
      </div>
    `).join("")
    : `<div class="empty">Noch keine Score-Komponenten verfügbar.</div>`;

  return `
    <section class="section">
      <div class="section-head"><h2>Score-Berechnung</h2><div class="count">${components.length} Komponenten</div></div>
      <div class="score-grid">${rows}</div>
    </section>
  `;
}

function scoreColor(score) {
  if (score >= 90) return "var(--success-color, #2e7d32)";
  if (score >= 70) return "var(--warning-color, #f9a825)";
  return "var(--error-color, #c62828)";
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
