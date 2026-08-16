import { Store } from './storage.js';
import { isoWeekStart } from './gamification.js';

export const CYCLING_LEVELS = [
  { label: 'Op gang komen', weeklyTargetMin: 75, description: '3x een omweg van ~15 min tijdens het pendelen + 1x een rustige rit van ~30 min in het weekend.' },
  { label: 'Ritme te pakken', weeklyTargetMin: 100, description: '3x een omweg van ~20 min tijdens het pendelen + 1x een rit van ~40 min in het weekend.' },
  { label: 'Vaste renner', weeklyTargetMin: 130, description: '3-4x een omweg van ~20-25 min + 1x een langere rit van ~50 min in het weekend.' },
  { label: 'Op je fietse', weeklyTargetMin: 160, description: '4x een omweg van ~25 min + 1x een stevige rit van ~60 min in het weekend — dit is je plafond, langer hoeft niet.' }
];

function weeklyMinutes(rides, weekStartKey) {
  return rides
    .filter((r) => isoWeekStart(new Date(r.date)) === weekStartKey)
    .reduce((sum, r) => sum + r.durationS / 60, 0);
}

export function getCurrentWeekMinutes() {
  return weeklyMinutes(Store.getRides(), isoWeekStart());
}

export function checkCyclingProgression() {
  const level = Store.getCyclingLevel();
  if (level >= CYCLING_LEVELS.length - 1) return null;
  const rides = Store.getRides();
  const target = CYCLING_LEVELS[level].weeklyTargetMin;
  const prevWeek1 = isoWeekStart(new Date(Date.now() - 7 * 86400000));
  const prevWeek2 = isoWeekStart(new Date(Date.now() - 14 * 86400000));
  const min1 = weeklyMinutes(rides, prevWeek1);
  const min2 = weeklyMinutes(rides, prevWeek2);
  if (min1 >= target && min2 >= target) {
    Store.saveCyclingLevel(level + 1);
    return CYCLING_LEVELS[level + 1];
  }
  return null;
}

export function avgSpeedOf(ride) {
  if (!ride.distanceKm) return 0;
  return ride.distanceKm / (ride.durationS / 3600);
}

export function logRide({ minutes, distanceKm, date }) {
  const rides = Store.getRides();
  const prevLongestMin = rides.reduce((m, r) => Math.max(m, r.durationS / 60), 0);
  const prevFarthest = rides.reduce((m, r) => Math.max(m, r.distanceKm || 0), 0);

  const ride = {
    id: 'ride_' + Date.now(),
    date: date || new Date().toISOString(),
    durationS: Math.round(minutes * 60),
    distanceKm: distanceKm || 0
  };
  rides.push(ride);
  Store.saveRides(rides);

  return {
    ride,
    prs: {
      duration: rides.length > 1 && minutes > prevLongestMin,
      distance: rides.length > 1 && ride.distanceKm > 0 && ride.distanceKm > prevFarthest
    }
  };
}

export function updateRide(id, { minutes, distanceKm }) {
  const rides = Store.getRides();
  const idx = rides.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  rides[idx] = { ...rides[idx], durationS: Math.round(minutes * 60), distanceKm: distanceKm || 0 };
  Store.saveRides(rides);
  return rides[idx];
}

export function deleteRide(id) {
  Store.saveRides(Store.getRides().filter((r) => r.id !== id));
}
