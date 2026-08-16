const PREFIX = 'fitstreak_';

function get(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function set(key, value) {
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

export const Store = {
  getActivities: () => get('activities', get('rides', []).map((r) => ({ ...r, type: r.type || 'cycling' }))),
  saveActivities: (activities) => set('activities', activities),

  getWeights: () => get('weights', []),
  saveWeights: (weights) => set('weights', weights),

  getStrengthSessions: () => get('strength_sessions', []),
  saveStrengthSessions: (sessions) => set('strength_sessions', sessions),

  getStrengthLevels: () => get('strength_levels', {}),
  saveStrengthLevels: (levels) => set('strength_levels', levels),

  getSettings: () => {
    const stored = get('settings', {});
    return {
      playlistCardio: stored.playlistCycling || '',
      playlistStrength: '',
      goalWeightKg: null,
      strengthDays: [1, 3, 5],
      ...stored
    };
  },
  saveSettings: (settings) => set('settings', settings),

  getStreak: () =>
    get('streak', { current: 0, longest: 0, lastActiveDate: null, freezeWeekStart: null, freezeUsed: false }),
  saveStreak: (streak) => set('streak', streak),

  getBadges: () => get('badges', []),
  saveBadges: (badges) => set('badges', badges),

  getXp: () => get('xp', 0),
  saveXp: (xp) => set('xp', xp),

  getLastBackup: () => get('last_backup', null),
  saveLastBackup: (isoDate) => set('last_backup', isoDate),

  getCardioLevel: () => get('cardio_level', get('cycling_level', 0)),
  saveCardioLevel: (level) => set('cardio_level', level),

  exportAll: () => {
    const data = {};
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith(PREFIX)) data[k] = localStorage.getItem(k);
    }
    return data;
  },

  importAll: (data) => {
    for (const [k, v] of Object.entries(data)) {
      if (k.startsWith(PREFIX)) localStorage.setItem(k, v);
    }
  }
};
