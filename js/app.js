import { Store } from './storage.js';
import { quoteForToday } from './quotes.js';
import { recordActivity, getHeatmapData, BADGES, levelForXp } from './gamification.js';
import { createRideTracker, saveRide, drawRoute } from './cycling.js';
import { EXERCISES, DAYS, RPE_OPTIONS, getLevelIndex, setLevelIndex, getNextDay, getWeeklyCount, logSession } from './strength.js';
import { addWeight, drawWeightChart } from './weight.js';
import { exerciseDiagramSvg, exerciseNote } from './illustrations.js';

function sanitizeUrl(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    if (u.protocol === 'http:' || u.protocol === 'https:') return url;
  } catch {}
  return '';
}

function formatTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function showNewBadges(newBadges) {
  newBadges.forEach((b, i) => setTimeout(() => toast(`${b.emoji} Nieuwe badge: ${b.name}`), i * 1400 + 400));
}

const DAY_LABELS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
function isoWeekday(date = new Date()) {
  return ((date.getDay() + 6) % 7) + 1;
}

function playlistLink(container, url) {
  container.innerHTML = '';
  const clean = sanitizeUrl(url);
  if (!clean) return;
  const a = document.createElement('a');
  a.className = 'link-btn';
  a.textContent = '🎧 Open speellijst';
  a.target = '_blank';
  a.rel = 'noopener';
  a.href = clean;
  a.style.display = 'block';
  a.style.marginBottom = '10px';
  container.appendChild(a);
}

/* ---------- navigation ---------- */
const screens = document.querySelectorAll('.screen');
function showScreen(name) {
  screens.forEach((s) => s.classList.toggle('active', s.id === 'screen-' + name));
  document.querySelectorAll('nav.tabbar button').forEach((b) => b.classList.toggle('active', b.dataset.nav === name));
  if (name === 'dashboard') renderDashboard();
  if (name === 'cycling') renderCycling();
  if (name === 'strength') renderStrength();
  if (name === 'weight') renderWeight();
  if (name === 'settings') renderSettings();
}
document.querySelectorAll('[data-nav]').forEach((el) => el.addEventListener('click', () => showScreen(el.dataset.nav)));

/* ---------- dashboard ---------- */
function renderDashboard() {
  const streak = Store.getStreak();
  document.getElementById('streak-current').textContent = streak.current;
  document.getElementById('streak-longest').textContent = streak.longest;
  document.getElementById('quote-text').textContent = '"' + quoteForToday() + '"';

  const strengthDays = Store.getSettings().strengthDays || [1, 3, 5];
  const today = isoWeekday();
  const strip = document.getElementById('week-strip');
  strip.innerHTML = '';
  DAY_LABELS.forEach((label, i) => {
    const dayNum = i + 1;
    const cell = document.createElement('div');
    cell.className = 'day-cell' + (dayNum === today ? ' today' : '');
    const icon = document.createElement('span');
    icon.className = 'icon';
    icon.textContent = strengthDays.includes(dayNum) ? '🏋️' : '🚴';
    const lab = document.createElement('span');
    lab.className = 'label';
    lab.textContent = label;
    cell.appendChild(icon);
    cell.appendChild(lab);
    strip.appendChild(cell);
  });
  document.getElementById('week-nudge').textContent = strengthDays.includes(today)
    ? '💪 Vandaag staat kracht gepland.'
    : '🚴 Vandaag lekker fietsen, kracht is een andere dag.';

  const rides = Store.getRides();
  const weekAgo = Date.now() - 7 * 86400000;
  const weekKm = rides.filter((r) => new Date(r.date).getTime() >= weekAgo).reduce((s, r) => s + r.distanceKm, 0);
  document.getElementById('week-km').textContent = weekKm.toFixed(1);
  document.getElementById('week-strength').textContent = `${getWeeklyCount()}/3`;
  document.getElementById('dash-level').textContent = levelForXp(Store.getXp());

  const heatmap = document.getElementById('heatmap');
  heatmap.innerHTML = '';
  getHeatmapData(70).forEach((d) => {
    const cell = document.createElement('div');
    cell.className = 'cell' + (d.level > 0 ? ' l' + d.level : '');
    cell.title = d.date;
    heatmap.appendChild(cell);
  });

  const earned = new Set(Store.getBadges().map((b) => b.id));
  const grid = document.getElementById('badge-grid');
  grid.innerHTML = '';
  BADGES.forEach((b) => {
    const div = document.createElement('div');
    div.className = 'badge' + (earned.has(b.id) ? ' earned' : '');
    const emoji = document.createElement('span');
    emoji.className = 'emoji';
    emoji.textContent = b.emoji;
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = b.name;
    div.appendChild(emoji);
    div.appendChild(name);
    grid.appendChild(div);
  });
}

