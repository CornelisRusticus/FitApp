import { Store } from './storage.js';

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function downsample(points, max = 300) {
  if (points.length <= max) return points;
  const step = points.length / max;
  const out = [];
  for (let i = 0; i < max; i++) out.push(points[Math.floor(i * step)]);
  out.push(points[points.length - 1]);
  return out;
}

export function createRideTracker(onUpdate, onError) {
  let watchId = null;
  let points = [];
  let lastPoint = null;
  let startTime = null;
  let pausedAccumMs = 0;
  let pauseStartedAt = null;
  let distanceKm = 0;
  let maxSpeed = 0;
  let lastSpeed = 0;

  function elapsedS() {
    if (!startTime) return 0;
    const pausedNow = pauseStartedAt ? Date.now() - pauseStartedAt : 0;
    return (Date.now() - startTime - pausedAccumMs - pausedNow) / 1000;
  }

  function stats() {
    const es = elapsedS();
    const avgSpeed = es > 0 ? distanceKm / (es / 3600) : 0;
    return { distanceKm, elapsedS: es, avgSpeed, currentSpeed: lastSpeed, maxSpeed };
  }

  function handlePosition(pos) {
    if (pauseStartedAt) return;
    const { latitude: lat, longitude: lng, speed, accuracy } = pos.coords;
    if (accuracy && accuracy > 50) return;
    const t = pos.timestamp || Date.now();
    if (lastPoint) {
      const d = haversineKm(lastPoint, { lat, lng });
      const dt = (t - lastPoint.t) / 1000;
      if (dt > 0.3) {
        const inst = speed != null && speed >= 0 ? speed * 3.6 : (d / dt) * 3600;
        if (inst < 80) {
          distanceKm += d;
          lastSpeed = inst;
          maxSpeed = Math.max(maxSpeed, inst);
        }
      }
    }
    lastPoint = { lat, lng, t };
    points.push({ lat, lng, t });
    onUpdate(stats());
  }

  return {
    start() {
      startTime = Date.now();
      pausedAccumMs = 0;
      pauseStartedAt = null;
      points = [];
      lastPoint = null;
      distanceKm = 0;
      maxSpeed = 0;
      lastSpeed = 0;
      if (!navigator.geolocation) {
        onError && onError('Geolocation niet beschikbaar op dit toestel.');
        return;
      }
      watchId = navigator.geolocation.watchPosition(handlePosition, (err) => onError && onError(err.message), {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 20000
      });
    },
    pause() {
      pauseStartedAt = Date.now();
    },
    resume() {
      if (pauseStartedAt) {
        pausedAccumMs += Date.now() - pauseStartedAt;
        pauseStartedAt = null;
        lastPoint = null;
      }
    },
    stop() {
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      watchId = null;
      const final = stats();
      return {
        date: new Date().toISOString(),
        durationS: Math.round(final.elapsedS),
        distanceKm: Math.round(final.distanceKm * 100) / 100,
        avgSpeed: Math.round(final.avgSpeed * 10) / 10,
        maxSpeed: Math.round(maxSpeed * 10) / 10,
        points: downsample(points)
      };
    },
    getStats: stats
  };
}

export function saveRide(ride) {
  const rides = Store.getRides();
  const prevLongest = rides.reduce((m, r) => Math.max(m, r.distanceKm), 0);
  const prevBestAvg = rides.reduce((m, r) => Math.max(m, r.avgSpeed), 0);
  const prevBestMax = rides.reduce((m, r) => Math.max(m, r.maxSpeed), 0);
  ride.id = 'ride_' + Date.now();
  rides.push(ride);
  Store.saveRides(rides);
  return {
    ride,
    prs: {
      distance: rides.length > 1 && ride.distanceKm > prevLongest,
      avgSpeed: rides.length > 1 && ride.avgSpeed > prevBestAvg,
      maxSpeed: rides.length > 1 && ride.maxSpeed > prevBestMax
    }
  };
}

export function drawRoute(canvas, points) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  if (!points || points.length < 2) {
    ctx.fillStyle = '#475569';
    ctx.font = '13px system-ui';
    ctx.fillText('Geen routegegevens', 12, h / 2);
    return;
  }
  const latMid = (Math.max(...points.map((p) => p.lat)) + Math.min(...points.map((p) => p.lat))) / 2;
  const scaleLng = Math.cos((latMid * Math.PI) / 180);
  const xs = points.map((p) => p.lng * scaleLng);
  const ys = points.map((p) => -p.lat);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const pad = 16;
  const spanX = maxX - minX || 1e-6;
  const spanY = maxY - minY || 1e-6;
  const scale = Math.min((w - 2 * pad) / spanX, (h - 2 * pad) / spanY);
  const offX = pad + (w - 2 * pad - spanX * scale) / 2;
  const offY = pad + (h - 2 * pad - spanY * scale) / 2;
  const toXY = (p) => [offX + (p.lng * scaleLng - minX) * scale, offY + (-p.lat - minY) * scale];

  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  points.forEach((p, i) => {
    const [x, y] = toXY(p);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  const [sx, sy] = toXY(points[0]);
  const [ex, ey] = toXY(points[points.length - 1]);
  ctx.fillStyle = '#4ade80';
  ctx.beginPath();
  ctx.arc(sx, sy, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fb7185';
  ctx.beginPath();
  ctx.arc(ex, ey, 5, 0, Math.PI * 2);
  ctx.fill();
}
