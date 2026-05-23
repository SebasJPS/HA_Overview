class HomeHealthOverviewPanel extends HTMLElement {
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
    const entities = {
      score: findEntity(hass, "sensor.home_health_overview_health_score", "health_score"),
      offline: findEntity(hass, "sensor.home_health_overview_offline_entities", "offline_entities"),
      stale: findEntity(hass, "sensor.home_health_overview_stale_entities", "stale_entities"),
      lowBattery: findEntity(hass, "sensor.home_health_overview_low_batteries", "low_batteries"),
      criticalBattery: findEntity(hass, "sensor.home_health_overview_critical_batteries", "critical_batteries"),
      temperatureOutliers: findEntity(hass, "sensor.home_health_overview_temperature_outliers", "temperature_outliers"),
      apisOffline: findEntity(hass, "sensor.home_health_overview_apis_offline", "apis_offline"),
      tempMedian: findEntity(hass, "sensor.home_health_overview_temperature_median", "temperature_median"),
      tempAverage: findEntity(hass, "sensor.home_health_overview_temperature_average", "temperature_average"),
    };

    const score = asNumber(entities.score?.state, 0);
    const breakdown = entities.score?.attributes?.breakdown?.components || [];
    const categories = entities.score?.attributes?.categories || {};
    const temperatureMedian = entities.score?.attributes?.temperature_median ?? entities.tempMedian?.state ?? "?";
    const temperatureAverage = entities.score?.attributes?.temperature_average ?? entities.tempAverage?.state ?? "?";

    this.innerHTML = `
      <style>
        :host {
          display: block;
          min-height: 100vh;
          color: var(--primary-text-color);
          background: var(--primary-background-color);
          font-family: var(--paper-font-body1_-_font-family, Roboto, system-ui, sans-serif);
        }
        .page {
          max-width: 1280px;
          margin: 0 auto;
          padding: 24px;
        }
        .header {
          display: grid;
          grid-template-columns: minmax(220px, 320px) 1fr;
          gap: 20px;
          align-items: stretch;
        }
        .score {
          border: 1px solid var(--divider-color);
          border-radius: 8px;
          padding: 20px;
          background: var(--card-background-color);
        }
        .score-value {
          font-size: 56px;
          line-height: 1;
          font-weight: 650;
          color: ${scoreColor(score)};
        }
        .score-label {
          margin-top: 8px;
          color: var(--secondary-text-color);
        }
        .kpis {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
        }
        .kpi, .section {
          border: 1px solid var(--divider-color);
          border-radius: 8px;
          background: var(--card-background-color);
        }
        .kpi {
          padding: 16px;
        }
        .kpi-value {
          font-size: 30px;
          line-height: 1;
          font-weight: 600;
        }
        .kpi-label {
          margin-top: 8px;
          color: var(--secondary-text-color);
          font-size: 13px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 16px;
          margin-top: 20px;
        }
        .section {
          overflow: hidden;
        }
        .section h2 {
          margin: 0;
          padding: 14px 16px;
          font-size: 17px;
          border-bottom: 1px solid var(--divider-color);
        }
        .list {
          display: grid;
          gap: 0;
        }
        .item {
          padding: 12px 16px;
          border-bottom: 1px solid var(--divider-color);
        }
        .item:last-child {
          border-bottom: 0;
        }
        .name {
          font-weight: 600;
          overflow-wrap: anywhere;
        }
        .meta {
          margin-top: 4px;
          color: var(--secondary-text-color);
          font-size: 13px;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }
        .empty {
          padding: 16px;
          color: var(--secondary-text-color);
        }
        .breakdown {
          display: grid;
          gap: 10px;
        }
        .bar {
          height: 8px;
          border-radius: 999px;
          background: var(--divider-color);
          overflow: hidden;
          margin-top: 6px;
        }
        .fill {
          height: 100%;
          background: var(--primary-color);
        }
        @media (max-width: 760px) {
          .page {
            padding: 12px;
          }
          .header {
            grid-template-columns: 1fr;
          }
        }
      </style>
      <div class="page">
        <div class="header">
          <section class="score">
            <div class="score-value">${score}%</div>
            <div class="score-label">Home Health Score</div>
          </section>
          <div class="kpis">
            ${categoryKpi(categories.offline, entities.offline, "Offline / unbekannt")}
            ${categoryKpi(categories.stale, entities.stale, "Keine Updates")}
            ${categoryKpi(categories.low_battery, entities.lowBattery, "Batterien niedrig")}
            ${categoryKpi(categories.critical_battery, entities.criticalBattery, "Batterien kritisch")}
            ${categoryKpi(categories.temperature_outliers, entities.temperatureOutliers, "Temp. Ausreißer")}
            ${categoryKpi(categories.apis_offline, entities.apisOffline, "APIs offline")}
            ${valueKpi(temperatureMedian, "Temperatur Median", "°C")}
            ${valueKpi(temperatureAverage, "Temperatur Mittelwert", "°C")}
          </div>
        </div>

        <div class="grid">
          ${breakdownSection(breakdown)}
          ${detailSection("Offline / unbekannt", categories.offline, entities.offline)}
          ${detailSection("Keine Updates", categories.stale, entities.stale, true)}
          ${detailSection("Batterien unter Schwelle", categories.low_battery, entities.lowBattery)}
          ${detailSection("Kritische Batterien", categories.critical_battery, entities.criticalBattery)}
          ${detailSection("Temperatur-Ausreißer", categories.temperature_outliers, entities.temperatureOutliers, false, true)}
          ${detailSection("APIs nicht erreichbar", categories.apis_offline, entities.apisOffline)}
        </div>
      </div>
    `;
  }
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

