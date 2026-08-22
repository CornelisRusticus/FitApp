import { Store } from './storage.js';
import { quoteForToday } from './quotes.js';
import { recordActivity, getHeatmapData, BADGES, levelForXp } from './gamification.js';
import { ACTIVITY_TYPES, CARDIO_LEVELS, getCurrentWeekEffectiveMinutes, checkCardioProgression, avgSpeedOf, logActivity, updateActivity, deleteActivity } from './activity.js';
import { EXERCISES, DAYS, RPE_OPTIONS, getLevelIndex, setLevelIndex, getNextDay, getWeeklyCount, logSession } from './strength.js';
import { addWeight, drawWeightChart } from './weight.js';
import { exerciseDiagramSvg, exerciseNote, resolvePoseKey } from './illustrations.js';

function sanitizeUrl(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    if (u.protocol === 'http:' || u.protocol === 'https:') return url;
  } catch {}
  return '';
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
  if (name === 'cardio') renderCardio();
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
    : '🚴 Vandaag lekker bewegen (fietsen, suppen, wandelen), kracht is een andere dag.';

  document.getElementById('week-cardio-min').textContent = Math.round(getCurrentWeekEffectiveMinutes());
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

/* ---------- cardio ---------- */
let selectedActivityType = 'cycling';

function updateDistanceFieldVisibility() {
  const hasDistance = ACTIVITY_TYPES[selectedActivityType].hasDistance;
  const label = document.getElementById('ride-distance-label');
  const input = document.getElementById('ride-distance');
  label.style.display = hasDistance ? 'block' : 'none';
  input.style.display = hasDistance ? 'block' : 'none';
  if (!hasDistance) input.value = '';
}

function renderActivityTypePicker() {
  const picker = document.getElementById('activity-type-picker');
  picker.innerHTML = '';
  Object.entries(ACTIVITY_TYPES).forEach(([id, type]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = `${type.emoji} ${type.label}`;
    btn.classList.toggle('selected', id === selectedActivityType);
    btn.addEventListener('click', () => {
      selectedActivityType = id;
      picker.querySelectorAll('button').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      updateDistanceFieldVisibility();
    });
    picker.appendChild(btn);
  });
}

function renderCardio() {
  playlistLink(document.getElementById('cardio-playlist-btn'), Store.getSettings().playlistCardio);
  document.getElementById('ride-date').value = new Date().toISOString().slice(0, 10);
  document.getElementById('ride-minutes').value = '';
  document.getElementById('ride-distance').value = '';
  document.querySelectorAll('#duration-presets button').forEach((b) => b.classList.remove('selected'));
  renderActivityTypePicker();
  updateDistanceFieldVisibility();

  const level = Store.getCardioLevel();
  const plan = CARDIO_LEVELS[level];
  document.getElementById('cardio-plan-label').textContent = `Niveau: ${plan.label}`;
  document.getElementById('cardio-plan-desc').textContent = plan.description;
  document.getElementById('cardio-coach-tip').textContent = plan.coachTip || '';
  document.getElementById('cardio-week-min').textContent = Math.round(getCurrentWeekEffectiveMinutes());
  document.getElementById('cardio-week-target').textContent = plan.weeklyTargetMin;

  renderRidePRs();
  renderRideHistory();
}

document.querySelectorAll('#duration-presets button').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#duration-presets button').forEach((b) => b.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById('ride-minutes').value = btn.dataset.min;
  });
});

function finishActivityLog(minutes, distanceKm, prs, newBadges) {
  const typeLabel = ACTIVITY_TYPES[selectedActivityType].label;
  toast(`${typeLabel} opgeslagen: ${minutes} min${distanceKm ? ' · ' + distanceKm + ' km' : ''}`);
  let delay = 1200;
  if (prs.duration) { setTimeout(() => toast('🏆 Nieuw record: langste activiteit!'), delay); delay += 1200; }
  if (prs.distance) { setTimeout(() => toast('📏 Nieuw record: verste afstand!'), delay); delay += 1200; }
  newBadges.forEach((b) => { setTimeout(() => toast(`${b.emoji} Nieuwe badge: ${b.name}`), delay); delay += 1200; });
  const leveledUpPlan = checkCardioProgression();
  if (leveledUpPlan) { setTimeout(() => toast(`🚴 Cardio-plan omhoog: ${leveledUpPlan.label}!`), delay); delay += 1200; }
  renderCardio();
}

