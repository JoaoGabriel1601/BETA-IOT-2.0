/* ================================================================
 *  Datacenter IoT — Dashboard (Firebase Realtime Database)
 * ================================================================
 *  IMPORTANTE: ajuste `firebaseConfig.databaseURL` com a URL
 *  do seu Realtime Database (veja README.md seção "Firebase").
 * ================================================================ */

// ============================================
// CONFIGURAÇÃO (ajuste aqui)
// ============================================
const firebaseConfig = {
    databaseURL: "https://beta-iot-cf12a-default-rtdb.firebaseio.com"
};

const DEVICE_ID = "esp32-datacenter-001";
const MAX_POINTS = 50;           // pontos de histórico nos gráficos
const MAX_EVENTS = 20;           // eventos de intrusão a exibir

// Thresholds visuais (igual ao firmware)
const THRESHOLDS = {
    tempHigh: 28, tempLow: 15,
    humHigh: 70, humLow: 30,
    voltLow: 100, voltHigh: 240
};

// ============================================
// INIT FIREBASE
// ============================================
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

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
    energy: $("val-energy"),
    alarm: $("val-alarm"),
    cardTemp: $("card-temp"),
    cardHum: $("card-hum"),
    cardVolt: $("card-volt"),
    intrusion: $("intrusion-list")
};

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
    volt: makeChart("chart-volt", "Tensão AC", "#a78bfa")
};

function pushPoint(chart, label, value) {
    chart.data.labels.push(label);
    chart.data.datasets[0].data.push(value);
    if (chart.data.labels.length > MAX_POINTS) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
    }
    chart.update("none");
}

// ============================================
// ATUALIZAÇÃO EM TEMPO REAL
// ============================================
const currentRef = db.ref(`datacenter/devices/${DEVICE_ID}/current`);
const infoRef = db.ref(`datacenter/devices/${DEVICE_ID}/info`);
const readingsRef = db.ref(`datacenter/readings/${DEVICE_ID}`);
const intrusionRef = db.ref(`datacenter/intrusion_events/${DEVICE_ID}`);

// Estado atual (cards)
currentRef.on("value", (snap) => {
    const data = snap.val();
    if (!data) {
        setStatus(false);
        return;
    }
    setStatus(true);
    updateCards(data);
});

// Info do dispositivo
infoRef.on("value", (snap) => {
    const info = snap.val();
    if (!info) return;
    const ls = info.last_seen ? new Date(info.last_seen).toLocaleString("pt-BR") : "?";
    el.deviceInfo.textContent = `${info.name || DEVICE_ID} · ${info.location || ""} · último: ${ls}`;
});

// Histórico para os gráficos
readingsRef.orderByChild("timestamp").limitToLast(MAX_POINTS).on("child_added", (snap) => {
    const r = snap.val();
    const t = r.timestamp ? new Date(r.timestamp) : new Date();
    const label = t.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    pushPoint(charts.temp, label, r.temperature);
    pushPoint(charts.hum, label, r.humidity);
    pushPoint(charts.light, label, r.light_level);
    pushPoint(charts.volt, label, r.voltage_ac);
});

// Eventos de intrusão
intrusionRef.orderByChild("timestamp").limitToLast(MAX_EVENTS).on("child_added", (snap) => {
    addIntrusionEvent(snap.key, snap.val());
});
intrusionRef.on("child_changed", (snap) => {
    addIntrusionEvent(snap.key, snap.val(), true);
});

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

function updateCards(d) {
    el.temp.textContent = d.temperature?.toFixed(1) ?? "--";
    el.hum.textContent = d.humidity?.toFixed(1) ?? "--";
    el.light.textContent = d.light_level?.toFixed(0) ?? "--";
    el.volt.textContent = d.voltage_ac?.toFixed(1) ?? "--";

    // Energia
    if (d.energy_source === "solar") {
        el.energy.textContent = "☀ SOLAR";
        el.energy.className = "solar";
    } else if (d.energy_source === "diesel") {
        el.energy.textContent = "⛽ DIESEL";
        el.energy.className = "diesel";
    }

    // Alarme
    if (d.alarm_active) {
        el.alarm.textContent = "!! INVASÃO !!";
        el.alarm.className = "active";
    } else {
        el.alarm.textContent = "OK";
        el.alarm.className = "inactive";
    }

    // Cores condicionais
    el.cardTemp.className = "card" + (
        d.temperature > THRESHOLDS.tempHigh || d.temperature < THRESHOLDS.tempLow ? " warning" : ""
    );
    el.cardHum.className = "card" + (
        d.humidity > THRESHOLDS.humHigh || d.humidity < THRESHOLDS.humLow ? " warning" : ""
    );
    el.cardVolt.className = "card" + (
        d.voltage_ac > THRESHOLDS.voltHigh ? " danger" :
            d.voltage_ac > 0 && d.voltage_ac < THRESHOLDS.voltLow ? " warning" : ""
    );
}

const renderedEvents = new Map();

function addIntrusionEvent(key, data, updated = false) {
    const empty = el.intrusion.querySelector(".empty");
    if (empty) empty.remove();

    let node = renderedEvents.get(key);
    if (node) {
        node.classList.toggle("acknowledged", !!data.acknowledged);
        const btn = node.querySelector(".event-btn");
        if (btn && data.acknowledged) { btn.disabled = true; btn.textContent = "Reconhecido"; }
        return;
    }

    node = document.createElement("div");
    node.className = "event" + (data.acknowledged ? " acknowledged" : "");

    const when = data.timestamp
        ? new Date(data.timestamp).toLocaleString("pt-BR")
        : "?";

    node.innerHTML = `
        <div class="event-info">
            <div class="event-type">${escapeHtml(data.event_type || "event")}</div>
            <div class="event-desc">${escapeHtml(data.description || "")}</div>
            <div class="event-time">${when}</div>
        </div>
        <button class="event-btn" ${data.acknowledged ? "disabled" : ""}>
            ${data.acknowledged ? "Reconhecido" : "Reconhecer"}
        </button>
    `;

    node.querySelector(".event-btn").addEventListener("click", () => {
        intrusionRef.child(key).update({ acknowledged: true });
    });

    el.intrusion.prepend(node);
    renderedEvents.set(key, node);

    // Remove eventos antigos da UI
    if (renderedEvents.size > MAX_EVENTS) {
        const oldest = Array.from(renderedEvents.keys())[0];
        const oldNode = renderedEvents.get(oldest);
        oldNode?.remove();
        renderedEvents.delete(oldest);
    }
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}
