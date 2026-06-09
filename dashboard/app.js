/* ================================================================
 *  Datacenter IoT — Dashboard (ThingSpeak, polling via REST)
 * ================================================================ */

// ============================================
// CONFIGURAÇÃO
// ============================================
// Credenciais carregadas via thingspeak-config.local.js (gitignored).
// Copie thingspeak-config.example.js → thingspeak-config.local.js e preencha.
const TS = window.thingspeakConfig || { channelId: "", readApiKey: "" };

const MAX_POINTS = 50;
const MAX_EVENTS = 20;
const POLL_INTERVAL_MS = 15_000;   // ThingSpeak free: 1 leitura a cada 15s
const OFFLINE_AFTER_MS = 120_000;
const ACK_STORAGE_KEY = "datacenter_acked_events";

const THRESHOLDS = {
    tempHigh: 28, tempLow: 15,
    humHigh: 70, humLow: 30,
    voltLow: 100, voltHigh: 240,
    distNear: 100   // objeto a <=100cm dispara alerta de presença
};

// ============================================
// ELEMENTOS DO DOM
// ============================================
const $ = (id) => document.getElementById(id);

const el = {
    status: $("connection-status"),
    deviceInfo: $("device-info"),
    temp: $("val-temp"),
    hum: $("val-hum"),
    light: $("val-light"),
    volt: $("val-volt"),
    dist: $("val-dist"),
    energy: $("val-energy"),
    alarm: $("val-alarm"),
    cardTemp: $("card-temp"),
    cardHum: $("card-hum"),
    cardVolt: $("card-volt"),
    cardDist: $("card-dist"),
    intrusion: $("intrusion-list")
};

// ============================================
// MAPEAMENTO ThingSpeak (field1..8) → leitura
// ============================================
function num(v) {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
}

function mapFeed(f) {
    return {
        temperature: num(f.field1),
        humidity: num(f.field2),
        light_level: num(f.field3),
        voltage_ac: num(f.field4),
        motion_detected: f.field5 === "1",
        energy_source: f.field6 === "1" ? "solar" : "diesel",
        alarm_active: f.field7 === "1",
        distance_cm: num(f.field8),
        timestamp: Date.parse(f.created_at),
        status: (f.status || "").trim(),
        entry_id: f.entry_id
    };
}

// ============================================
// ACK LOCAL (localStorage — ThingSpeak não persiste)
// ============================================
function loadAcked() {
    try {
        return new Set(JSON.parse(localStorage.getItem(ACK_STORAGE_KEY) || "[]"));
    } catch {
        return new Set();
    }
}
const ackedEvents = loadAcked();

function persistAcked() {
    localStorage.setItem(ACK_STORAGE_KEY, JSON.stringify([...ackedEvents]));
}

// ============================================
// GRÁFICOS (Chart.js)
// ============================================
Chart.defaults.color = "#8b98a5";
Chart.defaults.borderColor = "#223142";
Chart.defaults.font.family = '-apple-system, "Segoe UI", Roboto, monospace';

function makeChart(canvasId, label, color) {
    return new Chart($(canvasId), {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label,
                data: [],
                borderColor: color,
                backgroundColor: color + "22",
                borderWidth: 2,
                tension: 0.35,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 400 },
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { maxTicksLimit: 6 }, grid: { color: "#1b2838" } },
                y: { grid: { color: "#1b2838" } }
            }
        }
    });
}

const charts = {
    temp: makeChart("chart-temp", "Temperatura", "#ff4d6d"),
    hum: makeChart("chart-hum", "Umidade", "#4da8ff"),
    light: makeChart("chart-light", "Luminosidade", "#f5a623"),
    volt: makeChart("chart-volt", "Tensão AC", "#a78bfa"),
    dist: makeChart("chart-dist", "Distância", "#21d4fd")
};

function rebuildCharts(readings) {
    // Cada gráfico usa só as leituras que têm valor para o seu campo.
    // Assim não sobra ponto vazio (nem rótulo de horário) no meio do
    // gráfico quando um sensor não reportou naquela amostra.
    const fmtTime = (ts) =>
        new Date(ts).toLocaleTimeString("pt-BR", {
            hour: "2-digit", minute: "2-digit", second: "2-digit"
        });
    const fill = (chart, key) => {
        const pts = readings.filter((r) => r.timestamp && r[key] != null);
        chart.data.labels = pts.map((r) => fmtTime(r.timestamp));
        chart.data.datasets[0].data = pts.map((r) => r[key]);
        chart.update("none");
    };
    fill(charts.temp, "temperature");
    fill(charts.hum, "humidity");
    fill(charts.light, "light_level");
    fill(charts.volt, "voltage_ac");
    fill(charts.dist, "distance_cm");
}

// ============================================
// FETCH ThingSpeak
// ============================================
function feedsUrl() {
    if (!TS.channelId) return null;
    let url = `https://api.thingspeak.com/channels/${TS.channelId}/feeds.json`
            + `?results=${MAX_POINTS}&status=true`;
    if (TS.readApiKey) url += `&api_key=${TS.readApiKey}`;
    return url;
}

async function poll() {
    const url = feedsUrl();
    if (!url) {
        el.deviceInfo.textContent = "Configure o Channel ID em thingspeak-config.local.js";
        return;
    }
    try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const feeds = Array.isArray(json.feeds) ? json.feeds : [];
        const readings = feeds.map(mapFeed).filter((r) => r.timestamp);

        rebuildCharts(readings);
        renderEvents(readings);
        renderDeviceInfo(json.channel, readings);
        evaluateStatus(readings);
    } catch (err) {
        console.error("[ThingSpeak] Falha ao buscar feed:", err);
        setStatus(false);
    }
}

