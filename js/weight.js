import { Store } from './storage.js';

export function addWeight(dateStr, kg) {
  const weights = Store.getWeights();
  const existingIdx = weights.findIndex((w) => w.date === dateStr);
  if (existingIdx >= 0) weights[existingIdx].kg = kg;
  else weights.push({ date: dateStr, kg });
  weights.sort((a, b) => new Date(a.date) - new Date(b.date));
  Store.saveWeights(weights);
  return weights;
}

export function movingAverage(weights, windowSize = 7) {
  return weights.map((w, i) => {
    const start = Math.max(0, i - windowSize + 1);
    const slice = weights.slice(start, i + 1);
    const avg = slice.reduce((sum, x) => sum + x.kg, 0) / slice.length;
    return { date: w.date, avg };
  });
}

export function drawWeightChart(canvas, weights) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  if (weights.length < 2) {
    ctx.fillStyle = '#475569';
    ctx.font = '13px system-ui';
    ctx.fillText('Log minstens 2 dagen voor een grafiek', 12, h / 2);
    return;
  }
  const avg = movingAverage(weights);
  const kgs = weights.map((x) => x.kg);
  const min = Math.min(...kgs) - 0.5;
  const max = Math.max(...kgs) + 0.5;
  const pad = 24;
  const xFor = (i) => pad + (i / (weights.length - 1)) * (w - 2 * pad);
  const yFor = (kg) => h - pad - ((kg - min) / (max - min)) * (h - 2 * pad);

  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 3; i++) {
    const y = pad + (i / 3) * (h - 2 * pad);
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(w - pad, y);
    ctx.stroke();
  }

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.beginPath();
  weights.forEach((pt, i) => {
    const x = xFor(i);
    const y = yFor(pt.kg);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 3;
  ctx.beginPath();
  avg.forEach((pt, i) => {
    const x = xFor(i);
    const y = yFor(pt.avg);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px system-ui';
  ctx.fillText(max.toFixed(1) + ' kg', 2, pad);
  ctx.fillText(min.toFixed(1) + ' kg', 2, h - pad + 4);
}
