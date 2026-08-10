/* ===============================
    TAB NAVIGATION LOGIC
   =============================== */
function openTab(tabName) {
    document.querySelectorAll('.tab-panel').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabName).classList.add('active');
    event.currentTarget.classList.add('active');

    // Recenter instantly on Pragathi Central School when opening map tab
    if (tabName === 'map-tab' && map) {
        setTimeout(() => { 
            map.invalidateSize(); 
            map.setView([17.5204802, 78.3943493], 16);
        }, 100);
    }
}

/* ===============================
    MAP LOGIC (Leaflet.js)
   =============================== */
let map;
let markers = [];

const locations = [
    // Pragathi Nagar & Nizampet Locations
    { 
        name: "Pragathi Central School", 
        type: "School", 
        lat: 17.5204802, 
        lng: 78.3943493, 
        status: "orange", 
        desc: "Moderate ambient noise during daytime hours." 
    },
    { 
        name: "Mithila Nagar Park", 
        type: "Park", 
        lat: 17.5210, 
        lng: 78.3915, 
        status: "green", 
        desc: "Quiet residential park, ideal for outdoor reading." 
    },
    { 
        name: "Pragathi Nagar Lake Front", 
        type: "Park / Lake", 
        lat: 17.5115, 
        lng: 78.3855, 
        status: "orange", 
        desc: "Pleasant atmosphere with moderate pedestrian noise." 
    },
    { 
        name: "Elephant Circle Commercial Strip", 
        type: "Commercial Zone", 
        lat: 17.5185, 
        lng: 78.3895, 
        status: "red", 
        desc: "High traffic and street noise. Unsuitable for focus." 
    },
    { 
        name: "VNRVJIET Campus & Library", 
        type: "University Campus", 
        lat: 17.5335, 
        lng: 78.3860, 
        status: "green", 
        desc: "Peaceful academic environment with silent study halls." 
    },
    { 
        name: "Bandari Layout Community Park", 
        type: "Park", 
        lat: 17.5170, 
        lng: 78.3760, 
        status: "green", 
        desc: "Low ambient sound levels inside residential layout." 
    },
    { 
        name: "Nizampet Road Market Area", 
        type: "Market", 
        lat: 17.5100, 
        lng: 78.3780, 
        status: "red", 
        desc: "Loud commercial activities and vehicle noise." 
    },
    { 
        name: "Aditya Nagar Study Cafe", 
        type: "Cafe", 
        lat: 17.5230, 
        lng: 78.3850, 
        status: "orange", 
        desc: "Moderate chatter and ambient espresso machine sound." 
    },
    { 
        name: "Nizampet X Roads Junction", 
        type: "Transit Zone", 
        lat: 17.4985, 
        lng: 78.3830, 
        status: "red", 
        desc: "Heavy traffic bottleneck with noise exceeding 70 dB." 
    },

    // Other Key Hyderabad Locations
    { name: "State Central Library", type: "Library", lat: 17.3779, lng: 78.4727, status: "green", desc: "Extremely quiet reading halls." },
    { name: "British Council Library", type: "Library", lat: 17.4316, lng: 78.4503, status: "green", desc: "Modern, peaceful library environment." },
    { name: "KBR National Park", type: "Park", lat: 17.4241, lng: 78.4206, status: "green", desc: "Calm outdoor environment with shaded spots." },
    { name: "Charminar Market Area", type: "Market", lat: 17.3616, lng: 78.4747, status: "red", desc: "Heavy commercial noise." }
];

function initMap() {
    map = L.map('map').setView([17.5204802, 78.3943493], 16);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    renderMarkers(locations);
}

function renderMarkers(data) {
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    const colorMap = {
        'green': '#10b981',
        'orange': '#f59e0b',
        'red': '#ef4444'
    };

    data.forEach(loc => {
        let marker = L.circleMarker([loc.lat, loc.lng], {
            radius: 13,
            fillColor: colorMap[loc.status],
            color: "#ffffff",
            weight: 3,
            opacity: 1,
            fillOpacity: 0.95
        }).addTo(map);

        marker.bindPopup(`
            <div style="font-family: sans-serif; padding: 4px;">
                <b style="color: #059669; font-size: 1.15em;">${loc.name}</b><br>
                <i style="color: #64748b; font-size: 0.9em;">${loc.type}</i>
                <p style="margin-top: 8px; font-size: 0.95em; line-height: 1.4; color: #1e293b;">${loc.desc}</p>
            </div>
        `);
        markers.push(marker);
    });
}