function kpi(entity, label, suffix = "") {
  return valueKpi(entity ? entity.state : "?", label, suffix);
}

function categoryKpi(category, entity, label, suffix = "") {
  const value = category?.count ?? entity?.state ?? "?";
  return valueKpi(value, label, suffix);
}

function valueKpi(value, label, suffix = "") {
  return `
    <div class="kpi">
      <div class="kpi-value">${value}${suffix}</div>
      <div class="kpi-label">${label}</div>
    </div>
  `;
}

function detailSection(title, category, entity, showLastUpdate = false, showTemperatureMeta = false) {
  const details = category?.details || entity?.attributes?.details || [];
  const rows = details.length
    ? details.map((item) => detailItem(item, showLastUpdate, showTemperatureMeta)).join("")
    : `<div class="empty">Keine Einträge.</div>`;

  return `
    <section class="section">
      <h2>${title}</h2>
      <div class="list">${rows}</div>
    </section>
  `;
}

function detailItem(item, showLastUpdate, showTemperatureMeta) {
  const context = [
    item.entity_id ? `<code>${escapeHtml(item.entity_id)}</code>` : "",
    item.state ? `Status: <code>${escapeHtml(item.state)}</code>` : "",
    item.area ? `Bereich: ${escapeHtml(item.area)}` : "",
    item.device ? `Gerät: ${escapeHtml(item.device)}` : "",
  ].filter(Boolean).join(" · ");

  const update = showLastUpdate && item.last_updated
    ? `<div class="meta">Letztes Update: ${formatDate(item.last_updated)}</div>`
    : "";
  const temp = showTemperatureMeta
    ? `<div class="meta">Median: ${item.median ?? "-"} °C · Abweichung: ${item.difference ?? "-"} °C</div>`
    : "";

  return `
    <div class="item">
      <div class="name">${escapeHtml(item.name || item.entity_id || "Unbekannt")}</div>
      <div class="meta">${context}</div>
      ${temp}
      ${update}
    </div>
  `;
}

function breakdownSection(components) {
  const rows = components.length
    ? components.map((component) => `
      <div class="item">
        <div class="name">${escapeHtml(component.label)}: ${component.score}%</div>
        <div class="meta">Betroffen: ${component.affected || 0} von ${component.total || 0} · Gewicht: ${component.weight}</div>
        <div class="bar"><div class="fill" style="width:${component.score}%"></div></div>
      </div>
    `).join("")
    : `<div class="empty">Noch keine Score-Komponenten verfügbar.</div>`;

  return `
    <section class="section">
      <h2>Score-Berechnung</h2>
      <div class="breakdown">${rows}</div>
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
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

customElements.define("home-health-overview-panel", HomeHealthOverviewPanel);
