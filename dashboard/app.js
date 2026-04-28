/* ================================================================
 *  Datacenter IoT — Dashboard (Firebase Realtime Database + Auth)
 * ================================================================ */

// ============================================
// CONFIGURAÇÃO
// ============================================
// Credenciais carregadas via firebase-config.local.js (gitignored).
// Copie firebase-config.example.js → firebase-config.local.js e preencha os valores.
const firebaseConfig = window.firebaseConfig;

const DEVICE_ID = "esp32-datacenter-001";
const MAX_POINTS = 50;
const MAX_EVENTS = 20;
const OFFLINE_AFTER_MS = 120_000;
const STATUS_RECHECK_MS = 15_000;

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
const auth = firebase.auth();
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

// ============================================
// ELEMENTOS DO DOM
// ============================================
const $ = (id) => document.getElementById(id);

const el = {
    body: document.body,
    loginOverlay: $("login-overlay"),
    loginForm: $("login-form"),
    loginEmail: $("login-email"),
    loginPassword: $("login-password"),
    loginError: $("login-error"),
    loginSubmit: $("login-submit"),
    userEmail: $("user-email"),
    logoutBtn: $("logout-btn"),
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

function resetCharts() {
    Object.values(charts).forEach((c) => {
        c.data.labels = [];
        c.data.datasets[0].data = [];
        c.update("none");
    });
}

// ============================================
// LISTENERS RTDB (anexados só após login)
// ============================================
const currentRef = db.ref(`datacenter/devices/${DEVICE_ID}/current`);
const infoRef = db.ref(`datacenter/devices/${DEVICE_ID}/info`);
const readingsQuery = db
    .ref(`datacenter/readings/${DEVICE_ID}`)
    .orderByChild("timestamp")
    .limitToLast(MAX_POINTS);
const intrusionRef = db.ref(`datacenter/intrusion_events/${DEVICE_ID}`);
const intrusionQuery = intrusionRef
    .orderByChild("timestamp")
    .limitToLast(MAX_EVENTS);

let listenersAttached = false;
let latestCurrent = null;
let latestInfo = null;
let statusTimer = null;

const handlers = {
    current: (snap) => {
        latestCurrent = snap.val();
        evaluateStatus();
    },
    info: (snap) => {
        latestInfo = snap.val();
        renderDeviceInfo();
        evaluateStatus();
    },
    reading: (snap) => {
        const r = snap.val();
        const t = r.timestamp ? new Date(r.timestamp) : new Date();
        const label = t.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        pushPoint(charts.temp, label, r.temperature);
        pushPoint(charts.hum, label, r.humidity);
        pushPoint(charts.light, label, r.light_level);
        pushPoint(charts.volt, label, r.voltage_ac);
    },
    intrusionAdded: (snap) => addIntrusionEvent(snap.key, snap.val()),
    intrusionChanged: (snap) => addIntrusionEvent(snap.key, snap.val(), true)
};

function attachListeners() {
    if (listenersAttached) return;
    currentRef.on("value", handlers.current);
    infoRef.on("value", handlers.info);
    readingsQuery.on("child_added", handlers.reading);
    intrusionQuery.on("child_added", handlers.intrusionAdded);
    intrusionRef.on("child_changed", handlers.intrusionChanged);
    listenersAttached = true;
    statusTimer = setInterval(evaluateStatus, STATUS_RECHECK_MS);
}

function detachListeners() {
    if (!listenersAttached) return;
    currentRef.off("value", handlers.current);
    infoRef.off("value", handlers.info);
    readingsQuery.off("child_added", handlers.reading);
    intrusionQuery.off("child_added", handlers.intrusionAdded);
    intrusionRef.off("child_changed", handlers.intrusionChanged);
    listenersAttached = false;
    if (statusTimer) { clearInterval(statusTimer); statusTimer = null; }
    latestCurrent = null;
    latestInfo = null;
}

// ============================================
// AUTH
// ============================================
function mapAuthError(code) {
    switch (code) {
        case "auth/invalid-email": return "Email inválido.";
        case "auth/user-disabled": return "Usuário desativado.";
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential": return "Email ou senha incorretos.";
        case "auth/too-many-requests": return "Muitas tentativas. Aguarde alguns minutos.";
        case "auth/network-request-failed": return "Sem conexão com a internet.";
        default: return "Não foi possível entrar. Tente novamente.";
    }
}

function setLoginError(message) {
    if (!message) {
        el.loginError.hidden = true;
        el.loginError.textContent = "";
    } else {
        el.loginError.hidden = false;
        el.loginError.textContent = message;
    }
}

el.loginForm.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const email = el.loginEmail.value.trim();
    const password = el.loginPassword.value;
    if (!email || !password) return;

    setLoginError(null);
    el.loginSubmit.disabled = true;
    el.loginSubmit.textContent = "Entrando...";
    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
        setLoginError(mapAuthError(err.code));
    } finally {
        el.loginSubmit.disabled = false;
        el.loginSubmit.textContent = "Entrar";
    }
});