document.getElementById('ride-log-btn').addEventListener('click', () => {
  const minutes = parseFloat(document.getElementById('ride-minutes').value);
  const distanceKm = parseFloat(document.getElementById('ride-distance').value) || 0;
  const date = document.getElementById('ride-date').value;
  if (!minutes || minutes <= 0) {
    toast('Vul aan hoeveel minuten je actief was.');
    return;
  }
  const { prs } = logActivity({ type: selectedActivityType, minutes, distanceKm, date: date ? new Date(date).toISOString() : undefined });
  const { newBadges } = recordActivity(10 + Math.round(minutes / 10));
  finishActivityLog(minutes, distanceKm, prs, newBadges);
});

function renderRidePRs() {
  const activities = Store.getActivities();
  const box = document.getElementById('ride-prs');
  box.innerHTML = '';
  if (!activities.length) {
    box.innerHTML = '<p class="empty">Nog geen data</p>';
    return;
  }
  const longestMin = Math.max(...activities.map((a) => a.durationS / 60));
  const stats = [['Langste activiteit', Math.round(longestMin) + ' min']];
  const farthest = Math.max(...activities.map((a) => a.distanceKm || 0));
  if (farthest > 0) stats.push(['Verste afstand', farthest.toFixed(1) + ' km']);
  const bestAvg = Math.max(...activities.map((a) => avgSpeedOf(a)));
  if (bestAvg > 0) stats.push(['Beste gem.', bestAvg.toFixed(1) + ' km/u']);
  stats.forEach(([label, val]) => {
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
  const activities = [...Store.getActivities()].reverse();
  const container = document.getElementById('ride-history');
  container.innerHTML = '';
  if (!activities.length) {
    container.innerHTML = '<p class="empty">Nog geen activiteiten gelogd.</p>';
    return;
  }
  activities.slice(0, 30).forEach((a) => {
    const type = ACTIVITY_TYPES[a.type] || ACTIVITY_TYPES.cycling;
    const div = document.createElement('div');
    div.className = 'ride-item';
    div.style.cursor = 'pointer';
    const date = new Date(a.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
    const left = document.createElement('div');
    left.innerHTML = `<strong>${type.emoji} ${Math.round(a.durationS / 60)} min</strong><div class="meta">${type.label} · ${date}</div>`;
    const right = document.createElement('div');
    right.className = 'meta';
    right.textContent = a.distanceKm ? `${a.distanceKm} km` : '';
    div.appendChild(left);
    div.appendChild(right);
    div.addEventListener('click', () => showRideEdit(a));
    container.appendChild(div);
  });
}

function showRideEdit(activity) {
  const container = document.getElementById('ride-history');
  container.innerHTML = '';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn-secondary';
  backBtn.textContent = '← Terug naar geschiedenis';
  backBtn.style.marginBottom = '10px';
  backBtn.addEventListener('click', renderRideHistory);

  const typeRow = document.createElement('div');
  typeRow.className = 'preset-row';
  let editType = activity.type || 'cycling';
  Object.entries(ACTIVITY_TYPES).forEach(([id, type]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = `${type.emoji} ${type.label}`;
    btn.classList.toggle('selected', id === editType);
    btn.addEventListener('click', () => {
      editType = id;
      typeRow.querySelectorAll('button').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
    typeRow.appendChild(btn);
  });

  const minutesLabel = document.createElement('label');
  minutesLabel.textContent = 'Minuten';
  const minutesInput = document.createElement('input');
  minutesInput.type = 'number';
  minutesInput.min = '1';
  minutesInput.value = Math.round(activity.durationS / 60);

  const distanceLabel = document.createElement('label');
  distanceLabel.textContent = 'Afstand in km (optioneel)';
  const distanceInput = document.createElement('input');
  distanceInput.type = 'number';
  distanceInput.step = '0.1';
  distanceInput.value = activity.distanceKm || '';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn-primary';
  saveBtn.textContent = 'Opslaan';
  saveBtn.style.marginTop = '12px';
  saveBtn.addEventListener('click', () => {
    const minutes = parseFloat(minutesInput.value);
    if (!minutes || minutes <= 0) {
      toast('Vul een geldig aantal minuten in.');
      return;
    }
    updateActivity(activity.id, { minutes, distanceKm: parseFloat(distanceInput.value) || 0, type: editType });
    toast('Activiteit bijgewerkt.');
    renderCardio();
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn-danger';
  deleteBtn.textContent = 'Verwijder deze activiteit';
  deleteBtn.style.marginTop = '8px';
  deleteBtn.style.width = '100%';
  deleteBtn.addEventListener('click', () => {
    deleteActivity(activity.id);
    toast('Activiteit verwijderd.');
    renderCardio();
  });

  container.appendChild(backBtn);
  container.appendChild(typeRow);
  container.appendChild(minutesLabel);
  container.appendChild(minutesInput);
  container.appendChild(distanceLabel);
  container.appendChild(distanceInput);
  container.appendChild(saveBtn);
  container.appendChild(deleteBtn);
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

const REST_SECONDS = 75;

function startRestTimer(timerEl) {
  clearInterval(timerEl._interval);
  let remaining = REST_SECONDS;
  timerEl.classList.add('active');
  timerEl.textContent = `⏱ Rust: ${remaining}s`;
  timerEl._interval = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      clearInterval(timerEl._interval);
      timerEl.textContent = '✅ Klaar voor de volgende set!';
      setTimeout(() => timerEl.classList.remove('active'), 2500);
      return;
    }
    timerEl.textContent = `⏱ Rust: ${remaining}s`;
  }, 1000);
}

let audioCtx = null;
function beep(freq = 880, durationMs = 150, type = 'sine') {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + durationMs / 1000);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + durationMs / 1000 + 0.02);
  } catch {}
}

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'nl-NL';
    u.rate = 1.0;
    window.speechSynthesis.speak(u);
  } catch {}
}