// ============================================
// RENDERIZAÇÃO
// ============================================
function setStatus(online) {
    if (online) {
        el.status.textContent = "ONLINE";
        el.status.className = "status-dot online";
    } else {
        el.status.textContent = "OFFLINE";
        el.status.className = "status-dot offline";
    }
}

function evaluateStatus(readings) {
    const last = readings[readings.length - 1];
    const online = !!last && last.timestamp > 0 && (Date.now() - last.timestamp) < OFFLINE_AFTER_MS;
    setStatus(online);
    if (online) {
        updateCards(last);
    } else {
        clearCards();
    }
}

function clearCards() {
    el.temp.textContent = "--";
    el.hum.textContent = "--";
    el.light.textContent = "--";
    el.volt.textContent = "--";
    el.dist.textContent = "--";
    el.energy.textContent = "--";
    el.energy.className = "";
    el.alarm.textContent = "--";
    el.alarm.className = "";
    el.cardTemp.className = "card";
    el.cardHum.className = "card";
    el.cardVolt.className = "card";
    el.cardDist.className = "card";
}

function renderDeviceInfo(channel, readings) {
    const last = readings[readings.length - 1];
    const name = channel?.name || `Canal ${TS.channelId}`;
    const ls = last?.timestamp ? new Date(last.timestamp).toLocaleString("pt-BR") : "?";
    el.deviceInfo.textContent = `${name} · último: ${ls}`;
}

function updateCards(d) {
    el.temp.textContent = d.temperature != null ? d.temperature.toFixed(1) : "--";
    el.hum.textContent = d.humidity != null ? d.humidity.toFixed(1) : "--";
    el.light.textContent = d.light_level != null ? d.light_level.toFixed(0) : "--";
    el.volt.textContent = d.voltage_ac != null ? d.voltage_ac.toFixed(1) : "--";
    el.dist.textContent = d.distance_cm != null && d.distance_cm >= 0 ? d.distance_cm.toFixed(1) : "--";

    if (d.energy_source === "solar") {
        el.energy.textContent = "☀ SOLAR";
        el.energy.className = "solar";
    } else {
        el.energy.textContent = "⛽ DIESEL";
        el.energy.className = "diesel";
    }

    if (d.alarm_active) {
        el.alarm.textContent = "!! INVASÃO !!";
        el.alarm.className = "active";
    } else {
        el.alarm.textContent = "OK";
        el.alarm.className = "inactive";
    }

    el.cardTemp.className = "card" + (
        d.temperature != null && (d.temperature > THRESHOLDS.tempHigh || d.temperature < THRESHOLDS.tempLow) ? " warning" : ""
    );
    el.cardHum.className = "card" + (
        d.humidity != null && (d.humidity > THRESHOLDS.humHigh || d.humidity < THRESHOLDS.humLow) ? " warning" : ""
    );
    el.cardVolt.className = "card" + (
        d.voltage_ac > THRESHOLDS.voltHigh ? " danger" :
            d.voltage_ac > 0 && d.voltage_ac < THRESHOLDS.voltLow ? " warning" : ""
    );
    el.cardDist.className = "card" + (
        d.distance_cm != null && d.distance_cm >= 0 && d.distance_cm <= THRESHOLDS.distNear ? " warning" : ""
    );
}

// ============================================
// EVENTOS DE INTRUSÃO
// Reconstruídos a partir do campo `status` (preenchido pelo
// firmware só quando há evento). Cada entrada com status = 1 evento.
// ============================================
function parseEvent(reading) {
    const idx = reading.status.indexOf(":");
    if (idx === -1) {
        return { type: reading.status, desc: "" };
    }
    return {
        type: reading.status.slice(0, idx).trim(),
        desc: reading.status.slice(idx + 1).trim()
    };
}

function renderEvents(readings) {
    const events = readings
        .filter((r) => r.status.length > 0)
        .map((r) => {
            const { type, desc } = parseEvent(r);
            const id = String(r.entry_id);
            return { id, type, desc, timestamp: r.timestamp, acknowledged: ackedEvents.has(id) };
        })
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, MAX_EVENTS);

    el.intrusion.innerHTML = "";

    if (events.length === 0) {
        const p = document.createElement("p");
        p.className = "empty";
        p.textContent = "Nenhum evento registrado.";
        el.intrusion.appendChild(p);
        return;
    }

    for (const ev of events) {
        const node = document.createElement("div");
        node.className = "event" + (ev.acknowledged ? " acknowledged" : "");
        const when = ev.timestamp ? new Date(ev.timestamp).toLocaleString("pt-BR") : "?";
        node.innerHTML = `
            <div class="event-info">
                <div class="event-type">${escapeHtml(ev.type || "event")}</div>
                <div class="event-desc">${escapeHtml(ev.desc || "")}</div>
                <div class="event-time">${when}</div>
            </div>
            <button class="event-btn" ${ev.acknowledged ? "disabled" : ""}>
                ${ev.acknowledged ? "Reconhecido" : "Reconhecer"}
            </button>
        `;
        node.querySelector(".event-btn").addEventListener("click", () => {
            ackedEvents.add(ev.id);
            persistAcked();
            renderEvents(readings);
        });
        el.intrusion.appendChild(node);
    }
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

// ============================================
// START
// ============================================
poll();
setInterval(poll, POLL_INTERVAL_MS);
