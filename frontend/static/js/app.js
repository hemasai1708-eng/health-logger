//const API = 'http://127.0.0.1:5000/api';
const API = window.location.port === '3000' ? 'http://127.0.0.1:5000/api' : '/api';
const today = () => new Date().toISOString().slice(0, 10);

// ── Chart instances ──────────────────────────────────────────────────
const charts = {};

Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = '#64748b';

function makeChart(id, type, labels, data, color, label) {
  const ctx = document.getElementById(id).getContext('2d');
  if (charts[id]) charts[id].destroy();
  charts[id] = new Chart(ctx, {
    type,
    data: {
      labels,
      datasets: [{
        label,
        data,
        backgroundColor: color + '33',
        borderColor: color,
        borderWidth: 2,
        borderRadius: type === 'bar' ? 6 : 0,
        tension: 0.4,
        fill: type !== 'bar',
        pointRadius: 3,
        pointBackgroundColor: color,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 6 } },
        y: { grid: { color: '#e2e8f0' }, beginAtZero: type === 'bar' },
      }
    }
  });
}

// ── Tab navigation ───────────────────────────────────────────────────
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab !== 'dashboard') loadTableData(btn.dataset.tab);
  });
});

// ── Modal helpers ────────────────────────────────────────────────────
function openModal(id) {
  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById(id).classList.add('open');
  // Set today's date
  const dateFields = document.querySelectorAll(`#${id} input[type=date]`);
  dateFields.forEach(f => { if (!f.value) f.value = today(); });
}
function closeAllModals() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('open'));
}

// ── API helper ───────────────────────────────────────────────────────
async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  return res.json();
}

// ── STATS / DASHBOARD ────────────────────────────────────────────────
async function loadStats() {
  const s = await api('GET', '/stats');

  const cards = [
    { label: 'Workout sessions',    value: s.workouts.total_sessions,         sub: `${s.workouts.streak_days} day streak`, cls: 'green' },
    { label: 'Calories burned',     value: s.workouts.total_calories_burned,   sub: `Avg ${s.workouts.avg_duration_min} min/session`, cls: 'blue' },
    { label: 'Avg daily nutrition', value: Math.round(s.nutrition.avg_daily_calories) || '—', sub: `Avg protein: ${s.nutrition.avg_protein_g}g`, cls: 'amber' },
    { label: 'Avg sleep',           value: s.sleep.avg_hours + 'h',           sub: `Std dev: ±${s.sleep.std_hours}h`, cls: 'purple' },
    { label: 'Current weight',      value: s.weight.latest_kg ? s.weight.latest_kg + ' kg' : '—', sub: `BMI: ${s.weight.latest_bmi || '—'}`, cls: 'rose' },
  ];

  document.getElementById('stat-cards').innerHTML = cards.map(c => `
    <div class="stat-card ${c.cls}">
      <div class="label">${c.label}</div>
      <div class="value">${c.value}</div>
      <div class="sub">${c.sub}</div>
    </div>
  `).join('');

  // Load chart data
  const [workouts, nutrition, sleep, weight] = await Promise.all([
    api('GET', '/workouts'),
    api('GET', '/nutrition'),
    api('GET', '/sleep'),
    api('GET', '/weight'),
  ]);

  renderCharts(workouts, nutrition, sleep, weight);
}

function renderCharts(workouts, nutrition, sleep, weight) {
  const take = (arr, key) => arr.slice(-10).map(r => r[key]);
  const lbl  = (arr, key='date') => arr.slice(-10).map(r => r[key]?.slice(5)); // MM-DD

  if (workouts.length) {
    makeChart('workoutChart', 'bar',
      lbl(workouts), take(workouts, 'calories'), '#22c55e', 'Calories');
  }
  if (sleep.length) {
    makeChart('sleepChart', 'line',
      lbl(sleep), take(sleep, 'hours'), '#8b5cf6', 'Hours');
  }
  if (nutrition.length) {
    makeChart('nutritionChart', 'line',
      lbl(nutrition), take(nutrition, 'calories'), '#f59e0b', 'Calories');
  }
  if (weight.length) {
    makeChart('weightChart', 'line',
      lbl(weight), take(weight, 'weight_kg'), '#f43f5e', 'kg');
  }
}

// ── TABLE LOADERS ────────────────────────────────────────────────────
const qualityBadge = q => {
  const map = { Excellent: 'green', Good: 'blue', Fair: 'amber', Poor: 'rose' };
  return `<span class="badge badge-${map[q] || 'blue'}">${q}</span>`;
};

const typeBadge = t => `<span class="badge badge-blue">${t}</span>`;

