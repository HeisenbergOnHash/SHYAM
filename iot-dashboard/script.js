// IoT Dashboard Mock Data & Logic
// -----------------------------------
// Student-friendly comments included!

// Machine thresholds
const TEMP_THRESHOLD = 80; // Celsius
const VIBRATION_THRESHOLD = 7; // mm/s

// Dummy machine list
const machines = [
  { id: 1, name: 'Compressor A' },
  { id: 2, name: 'Lathe B' },
  { id: 3, name: 'Pump C' },
  { id: 4, name: 'Conveyor D' },
  { id: 5, name: 'Mixer E' }
];

// State for each machine
let machineStates = {};
let lastUpdateTime = new Date();

// Load ON/OFF state from localStorage (optional persistence)
function loadStates() {
  const saved = localStorage.getItem('machineStates');
  if (saved) {
    machineStates = JSON.parse(saved);
  } else {
    machines.forEach(m => {
      machineStates[m.id] = {
        status: Math.random() > 0.5 ? 'Running' : 'Stopped',
        power: 0,
        efficiency: 0,
        temperature: 0,
        vibration: 0,
        history: { power: [], efficiency: [], uptime: [] },
        alert: false
      };
    });
  }
}

// Save ON/OFF state to localStorage
function saveStates() {
  localStorage.setItem('machineStates', JSON.stringify(machineStates));
}

// Generate random data for each machine
function updateMachineData() {
  machines.forEach(m => {
    const state = machineStates[m.id];
    if (state.status === 'Running') {
      state.power = Math.round(500 + Math.random() * 500); // 500-1000W
      state.efficiency = Math.round(60 + Math.random() * 40); // 60-100%
      state.temperature = Math.round(50 + Math.random() * 40); // 50-90C
      state.vibration = +(2 + Math.random() * 8).toFixed(1); // 2-10 mm/s
    } else {
      state.power = 0;
      state.efficiency = 0;
      state.temperature = Math.round(25 + Math.random() * 5); // 25-30C
      state.vibration = +(0.5 + Math.random()).toFixed(1); // 0.5-1.5 mm/s
    }
    // Save history for charts
    state.history.power.push(state.power);
    state.history.efficiency.push(state.efficiency);
    state.history.uptime.push(state.status === 'Running' ? 1 : 0);
    // Keep history arrays short
    if (state.history.power.length > 20) state.history.power.shift();
    if (state.history.efficiency.length > 20) state.history.efficiency.shift();
    if (state.history.uptime.length > 20) state.history.uptime.shift();
    // Check for alerts
    state.alert = state.temperature > TEMP_THRESHOLD || state.vibration > VIBRATION_THRESHOLD;
  });
  saveStates();
  lastUpdateTime = new Date();
}