function startHoldTimer(row, setLabel, checkIcon, totalSeconds, onDone) {
  beep(660, 80);
  row.classList.add('timing');
  checkIcon.textContent = '⏸';
  let remaining = totalSeconds;
  setLabel.textContent = `⏳ nog ${remaining}s`;
  row._timerInterval = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      clearInterval(row._timerInterval);
      row._timerInterval = null;
      row.classList.remove('timing');
      beep(1046, 300, 'square');
      if (navigator.vibrate) navigator.vibrate([150, 80, 150]);
      speak('Klaar!');
      onDone();
      return;
    }
    setLabel.textContent = `⏳ nog ${remaining}s`;
    if (remaining % 10 === 0) {
      beep(660, 100);
      speak(String(remaining));
    }
  }, 1000);
}

function cancelHoldTimer(row, setLabel, checkIcon, baseLabel) {
  if (!row._timerInterval) return;
  clearInterval(row._timerInterval);
  row._timerInterval = null;
  row.classList.remove('timing');
  setLabel.textContent = baseLabel;
  checkIcon.textContent = '☐';
}

function youtubeSearchUrl(name) {
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(name + ' oefening juiste vorm uitleg');
}

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
    const videoLink = document.createElement('a');
    videoLink.className = 'link-btn video-link';
    videoLink.textContent = '▶️ Bekijk uitleg op YouTube';
    videoLink.target = '_blank';
    videoLink.rel = 'noopener';
    videoLink.href = youtubeSearchUrl(def.name);
    videoLink.style.display = 'block';
    const target = document.createElement('div');
    target.className = 'target';
    target.textContent =
      unit === 'sec'
        ? `${levelDef.label} · ${levelDef.sets} sets van ${levelDef.reps} sec vasthouden`
        : `${levelDef.label} · ${levelDef.sets} sets van ${levelDef.reps} herhalingen`;
    const poseKey = resolvePoseKey(log.id, levelDef.label);
    const diagramWrap = document.createElement('div');
    diagramWrap.className = 'diagram-wrap';
    diagramWrap.innerHTML = exerciseDiagramSvg(poseKey);
    const howTo = document.createElement('p');
    howTo.className = 'empty';
    howTo.style.textAlign = 'left';
    howTo.style.margin = '6px 0 10px';
    howTo.textContent = exerciseNote(poseKey);
    block.appendChild(h3);
    block.appendChild(videoLink);
    block.appendChild(diagramWrap);
    block.appendChild(target);
    block.appendChild(howTo);
    if (def.equipment) {
      const equip = document.createElement('p');
      equip.className = 'empty';
      equip.style.textAlign = 'left';
      equip.style.margin = '0 0 10px';
      equip.textContent = '🧰 ' + def.equipment;
      block.appendChild(equip);
    }

    const restTimer = document.createElement('div');
    restTimer.className = 'rest-timer';

    log.sets.forEach((val, setIdx) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'set-check';
      const setLabel = document.createElement('span');
      setLabel.textContent = unit === 'sec' ? `Set ${setIdx + 1} · ${levelDef.reps} sec` : `Set ${setIdx + 1} · ${levelDef.reps} reps`;
      const checkIcon = document.createElement('span');
      checkIcon.className = 'check-icon';
      const baseLabel = setLabel.textContent;
      const applyState = () => {
        const done = log.sets[setIdx] >= levelDef.reps;
        setLabel.textContent = baseLabel;
        row.classList.toggle('done', done);
        checkIcon.textContent = done ? '✅' : '☐';
      };
      applyState();
      row.addEventListener('click', () => {
        if (unit === 'sec') {
          if (row._timerInterval) {
            cancelHoldTimer(row, setLabel, checkIcon, baseLabel);
            return;
          }
          const wasDone = log.sets[setIdx] >= levelDef.reps;
          if (wasDone) {
            log.sets[setIdx] = 0;
            applyState();
            return;
          }
          startHoldTimer(row, setLabel, checkIcon, levelDef.reps, () => {
            log.sets[setIdx] = levelDef.reps;
            applyState();
            startRestTimer(restTimer);
          });
          return;
        }
        const wasDone = log.sets[setIdx] >= levelDef.reps;
        log.sets[setIdx] = wasDone ? 0 : levelDef.reps;
        applyState();
        if (!wasDone) startRestTimer(restTimer);
      });
      row.appendChild(setLabel);
      row.appendChild(checkIcon);
      block.appendChild(row);
    });

    block.appendChild(restTimer);

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
  document.getElementById('settings-playlist-cardio').value = settings.playlistCardio || '';
  document.getElementById('settings-playlist-strength').value = settings.playlistStrength || '';
  document.getElementById('settings-goal-weight').value = settings.goalWeightKg || '';

  const lastBackup = Store.getLastBackup();
  const note = document.getElementById('last-backup-note');
  if (!lastBackup) {
    note.textContent = '📦 Nog geen backup gemaakt.';
  } else {
    const days = Math.floor((Date.now() - new Date(lastBackup).getTime()) / 86400000);
    note.textContent = days === 0 ? '📦 Laatste backup: vandaag.' : `📦 Laatste backup: ${days} dag${days === 1 ? '' : 'en'} geleden.`;
  }

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
  settings.playlistCardio = sanitizeUrl(document.getElementById('settings-playlist-cardio').value.trim());
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
  Store.saveLastBackup(new Date().toISOString());
  renderSettings();
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