async function loadTableData(tab) {
  if (tab === 'workouts') {
    const data = await api('GET', '/workouts');
    const tbody = document.getElementById('workouts-body');
    tbody.innerHTML = data.length ? data.map(r => `
      <tr>
        <td>${r.date}</td>
        <td>${typeBadge(r.type)}</td>
        <td>${r.duration_min}</td>
        <td>${r.calories}</td>
        <td style="color:var(--muted);font-size:13px">${r.notes || '—'}</td>
        <td><button class="btn-icon" onclick="deleteItem('workouts',${r.id})">🗑</button></td>
      </tr>`).join('') : '<tr class="empty-row"><td colspan="6">No workouts yet. Add your first session!</td></tr>';
  }

  if (tab === 'nutrition') {
    const data = await api('GET', '/nutrition');
    const tbody = document.getElementById('nutrition-body');
    tbody.innerHTML = data.length ? data.map(r => `
      <tr>
        <td>${r.date}</td>
        <td>${r.meal}</td>
        <td>${r.calories}</td>
        <td>${r.protein_g}</td>
        <td>${r.carbs_g}</td>
        <td>${r.fat_g}</td>
        <td><button class="btn-icon" onclick="deleteItem('nutrition',${r.id})">🗑</button></td>
      </tr>`).join('') : '<tr class="empty-row"><td colspan="7">No meals logged yet.</td></tr>';
  }

  if (tab === 'sleep') {
    const data = await api('GET', '/sleep');
    const tbody = document.getElementById('sleep-body');
    tbody.innerHTML = data.length ? data.map(r => `
      <tr>
        <td>${r.date}</td>
        <td>${r.hours}</td>
        <td>${r.bed_time || '—'}</td>
        <td>${qualityBadge(r.quality)}</td>
        <td style="color:var(--muted);font-size:13px">${r.notes || '—'}</td>
        <td><button class="btn-icon" onclick="deleteItem('sleep',${r.id})">🗑</button></td>
      </tr>`).join('') : '<tr class="empty-row"><td colspan="5">No sleep logs yet.</td></tr>';
  }

  if (tab === 'weight') {
    const data = await api('GET', '/weight');
    const tbody = document.getElementById('weight-body');
    tbody.innerHTML = data.length ? data.map(r => `
      <tr>
        <td>${r.date}</td>
        <td>${r.weight_kg} kg</td>
        <td>${r.bmi}</td>
        <td><button class="btn-icon" onclick="deleteItem('weight',${r.id})">🗑</button></td>
      </tr>`).join('') : '<tr class="empty-row"><td colspan="4">No weight entries yet.</td></tr>';
  }
}

// ── SAVE HANDLERS ────────────────────────────────────────────────────
async function saveWorkout() {
  await api('POST', '/workouts', {
    date:         document.getElementById('w-date').value,
    type:         document.getElementById('w-type').value,
    duration_min: document.getElementById('w-duration').value,
    calories:     document.getElementById('w-calories').value,
    notes:        document.getElementById('w-notes').value,
  });
  closeAllModals();
  loadStats();
}

async function saveNutrition() {
  await api('POST', '/nutrition', {
    date:      document.getElementById('n-date').value,
    meal:      document.getElementById('n-meal').value,
    calories:  document.getElementById('n-calories').value,
    protein_g: document.getElementById('n-protein').value,
    carbs_g:   document.getElementById('n-carbs').value,
    fat_g:     document.getElementById('n-fat').value,
  });
  closeAllModals();
  loadTableData('nutrition');
}

async function saveSleep() {
  await api('POST', '/sleep', {
    date:    document.getElementById('s-date').value,
    hours:   document.getElementById('s-hours').value,
    bedtime: document.getElementById('s-bedtime').value,
    quality: document.getElementById('s-quality').value,
    notes:   document.getElementById('s-notes').value,
  });
  closeAllModals();
  loadTableData('sleep');
}

async function saveWeight() {
  await api('POST', '/weight', {
    date:      document.getElementById('wt-date').value,
    weight_kg: document.getElementById('wt-weight').value,
    height_m:  document.getElementById('wt-height').value,
  });
  closeAllModals();
  loadTableData('weight');
}

// ── DELETE ───────────────────────────────────────────────────────────
async function deleteItem(resource, id) {
  if (!confirm('Delete this entry?')) return;
  await api('DELETE', `/${resource}/${id}`);
  const tab = document.querySelector('.nav-btn.active').dataset.tab;
  if (tab === 'dashboard') loadStats();
  else loadTableData(tab);
}

// ── Init ─────────────────────────────────────────────────────────────
loadStats();