function filterMap() {
    const query = document.getElementById('map-search').value.toLowerCase();
    const filtered = locations.filter(loc => 
        loc.name.toLowerCase().includes(query) || 
        loc.type.toLowerCase().includes(query)
    );
    renderMarkers(filtered);
}

window.onload = initMap;

/* ===============================
    DARK MODE TOGGLE LOGIC
   =============================== */
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    
    const btn = document.getElementById('theme-btn');
    if (btn) btn.innerText = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
    
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        const btn = document.getElementById('theme-btn');
        if (btn) btn.innerText = '☀️ Light Mode';
    }
});

/* ===============================
    NOISE METER LOGIC
   =============================== */
let audioContext, analyser, microphone, stream;
let isAnalyzing = false, animationFrameId;
let dbSamples = [], maxDb = 0;

async function toggleAnalysis() {
    const btn = document.getElementById('start-btn');
    const verdict = document.getElementById('analysis-verdict');

    if (isAnalyzing) {
        stopAnalysis();
        return;
    }

    try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;

        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);

        isAnalyzing = true;
        dbSamples = [];
        maxDb = 0;
        btn.innerText = "Stop Analysis";
        verdict.innerHTML = "<strong>Listening...</strong> Measuring ambient noise levels.";

        processAudio();

        setTimeout(() => { if (isAnalyzing) stopAnalysis(true); }, 5000);

    } catch (err) {
        verdict.innerHTML = "<strong>Error:</strong> Microphone access denied or unsupported browser.";
    }
}

function processAudio() {
    if (!isAnalyzing) return;
    const dataArray = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(dataArray);

    let sumSquares = 0;
    for (let i = 0; i < dataArray.length; i++) sumSquares += dataArray[i] * dataArray[i];
    const rms = Math.sqrt(sumSquares / dataArray.length);

    const dbFS = rms > 0 ? 20 * Math.log10(rms) : -100;
    const estimatedDbSpl = Math.max(30, Math.min(100, Math.round(dbFS + 100)));

    dbSamples.push(estimatedDbSpl);
    if (estimatedDbSpl > maxDb) maxDb = estimatedDbSpl;

    document.getElementById('live-db').innerText = `${estimatedDbSpl} dB`;
    document.getElementById('peak-db').innerText = `${maxDb} dB`;
    
    const fillPercent = Math.max(0, Math.min(100, ((estimatedDbSpl - 30) / 70) * 100));
    document.getElementById('meter-fill').style.width = `${fillPercent}%`;

    animationFrameId = requestAnimationFrame(processAudio);
}

function stopAnalysis(completed = false) {
    isAnalyzing = false;
    cancelAnimationFrame(animationFrameId);
    if (microphone) microphone.disconnect();
    if (analyser) analyser.disconnect();
    if (audioContext) audioContext.close();
    if (stream) stream.getTracks().forEach(track => track.stop());

    document.getElementById('start-btn').innerText = "Start Analysis";

    if (completed && dbSamples.length > 0) {
        const avgDb = Math.round(dbSamples.reduce((a, b) => a + b, 0) / dbSamples.length);
        let score = Math.max(0, Math.min(10, ((80 - avgDb) / 50) * 10)).toFixed(1);
        document.getElementById('quietness-score').innerText = `${score}/10`;

        const verdict = document.getElementById('analysis-verdict');
        if (avgDb < 45) {
            verdict.style.backgroundColor = "rgba(16, 185, 129, 0.15)";
            verdict.style.color = "#065f46";
            verdict.style.borderLeftColor = "#10b981";
            verdict.innerHTML = `<strong>Result:</strong> Excellent study zone (${avgDb} dB). Optimal for high-concentration work.`;
        } else if (avgDb < 65) {
            verdict.style.backgroundColor = "rgba(245, 158, 11, 0.15)";
            verdict.style.color = "#92400e";
            verdict.style.borderLeftColor = "#f59e0b";
            verdict.innerHTML = `<strong>Result:</strong> Moderate noise environment (${avgDb} dB). Suitable for light tasks.`;
        } else {
            verdict.style.backgroundColor = "rgba(239, 68, 68, 0.15)";
            verdict.style.color = "#991b1b";
            verdict.style.borderLeftColor = "#ef4444";
            verdict.innerHTML = `<strong>Result:</strong> High distraction zone (${avgDb} dB). Relocate to a quieter area.`;
        }
    } else {
        document.getElementById('analysis-verdict').innerText = "Analysis stopped.";
    }
}