/* ---------- cycling ---------- */
let tracker = null;
let liveTimerId = null;
let paused = false;

function updateLiveStats(stats) {
  document.getElementById('live-speed').textContent = stats.currentSpeed.toFixed(1);
  document.getElementById('live-distance').textContent = stats.distanceKm.toFixed(2);
  document.getElementById('live-avg').textContent = stats.avgSpeed.toFixed(1);
  document.getElementById('live-time').textContent = formatTime(stats.elapsedS);
}

function renderCycling() {
  document.getElementById('cycling-idle').style.display = tracker ? 'none' : 'block';
  document.getElementById('cycling-live').style.display = tracker ? 'block' : 'none';
  playlistLink(document.getElementById('cycling-playlist-btn'), Store.getSettings().playlistCycling);
  renderRidePRs();
  renderRideHistory();
}

document.getElementById('ride-start-btn').addEventListener('click', () => {
  document.getElementById('cycling-error').textContent = '';
  tracker = createRideTracker(updateLiveStats, (err) => {
    document.getElementById('cycling-error').textContent = 'Fout: ' + err;
  });
  tracker.start();
  document.getElementById('cycling-idle').style.display = 'none';
  document.getElementById('cycling-live').style.display = 'block';
  liveTimerId = setInterval(() => tracker && updateLiveStats(tracker.getStats()), 1000);
});

document.getElementById('ride-pause-btn').addEventListener('click', () => {
  if (!tracker) return;
  paused = !paused;
  if (paused) {
    tracker.pause();
    document.getElementById('ride-pause-btn').textContent = 'Hervat';
  } else {
    tracker.resume();
    document.getElementById('ride-pause-btn').textContent = 'Pauze';
  }
});

document.getElementById('ride-stop-btn').addEventListener('click', () => {
  if (!tracker) return;
  clearInterval(liveTimerId);
  const ride = tracker.stop();
  tracker = null;
  paused = false;
  document.getElementById('ride-pause-btn').textContent = 'Pauze';
  document.getElementById('cycling-idle').style.display = 'block';
  document.getElementById('cycling-live').style.display = 'none';

  if (ride.distanceKm < 0.05) {
    toast('Rit te kort om op te slaan.');
    renderCycling();
    return;
  }
  const { prs } = saveRide(ride);
  const { newBadges } = recordActivity(10 + Math.round(ride.distanceKm));
  toast(`Rit opgeslagen: ${ride.distanceKm} km in ${formatTime(ride.durationS)}`);
  let delay = 1200;
  if (prs.distance) { setTimeout(() => toast('🏆 Nieuw record: langste rit!'), delay); delay += 1200; }
  if (prs.avgSpeed) { setTimeout(() => toast('⚡ Nieuw record: hoogste gemiddelde snelheid!'), delay); delay += 1200; }
  if (prs.maxSpeed) { setTimeout(() => toast('⚡ Nieuw record: hoogste topsnelheid!'), delay); delay += 1200; }
  newBadges.forEach((b) => { setTimeout(() => toast(`${b.emoji} Nieuwe badge: ${b.name}`), delay); delay += 1200; });
  renderCycling();
});

function renderRidePRs() {
  const rides = Store.getRides();
  const box = document.getElementById('ride-prs');
  box.innerHTML = '';
  if (!rides.length) {
    box.innerHTML = '<p class="empty">Nog geen data</p>';
    return;
  }
  const longest = Math.max(...rides.map((r) => r.distanceKm));
  const bestAvg = Math.max(...rides.map((r) => r.avgSpeed));
  const bestMax = Math.max(...rides.map((r) => r.maxSpeed));
  [
    ['Langste rit', longest.toFixed(1) + ' km'],
    ['Beste gem.', bestAvg.toFixed(1) + ' km/u'],
    ['Topsnelheid', bestMax.toFixed(1) + ' km/u']
  ].forEach(([label, val]) => {
    const div = document.createElement('div');
    div.className = 'stat-box';
    const num = document.createElement('div');
    num.className = 'num';
    num.textContent = val;
    const lab = document.createElement('div');
    lab.className = 'label';
    lab.textContent = label;
    div.appendChild(num);
    div.appendChild(lab);
    box.appendChild(div);
  });
}