el.logoutBtn.addEventListener("click", async () => {
    await auth.signOut();
});

auth.onAuthStateChanged((user) => {
    if (user) {
        el.body.classList.remove("unauthenticated");
        el.body.classList.add("authenticated");
        el.userEmail.textContent = user.email || "";
        el.loginPassword.value = "";
        setLoginError(null);
        attachListeners();
    } else {
        detachListeners();
        resetCharts();
        renderedEvents.forEach((node) => node.remove());
        renderedEvents.clear();
        setStatus(false);
        clearCards();
        el.deviceInfo.textContent = "Aguardando dispositivo...";
        el.userEmail.textContent = "";
        el.body.classList.remove("authenticated");
        el.body.classList.add("unauthenticated");
    }
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

function computeOnline() {
    const ts = latestCurrent?.timestamp ?? latestInfo?.last_seen ?? 0;
    return ts > 0 && (Date.now() - ts) < OFFLINE_AFTER_MS;
}

function evaluateStatus() {
    const online = computeOnline();
    setStatus(online);
    if (online && latestCurrent) {
        updateCards(latestCurrent);
    } else {
        clearCards();
    }
}

function clearCards() {
    el.temp.textContent = "--";
    el.hum.textContent = "--";
    el.light.textContent = "--";
    el.volt.textContent = "--";
    el.energy.textContent = "--";
    el.energy.className = "";
    el.alarm.textContent = "--";
    el.alarm.className = "";
    el.cardTemp.className = "card";
    el.cardHum.className = "card";
    el.cardVolt.className = "card";
}

function renderDeviceInfo() {
    const info = latestInfo;
    if (!info) {
        el.deviceInfo.textContent = "Aguardando dispositivo...";
        return;
    }
    const ls = info.last_seen ? new Date(info.last_seen).toLocaleString("pt-BR") : "?";
    el.deviceInfo.textContent = `${info.name || DEVICE_ID} · ${info.location || ""} · último: ${ls}`;
}

function updateCards(d) {
    el.temp.textContent = d.temperature?.toFixed(1) ?? "--";
    el.hum.textContent = d.humidity?.toFixed(1) ?? "--";
    el.light.textContent = d.light_level?.toFixed(0) ?? "--";
    el.volt.textContent = d.voltage_ac?.toFixed(1) ?? "--";

    if (d.energy_source === "solar") {
        el.energy.textContent = "☀ SOLAR";
        el.energy.className = "solar";
    } else if (d.energy_source === "diesel") {
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
        intrusionRef.child(key).update({
            acknowledged: true,
            acknowledged_at: Date.now(),
            acknowledged_by: auth.currentUser?.email || "unknown"
        });
    });

    el.intrusion.prepend(node);
    renderedEvents.set(key, node);

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
