import { Store } from './storage.js';

export const EXERCISES = {
  squat: {
    name: 'Squats',
    levels: [
      { label: 'Bodyweight Squat', sets: 3, reps: 12 },
      { label: 'Bodyweight Squat (langzaam, 3s naar beneden)', sets: 3, reps: 18 },
      { label: 'Bulgaarse Split Squat', sets: 3, reps: 10 },
      { label: 'Jump Squat', sets: 3, reps: 12 },
      { label: 'Pistol Squat (met steun)', sets: 3, reps: 6 }
    ]
  },
  pushup: {
    name: 'Push-ups',
    levels: [
      { label: 'Knie Push-up', sets: 3, reps: 10 },
      { label: 'Push-up', sets: 3, reps: 10 },
      { label: 'Push-up', sets: 3, reps: 15 },
      { label: 'Diamond Push-up', sets: 3, reps: 10 },
      { label: 'Archer Push-up', sets: 3, reps: 6 }
    ]
  },
  row: {
    name: 'Rug Rows (tafel/handdoek om deur)',
    levels: [
      { label: 'Table Row', sets: 3, reps: 10 },
      { label: 'Table Row', sets: 3, reps: 15 },
      { label: 'Handdoek Deur-row', sets: 3, reps: 12 },
      { label: 'Handdoek Deur-row', sets: 3, reps: 18 },
      { label: 'Eenarmige Handdoek-row', sets: 3, reps: 10 }
    ]
  },
  glutebridge: {
    name: 'Glute Bridge',
    levels: [
      { label: 'Glute Bridge', sets: 3, reps: 15 },
      { label: 'Single-leg Glute Bridge', sets: 3, reps: 8 },
      { label: 'Single-leg Glute Bridge', sets: 3, reps: 12 },
      { label: 'Verhoogde Single-leg Glute Bridge', sets: 3, reps: 10 },
      { label: 'Hamstring Bridge Walkout', sets: 3, reps: 6 }
    ]
  },
  plank: {
    name: 'Plank',
    levels: [
      { label: 'Plank', sets: 3, reps: 20, unit: 's' },
      { label: 'Plank', sets: 3, reps: 40, unit: 's' },
      { label: 'Plank', sets: 3, reps: 60, unit: 's' },
      { label: 'Plank met arm/beenlift', sets: 3, reps: 40, unit: 's' },
      { label: 'Dragon Flag negatives', sets: 3, reps: 5 }
    ]
  },
  lunge: {
    name: 'Lunges',
    levels: [
      { label: 'Lunge', sets: 3, reps: 10 },
      { label: 'Lunge', sets: 3, reps: 16 },
      { label: 'Walking Lunge', sets: 3, reps: 20 },
      { label: 'Jump Lunge', sets: 3, reps: 12 },
      { label: 'Bulgarian Lunge (voet omhoog)', sets: 3, reps: 10 }
    ]
  },
  pike: {
    name: 'Pike Push-up (schouders)',
    levels: [
      { label: 'Pike Push-up', sets: 3, reps: 8 },
      { label: 'Pike Push-up', sets: 3, reps: 12 },
      { label: 'Verhoogde Pike Push-up', sets: 3, reps: 10 },
      { label: 'Verhoogde Pike Push-up', sets: 3, reps: 15 },
      { label: 'Wall-assisted Handstand Push-up', sets: 3, reps: 5 }
    ]
  },
  superman: {
    name: 'Superman / Rugextensie',
    levels: [
      { label: 'Superman Hold', sets: 3, reps: 20, unit: 's' },
      { label: 'Superman Reps', sets: 3, reps: 15 },
      { label: 'Superman Hold', sets: 3, reps: 40, unit: 's' },
      { label: 'Superman met arm/beenlift', sets: 3, reps: 20 },
      { label: 'Single-leg Superman', sets: 3, reps: 12 }
    ]
  },
  sideplank: {
    name: 'Side Plank',
    levels: [
      { label: 'Side Plank per zijde', sets: 3, reps: 20, unit: 's' },
      { label: 'Side Plank per zijde', sets: 3, reps: 40, unit: 's' },
      { label: 'Side Plank met heuplift', sets: 3, reps: 15 },
      { label: 'Side Plank met beenlift', sets: 3, reps: 40, unit: 's' },
      { label: 'Side Plank rotatie', sets: 3, reps: 12 }
    ]
  },
  stepup: {
    name: 'Step-up (gebruik de trap)',
    levels: [
      { label: 'Step-up per zijde', sets: 3, reps: 12 },
      { label: 'Step-up per zijde', sets: 3, reps: 20 },
      { label: 'Step-up traag (2s omhoog)', sets: 3, reps: 15 },
      { label: 'Jump Step-up', sets: 3, reps: 10 },
      { label: 'Single-leg Box Squat vanaf trapje', sets: 3, reps: 8 }
    ]
  },
  deadbug: {
    name: 'Dead Bug',
    levels: [
      { label: 'Dead Bug per zijde', sets: 3, reps: 10 },
      { label: 'Dead Bug per zijde', sets: 3, reps: 16 },
      { label: 'Dead Bug met fles water', sets: 3, reps: 12 },
      { label: 'Hollow Body Hold', sets: 3, reps: 20, unit: 's' },
      { label: 'Hollow Body Hold', sets: 3, reps: 40, unit: 's' }
    ]
  }
};