// Render machine cards
function renderMachines() {
  const container = document.getElementById('machines-container');
  container.innerHTML = '';
  machines.forEach(m => {
    const state = machineStates[m.id];
    const card = document.createElement('div');
    card.className = `col-md-4 mb-4`;
    card.innerHTML = `
      <div class="card machine-card ${state.alert ? 'machine-alert' : ''} ${state.status === 'Running' ? 'card-status-running' : 'card-status-stopped'}">
        <div class="card-body">
          <div class="d-flex align-items-center mb-2">
            <span class="live-indicator"></span>
            <span class="text-muted small">Live updating</span>
          </div>
          <h5 class="card-title">${m.name}</h5>
          <p>Status: <span class="fw-bold">${state.status}</span></p>
          <p>Power: <span>${state.power} W</span></p>
          <p>Efficiency: <span>${state.efficiency} %</span></p>
          <p>Temperature: <span>${state.temperature} °C</span></p>
          <p>Vibration: <span>${state.vibration} mm/s</span></p>
          <button class="btn btn-${state.status === 'Running' ? 'danger' : 'success'} btn-sm" onclick="toggleMachine(${m.id})">
            Turn ${state.status === 'Running' ? 'OFF' : 'ON'}
          </button>
          <p class="mt-2 mb-0 text-end text-muted" style="font-size: 0.85em;">Last updated: ${lastUpdateTime.toLocaleTimeString()}</p>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// Toggle machine ON/OFF
function toggleMachine(id) {
  const state = machineStates[id];
  state.status = state.status === 'Running' ? 'Stopped' : 'Running';
  saveStates();
  renderMachines();
}

// Show alert banner if any machine crosses safe limits
function renderAlerts() {
  const banner = document.getElementById('alert-banner');
  const alertMachines = machines.filter(m => machineStates[m.id].alert);
  if (alertMachines.length > 0) {
    banner.textContent = `ALERT: ${alertMachines.map(m => m.name).join(', ')} crossed safe limits!`;
    banner.classList.remove('d-none');
  } else {
    banner.classList.add('d-none');
  }
}

// Chart.js setup
let powerChart, efficiencyChart, uptimeChart;
function renderCharts() {
  // Power Consumption Chart
  const powerCtx = document.getElementById('powerChart').getContext('2d');
  if (powerChart) powerChart.destroy();
  powerChart = new Chart(powerCtx, {
    type: 'line',
    data: {
      labels: Array(20).fill('').map((_, i) => `T-${20-i}`),
      datasets: machines.map(m => ({
        label: m.name,
        data: machineStates[m.id].history.power,
        borderColor: getColor(m.id),
        fill: false
      }))
    },
    options: {
      plugins: { legend: { display: true } },
      responsive: true,
      scales: { y: { beginAtZero: true } }
    }
  });
  // Efficiency Chart
  const effCtx = document.getElementById('efficiencyChart').getContext('2d');
  if (efficiencyChart) efficiencyChart.destroy();
  efficiencyChart = new Chart(effCtx, {
    type: 'line',
    data: {
      labels: Array(20).fill('').map((_, i) => `T-${20-i}`),
      datasets: machines.map(m => ({
        label: m.name,
        data: machineStates[m.id].history.efficiency,
        borderColor: getColor(m.id),
        fill: false
      }))
    },
    options: {
      plugins: { legend: { display: true } },
      responsive: true,
      scales: { y: { beginAtZero: true, max: 100 } }
    }
  });
  // Uptime vs Downtime Chart
  const uptimeCtx = document.getElementById('uptimeChart').getContext('2d');
  if (uptimeChart) uptimeChart.destroy();
  uptimeChart = new Chart(uptimeCtx, {
    type: 'bar',
    data: {
      labels: machines.map(m => m.name),
      datasets: [{
        label: 'Uptime (%)',
        data: machines.map(m => {
          const arr = machineStates[m.id].history.uptime;
          return arr.length ? Math.round(100 * arr.reduce((a,b) => a+b, 0) / arr.length) : 0;
        }),
        backgroundColor: machines.map(m => getColor(m.id))
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      responsive: true,
      scales: { y: { beginAtZero: true, max: 100 } }
    }
  });
}

// Helper to get color for charts
function getColor(id) {
  const colors = ['#007bff', '#28a745', '#ffc107', '#17a2b8', '#dc3545'];
  return colors[(id-1)%colors.length];
}

// Main update loop
function mainLoop() {
  updateMachineData();
  renderTotals();
  renderMachines();
  renderAlerts();
  renderCharts();
}

// Initial setup
loadStates();
mainLoop();
setInterval(mainLoop, 3000); // Update every 3 seconds

// Expose toggleMachine globally for button onclick
window.toggleMachine = toggleMachine;

// Render total power and average efficiency
function renderTotals() {
  let totalPower = 0;
  let effSum = 0;
  let runningCount = 0;
  machines.forEach(m => {
    const state = machineStates[m.id];
    totalPower += state.power;
    if (state.status === 'Running') {
      effSum += state.efficiency;
      runningCount++;
    }
  });
  document.getElementById('total-power').textContent = totalPower;
  document.getElementById('avg-efficiency').textContent = runningCount ? Math.round(effSum / runningCount) : 0;
}
