import { Store } from './storage.js';

function dateStr(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  const ms = new Date(b) - new Date(a);
  return Math.round(ms / 86400000);
}

export function isoWeekStart(d = new Date()) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return dateStr(date);
}

export const BADGES = [
  { id: 'first_ride', emoji: '🚴', name: 'Eerste rit', check: (s) => s.rides.length >= 1 },
  { id: 'first_strength', emoji: '💪', name: 'Eerste krachtsessie', check: (s) => s.sessions.length >= 1 },
  { id: 'streak_7', emoji: '🔥', name: '7 dagen streak', check: (s) => s.streak.longest >= 7 },
  { id: 'streak_30', emoji: '🔥', name: '30 dagen streak', check: (s) => s.streak.longest >= 30 },
  { id: 'streak_100', emoji: '🔥', name: '100 dagen streak', check: (s) => s.streak.longest >= 100 },
  { id: 'distance_50', emoji: '📏', name: '50 km totaal gefietst', check: (s) => s.totalKm >= 50 },
  { id: 'distance_250', emoji: '📏', name: '250 km totaal gefietst', check: (s) => s.totalKm >= 250 },
  { id: 'distance_1000', emoji: '🏆', name: '1000 km totaal gefietst', check: (s) => s.totalKm >= 1000 },
  { id: 'long_ride_45', emoji: '⏱️', name: 'Rit van 45+ minuten', check: (s) => s.rides.some((r) => r.durationS / 60 >= 45) },
  { id: 'cycling_level_up', emoji: '🚴', name: 'Fietsplan niveau omhoog', check: (s) => s.cyclingLevel >= 1 },
  { id: 'strength_10', emoji: '🏋️', name: '10 krachtsessies voltooid', check: (s) => s.sessions.length >= 10 },
  { id: 'strength_50', emoji: '🏋️', name: '50 krachtsessies voltooid', check: (s) => s.sessions.length >= 50 },
  { id: 'consistent_month', emoji: '📅', name: '4 weken op rij actief', check: (s) => s.streak.longest >= 28 }
];

export function updateStreakForActivity() {
  const streak = Store.getStreak();
  const today = dateStr();
  if (streak.lastActiveDate === today) return streak;

  const weekStart = isoWeekStart();
  if (streak.freezeWeekStart !== weekStart) {
    streak.freezeWeekStart = weekStart;
    streak.freezeUsed = false;
  }

  if (!streak.lastActiveDate) {
    streak.current = 1;
  } else {
    const gap = daysBetween(streak.lastActiveDate, today);
    if (gap === 1) {
      streak.current += 1;
    } else if (gap === 2 && !streak.freezeUsed) {
      streak.current += 1;
      streak.freezeUsed = true;
    } else {
      streak.current = 1;
    }
  }
  streak.longest = Math.max(streak.longest, streak.current);
  streak.lastActiveDate = today;
  Store.saveStreak(streak);
  return streak;
}

export function addXp(amount) {
  const xp = Store.getXp() + amount;
  Store.saveXp(xp);
  return xp;
}

export function levelForXp(xp) {
  return Math.floor(Math.sqrt(xp / 40)) + 1;
}

export function checkNewBadges() {
  const rides = Store.getRides();
  const sessions = Store.getStrengthSessions();
  const streak = Store.getStreak();
  const totalKm = rides.reduce((sum, r) => sum + (r.distanceKm || 0), 0);
  const cyclingLevel = Store.getCyclingLevel();
  const state = { rides, sessions, streak, totalKm, cyclingLevel };

  const earned = Store.getBadges();
  const earnedIds = new Set(earned.map((b) => b.id));
  const newly = [];

  for (const badge of BADGES) {
    if (!earnedIds.has(badge.id) && badge.check(state)) {
      const record = { id: badge.id, dateEarned: dateStr() };
      earned.push(record);
      newly.push(badge);
    }
  }
  if (newly.length) Store.saveBadges(earned);
  return newly;
}

export function recordActivity(xpAmount) {
  const streak = updateStreakForActivity();
  const xp = addXp(xpAmount);
  const newBadges = checkNewBadges();
  return { streak, xp, newBadges };
}

export function getHeatmapData(days = 70) {
  const rides = Store.getRides();
  const sessions = Store.getStrengthSessions();
  const map = {};
  for (const r of rides) {
    const d = r.date.slice(0, 10);
    map[d] = (map[d] || 0) + 1 + Math.min(r.distanceKm / 10, 2);
  }
  for (const s of sessions) {
    const d = s.date.slice(0, 10);
    map[d] = (map[d] || 0) + 2;
  }
  const out = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dateStr(d);
    out.push({ date: key, level: Math.min(4, Math.round(map[key] || 0)) });
  }
  return out;
}