function renderRideHistory() {
  const rides = [...Store.getRides()].reverse();
  const container = document.getElementById('ride-history');
  container.innerHTML = '';
  if (!rides.length) {
    container.innerHTML = '<p class="empty">Nog geen ritten gelogd.</p>';
    return;
  }
  rides.slice(0, 20).forEach((r) => {
    const div = document.createElement('div');
    div.className = 'ride-item';
    div.style.cursor = 'pointer';
    const date = new Date(r.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
    const left = document.createElement('div');
    left.innerHTML = `<strong>${r.distanceKm} km</strong><div class="meta">${date} · ${formatTime(r.durationS)}</div>`;
    const right = document.createElement('div');
    right.className = 'meta';
    right.textContent = `${r.avgSpeed} km/u gem · ${r.maxSpeed} km/u max`;
    div.appendChild(left);
    div.appendChild(right);
    div.addEventListener('click', () => showRideDetail(r));
    container.appendChild(div);
  });
}

function showRideDetail(ride) {
  const container = document.getElementById('ride-history');
  container.innerHTML = '';
  const backBtn = document.createElement('button');
  backBtn.className = 'btn-secondary';
  backBtn.textContent = '← Terug naar geschiedenis';
  backBtn.style.marginBottom = '10px';
  backBtn.addEventListener('click', renderRideHistory);
  const canvas = document.createElement('canvas');
  canvas.className = 'route';
  canvas.width = 440;
  canvas.height = 200;
  container.appendChild(backBtn);
  container.appendChild(canvas);
  requestAnimationFrame(() => drawRoute(canvas, ride.points));
}

/* ---------- strength ---------- */
let activeSession = null;

function renderStrength() {
  document.getElementById('strength-idle').style.display = activeSession ? 'none' : 'block';
  document.getElementById('strength-active').style.display = activeSession ? 'block' : 'none';
  document.getElementById('strength-week-count').textContent = `${getWeeklyCount()}/3`;
  const nextDay = getNextDay();
  const strengthDays = Store.getSettings().strengthDays || [1, 3, 5];
  const plannedToday = strengthDays.includes(isoWeekday());
  document.getElementById('strength-next-day').textContent =
    `Volgende workout: ${DAYS[nextDay].label}` + (plannedToday ? ' · vandaag is een geplande dag' : '');
  playlistLink(document.getElementById('strength-playlist-btn'), Store.getSettings().playlistStrength);
  renderStrengthHistory();
}

document.getElementById('strength-start-btn').addEventListener('click', () => {
  const day = getNextDay();
  activeSession = {
    day,
    exercises: DAYS[day].exercises.map((id) => {
      const levelIndex = getLevelIndex(id);
      const levelDef = EXERCISES[id].levels[levelIndex];
      return { id, levelIndex, sets: new Array(levelDef.sets).fill(0), rpe: null };
    })
  };
  document.getElementById('strength-active-title').textContent = DAYS[day].label;
  renderStrengthExercises();
  document.getElementById('strength-idle').style.display = 'none';
  document.getElementById('strength-active').style.display = 'block';
});

function renderStrengthExercises() {
  const container = document.getElementById('strength-exercises');
  container.innerHTML = '';
  activeSession.exercises.forEach((log) => {
    const def = EXERCISES[log.id];
    const levelDef = def.levels[log.levelIndex];
    const unit = levelDef.unit === 's' ? 'sec' : 'reps';
    const block = document.createElement('div');
    block.className = 'exercise-block';
    const h3 = document.createElement('h3');
    h3.textContent = def.name;
    const target = document.createElement('div');
    target.className = 'target';
    target.textContent =
      unit === 'sec'
        ? `${levelDef.label} · ${levelDef.sets} sets van ${levelDef.reps} sec vasthouden`
        : `${levelDef.label} · ${levelDef.sets} sets van ${levelDef.reps} herhalingen`;
    const rest = document.createElement('div');
    rest.className = 'target';
    rest.style.marginTop = '-6px';
    rest.textContent = '⏱ Rust ~60-90 sec tussen elke set';
    const diagramWrap = document.createElement('div');
    diagramWrap.className = 'diagram-wrap';
    diagramWrap.innerHTML = exerciseDiagramSvg(log.id);
    const howTo = document.createElement('p');
    howTo.className = 'empty';
    howTo.style.textAlign = 'left';
    howTo.style.margin = '6px 0 10px';
    howTo.textContent = exerciseNote(log.id);
    block.appendChild(h3);
    block.appendChild(diagramWrap);
    block.appendChild(target);
    block.appendChild(rest);
    block.appendChild(howTo);

    log.sets.forEach((val, setIdx) => {
      const row = document.createElement('div');
      row.className = 'set-row';
      const setLabel = document.createElement('span');
      setLabel.className = 'set-label';
      setLabel.textContent = `Set ${setIdx + 1}`;
      const stepper = document.createElement('div');
      stepper.className = 'stepper';
      const minus = document.createElement('button');
      minus.type = 'button';
      minus.textContent = '−';
      const valSpan = document.createElement('span');
      valSpan.className = 'val';
      valSpan.textContent = val;
      const plus = document.createElement('button');
      plus.type = 'button';
      plus.textContent = '+';
      minus.addEventListener('click', () => {
        log.sets[setIdx] = Math.max(0, log.sets[setIdx] - 1);
        valSpan.textContent = log.sets[setIdx];
      });
      plus.addEventListener('click', () => {
        log.sets[setIdx] = log.sets[setIdx] + 1;
        valSpan.textContent = log.sets[setIdx];
      });
      stepper.appendChild(minus);
      stepper.appendChild(valSpan);
      stepper.appendChild(plus);
      row.appendChild(setLabel);
      row.appendChild(stepper);
      block.appendChild(row);
    });

    const rpeRow = document.createElement('div');
    rpeRow.className = 'rpe-row';
    RPE_OPTIONS.forEach((opt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = opt.label;
      btn.addEventListener('click', () => {
        log.rpe = opt.id;
        rpeRow.querySelectorAll('button').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
      rpeRow.appendChild(btn);
    });
    block.appendChild(rpeRow);
    container.appendChild(block);
  });
}

document.getElementById('strength-finish-btn').addEventListener('click', () => {
  const incomplete = activeSession.exercises.some((e) => !e.rpe);
  if (incomplete) {
    toast('Geef bij elke oefening aan hoe zwaar het voelde.');
    return;
  }
  const { leveledUp } = logSession(activeSession.day, activeSession.exercises);
  const { newBadges } = recordActivity(15);
  activeSession = null;
  toast('💪 Sessie opgeslagen!');
  let delay = 1200;
  leveledUp.forEach((l) => {
    setTimeout(() => toast(`🎉 Level omhoog: ${l.name} → ${l.newLabel}`), delay);
    delay += 1400;
  });
  newBadges.forEach((b) => {
    setTimeout(() => toast(`${b.emoji} Nieuwe badge: ${b.name}`), delay);
    delay += 1400;
  });
  renderStrength();
});

function renderStrengthHistory() {
  const sessions = [...Store.getStrengthSessions()].reverse();
  const container = document.getElementById('strength-history');
  container.innerHTML = '';
  if (!sessions.length) {
    container.innerHTML = '<p class="empty">Nog geen sessies gelogd.</p>';
    return;
  }
  sessions.slice(0, 20).forEach((s) => {
    const div = document.createElement('div');
    div.className = 'session-item';
    const date = new Date(s.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
    const left = document.createElement('div');
    left.innerHTML = `<strong>${DAYS[s.day].label}</strong><div class="meta">${date}</div>`;
    const right = document.createElement('div');
    right.className = 'meta';
    right.textContent = `${s.exercises.length} oefeningen`;
    div.appendChild(left);
    div.appendChild(right);
    container.appendChild(div);
  });
}

/* ---------- weight ---------- */
function renderWeight() {
  document.getElementById('weight-date').value = new Date().toISOString().slice(0, 10);
  const weights = Store.getWeights();
  drawWeightChart(document.getElementById('weight-chart'), weights);
  const settings = Store.getSettings();
  const note = document.getElementById('weight-goal-note');
  if (settings.goalWeightKg && weights.length) {
    const last = weights[weights.length - 1].kg;
    const diff = last - settings.goalWeightKg;
    note.textContent = diff > 0 ? `Nog ${diff.toFixed(1)} kg te gaan naar je doel van ${settings.goalWeightKg} kg` : 'Doelgewicht bereikt! 🎉';
  } else {
    note.textContent = '';
  }
  renderWeightHistory(weights);
}

document.getElementById('weight-save-btn').addEventListener('click', () => {
  const date = document.getElementById('weight-date').value;
  const kg = parseFloat(document.getElementById('weight-input').value);
  if (!date || !kg || kg <= 0) {
    toast('Vul een geldige datum en gewicht in.');
    return;
  }
  addWeight(date, kg);
  document.getElementById('weight-input').value = '';
  toast('Gewicht opgeslagen.');
  renderWeight();
});

function renderWeightHistory(weights) {
  const container = document.getElementById('weight-history');
  container.innerHTML = '';
  if (!weights.length) {
    container.innerHTML = '<p class="empty">Nog geen gewicht gelogd.</p>';
    return;
  }
  [...weights].reverse().slice(0, 20).forEach((w) => {
    const div = document.createElement('div');
    div.className = 'weight-item';
    const date = new Date(w.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
    const left = document.createElement('span');
    left.textContent = date;
    const right = document.createElement('strong');
    right.textContent = `${w.kg} kg`;
    div.appendChild(left);
    div.appendChild(right);
    container.appendChild(div);
  });
}

/* ---------- settings ---------- */
let selectedStrengthDays = [];

function renderSettings() {
  const settings = Store.getSettings();
  document.getElementById('settings-playlist-cycling').value = settings.playlistCycling || '';
  document.getElementById('settings-playlist-strength').value = settings.playlistStrength || '';
  document.getElementById('settings-goal-weight').value = settings.goalWeightKg || '';

  selectedStrengthDays = [...(settings.strengthDays || [1, 3, 5])];
  const dayPicker = document.getElementById('settings-strength-days');
  dayPicker.innerHTML = '';
  DAY_LABELS.forEach((label, i) => {
    const dayNum = i + 1;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.classList.toggle('selected', selectedStrengthDays.includes(dayNum));
    btn.addEventListener('click', () => {
      if (selectedStrengthDays.includes(dayNum)) {
        selectedStrengthDays = selectedStrengthDays.filter((d) => d !== dayNum);
      } else {
        selectedStrengthDays.push(dayNum);
      }
      btn.classList.toggle('selected', selectedStrengthDays.includes(dayNum));
    });
    dayPicker.appendChild(btn);
  });

  const levelsWrap = document.getElementById('settings-levels');
  levelsWrap.innerHTML = '';
  Object.entries(EXERCISES).forEach(([id, def]) => {
    const row = document.createElement('div');
    row.style.marginBottom = '10px';
    const label = document.createElement('label');
    label.textContent = def.name;
    const select = document.createElement('select');
    def.levels.forEach((lvl, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = `${idx + 1}. ${lvl.label} (${lvl.sets}x${lvl.reps}${lvl.unit === 's' ? 's' : ''})`;
      select.appendChild(opt);
    });
    select.value = getLevelIndex(id);
    select.addEventListener('change', () => setLevelIndex(id, parseInt(select.value, 10)));
    row.appendChild(label);
    row.appendChild(select);
    levelsWrap.appendChild(row);
  });
}

document.getElementById('settings-save-btn').addEventListener('click', () => {
  const settings = Store.getSettings();
  settings.playlistCycling = sanitizeUrl(document.getElementById('settings-playlist-cycling').value.trim());
  settings.playlistStrength = sanitizeUrl(document.getElementById('settings-playlist-strength').value.trim());
  const goal = parseFloat(document.getElementById('settings-goal-weight').value);
  settings.goalWeightKg = goal > 0 ? goal : null;
  settings.strengthDays = selectedStrengthDays.length ? [...selectedStrengthDays].sort() : [1, 3, 5];
  Store.saveSettings(settings);
  toast('Instellingen opgeslagen.');
});

document.getElementById('export-btn').addEventListener('click', () => {
  const data = Store.exportAll();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fitstreak-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('import-btn').addEventListener('click', () => document.getElementById('import-file').click());
document.getElementById('import-file').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      Store.importAll(data);
      toast('Backup geïmporteerd.');
      renderDashboard();
    } catch {
      toast('Ongeldig backup-bestand.');
    }
  };
  reader.readAsText(file);
});

/* ---------- init ---------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}

showScreen('dashboard');
