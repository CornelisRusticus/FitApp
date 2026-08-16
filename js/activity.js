import { Store } from './storage.js';
import { isoWeekStart } from './gamification.js';

export const ACTIVITY_TYPES = {
  cycling: { label: 'Fietsen', emoji: '🚴', intensity: 1.0, hasDistance: true },
  sup: { label: 'Suppen', emoji: '🏄', intensity: 1.0, hasDistance: false },
  walking: { label: 'Wandelen', emoji: '🚶', intensity: 0.5, hasDistance: true }
};

export const CARDIO_LEVELS = [
  { label: 'Op gang komen', weeklyTargetMin: 75, description: '±75 effectieve min/week: bv. 3x een kwartier actief pendelen/wandelen + 1x een rustige tocht van ~30 min in het weekend.' },
  { label: 'Ritme te pakken', weeklyTargetMin: 100, description: '±100 effectieve min/week: bv. 3x ~20 min doordeweeks + 1x ~40 min in het weekend.' },
  { label: 'Vaste ritme', weeklyTargetMin: 130, description: '±130 effectieve min/week: bv. 3-4x ~20-25 min doordeweeks + 1x ~50 min in het weekend.' },
  { label: 'Volop in beweging', weeklyTargetMin: 160, description: '±160 effectieve min/week: bv. 4x ~25 min doordeweeks + 1x ~60 min in het weekend — dit is je plafond, meer hoeft niet.' }
];

function effectiveMinutes(activity) {
  const type = ACTIVITY_TYPES[activity.type] || ACTIVITY_TYPES.cycling;
  return (activity.durationS / 60) * type.intensity;
}

function weeklyEffectiveMinutes(activities, weekStartKey) {
  return activities
    .filter((a) => isoWeekStart(new Date(a.date)) === weekStartKey)
    .reduce((sum, a) => sum + effectiveMinutes(a), 0);
}

export function getCurrentWeekEffectiveMinutes() {
  return weeklyEffectiveMinutes(Store.getActivities(), isoWeekStart());
}

export function checkCardioProgression() {
  const level = Store.getCardioLevel();
  if (level >= CARDIO_LEVELS.length - 1) return null;
  const activities = Store.getActivities();
  const target = CARDIO_LEVELS[level].weeklyTargetMin;
  const prevWeek1 = isoWeekStart(new Date(Date.now() - 7 * 86400000));
  const prevWeek2 = isoWeekStart(new Date(Date.now() - 14 * 86400000));
  const min1 = weeklyEffectiveMinutes(activities, prevWeek1);
  const min2 = weeklyEffectiveMinutes(activities, prevWeek2);
  if (min1 >= target && min2 >= target) {
    Store.saveCardioLevel(level + 1);
    return CARDIO_LEVELS[level + 1];
  }
  return null;
}

export function avgSpeedOf(activity) {
  if (!activity.distanceKm) return 0;
  return activity.distanceKm / (activity.durationS / 3600);
}

export function logActivity({ type, minutes, distanceKm, date }) {
  const activities = Store.getActivities();
  const prevLongestMin = activities.reduce((m, a) => Math.max(m, a.durationS / 60), 0);
  const prevFarthest = activities.reduce((m, a) => Math.max(m, a.distanceKm || 0), 0);

  const activity = {
    id: 'act_' + Date.now(),
    type: type || 'cycling',
    date: date || new Date().toISOString(),
    durationS: Math.round(minutes * 60),
    distanceKm: distanceKm || 0
  };
  activities.push(activity);
  Store.saveActivities(activities);

  return {
    activity,
    prs: {
      duration: activities.length > 1 && minutes > prevLongestMin,
      distance: activities.length > 1 && activity.distanceKm > 0 && activity.distanceKm > prevFarthest
    }
  };
}

export function updateActivity(id, { minutes, distanceKm, type }) {
  const activities = Store.getActivities();
  const idx = activities.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  activities[idx] = { ...activities[idx], type: type || activities[idx].type, durationS: Math.round(minutes * 60), distanceKm: distanceKm || 0 };
  Store.saveActivities(activities);
  return activities[idx];
}

export function deleteActivity(id) {
  Store.saveActivities(Store.getActivities().filter((a) => a.id !== id));
}