export const DAYS = {
  A: { label: 'Workout A — Benen & Borst', exercises: ['squat', 'pushup', 'row', 'glutebridge', 'plank'] },
  B: { label: 'Workout B — Onderlichaam & Schouders', exercises: ['lunge', 'pike', 'superman', 'sideplank'] },
  C: { label: 'Workout C — Full body & Core', exercises: ['stepup', 'pushup', 'deadbug', 'plank'] }
};

const RPE_OPTIONS = [
  { id: 'makkelijk', label: '😌 Makkelijk' },
  { id: 'ok', label: '🙂 Precies goed' },
  { id: 'zwaar', label: '😮‍💨 Zwaar' }
];
export { RPE_OPTIONS };

export function getLevelIndex(exerciseId) {
  const levels = Store.getStrengthLevels();
  return levels[exerciseId] || 0;
}

export function setLevelIndex(exerciseId, index) {
  const levels = Store.getStrengthLevels();
  levels[exerciseId] = Math.max(0, Math.min(EXERCISES[exerciseId].levels.length - 1, index));
  Store.saveStrengthLevels(levels);
}

export function getNextDay() {
  const sessions = Store.getStrengthSessions();
  if (!sessions.length) return 'A';
  const last = sessions[sessions.length - 1].day;
  return last === 'A' ? 'B' : last === 'B' ? 'C' : 'A';
}

export function getWeeklyCount() {
  const sessions = Store.getStrengthSessions();
  const weekAgo = Date.now() - 7 * 86400000;
  return sessions.filter((s) => new Date(s.date).getTime() >= weekAgo).length;
}

function meetsTarget(log, levelDef) {
  return log.sets.every((reps) => reps >= levelDef.reps);
}

function goodRpe(rpe) {
  return rpe === 'makkelijk' || rpe === 'ok';
}

export function logSession(day, exerciseLogs) {
  const sessions = Store.getStrengthSessions();
  const session = { id: 'sess_' + Date.now(), date: new Date().toISOString(), day, exercises: exerciseLogs };
  sessions.push(session);
  Store.saveStrengthSessions(sessions);

  const leveledUp = [];
  for (const log of exerciseLogs) {
    const def = EXERCISES[log.id];
    const levelDef = def.levels[log.levelIndex];
    if (!meetsTarget(log, levelDef) || !goodRpe(log.rpe)) continue;

    const history = sessions
      .filter((s) => s.id !== session.id)
      .flatMap((s) => s.exercises.filter((e) => e.id === log.id && e.levelIndex === log.levelIndex).map((e) => ({ ...e, date: s.date })))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const recentGood = history.slice(0, 1).every((e) => meetsTarget(e, levelDef) && goodRpe(e.rpe));
    if (recentGood && log.levelIndex < def.levels.length - 1) {
      setLevelIndex(log.id, log.levelIndex + 1);
      leveledUp.push({ id: log.id, name: def.name, newLabel: def.levels[log.levelIndex + 1].label });
    }
  }
  return { session, leveledUp };
}
