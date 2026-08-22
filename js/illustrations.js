const POSES = {
  squat: {
    start: { head: [50, 14], shoulder: [50, 24], hip: [50, 52], hand: [62, 38], knee: [50, 74], foot: [50, 96] },
    end: { head: [50, 34], shoulder: [48, 44], hip: [40, 64], hand: [68, 50], knee: [62, 76], foot: [54, 96] },
    note: 'Hurk zoals je op een stoel gaat zitten: heupen naar achteren, rug recht, knieën niet voorbij je tenen.'
  },
  pushup: {
    start: { head: [16, 40], shoulder: [28, 44], hip: [62, 44], hand: [28, 70], knee: [90, 44], foot: [96, 44] },
    end: { head: [16, 58], shoulder: [28, 60], hip: [62, 46], hand: [28, 70], knee: [90, 44], foot: [96, 44] },
    note: 'Lichaam één rechte lijn van hoofd tot voeten. Ellebogen buigen tot je borst bijna de grond raakt.'
  },
  pushup_knee: {
    start: { head: [18, 44], shoulder: [28, 46], hip: [54, 46], hand: [28, 70], knee: [74, 70], foot: [72, 88] },
    end: { head: [18, 60], shoulder: [28, 62], hip: [54, 50], hand: [28, 70], knee: [74, 70], foot: [72, 88] },
    note: 'Knieën op de grond (niet je voeten!). Rechte lijn van hoofd tot je knieën — je onderbenen wijzen omhoog/achter je, niet gestrekt. Ellebogen buigen tot je borst bijna de grond raakt.'
  },
  row: {
    start: { head: [22, 32], shoulder: [30, 40], hip: [58, 46], hand: [78, 70], knee: [80, 70], foot: [84, 96] },
    end: { head: [22, 32], shoulder: [30, 40], hip: [58, 46], hand: [46, 44], knee: [80, 70], foot: [84, 96] },
    note: 'Buig voorover vanuit de heup, trek je ellebogen naar achteren tot je schouderbladen samenknijpen. Te zwaar? Buig je knieën meer en zet je voeten dichter bij je heupen — hoe rechter/horizontaler je lichaam hangt, hoe meer van je lichaamsgewicht je moet optrekken.'
  },
  glutebridge: {
    start: { head: [12, 82], shoulder: [26, 82], hip: [52, 84], hand: [26, 92], knee: [72, 66], foot: [88, 84] },
    end: { head: [12, 82], shoulder: [26, 82], hip: [52, 62], hand: [26, 92], knee: [72, 62], foot: [88, 84] },
    note: 'Lig op je rug, voeten plat op de grond. Duw je heupen omhoog tot je lichaam een rechte lijn vormt.'
  },
  plank: {
    start: { head: [16, 40], shoulder: [28, 44], hip: [62, 44], hand: [28, 70], knee: [90, 44], foot: [96, 44] },
    hold: true,
    note: 'Rechte lijn van hoofd tot hiel, buik aangespannen. Geen reps — dit is een houding die je vasthoudt.'
  },
  lunge: {
    start: { head: [50, 14], shoulder: [50, 24], hip: [50, 52], hand: [40, 40], knee: [50, 74], foot: [50, 96] },
    end: { head: [46, 20], shoulder: [46, 30], hip: [44, 58], hand: [36, 46], knee: [30, 78], foot: [24, 96], knee2: [66, 80], foot2: [78, 96] },
    note: 'Grote stap naar voren, achterste knie zakt richting de grond, voorste knie boven je voet.'
  },
  pike: {
    start: { head: [30, 60], shoulder: [40, 52], hip: [60, 30], hand: [40, 80], knee: [72, 46], foot: [84, 60] },
    end: { head: [40, 78], shoulder: [46, 66], hip: [60, 30], hand: [46, 80], knee: [72, 46], foot: [84, 60] },
    note: 'Heupen hoog (omgekeerde V), buig je ellebogen zodat je hoofd richting de grond zakt.'
  },
  superman: {
    start: { head: [16, 50], shoulder: [28, 50], hip: [60, 50], hand: [16, 60], knee: [82, 50], foot: [96, 50] },
    end: { head: [12, 36], shoulder: [26, 42], hip: [60, 50], hand: [10, 28], knee: [82, 40], foot: [98, 32] },
    note: 'Lig op je buik, til armen en benen gelijktijdig een klein stukje van de grond.'
  },
  sideplank: {
    start: { head: [18, 40], shoulder: [30, 44], hip: [62, 44], hand: [30, 68], knee: [90, 44], foot: [96, 44] },
    hold: true,
    note: 'Op je zij, ondersteund op één elleboog. Heupen omhoog tot je lichaam een rechte lijn vormt.'
  },
  stepup: {
    start: { head: [30, 24], shoulder: [30, 34], hip: [30, 60], hand: [22, 48], knee: [30, 80], foot: [30, 96], knee2: [50, 78], foot2: [58, 84] },
    end: { head: [50, 14], shoulder: [50, 24], hip: [50, 50], hand: [42, 38], knee: [50, 70], foot: [58, 84], knee2: [30, 60], foot2: [30, 96] },
    note: 'Stap volledig op de trede, duw door je hiel omhoog tot je been gestrekt is. Rustig zakken, niet vallen.'
  },
  deadbug: {
    start: { head: [16, 80], shoulder: [30, 80], hip: [60, 82], hand: [30, 54], knee: [78, 62], foot: [94, 62] },
    end: { head: [16, 80], shoulder: [30, 80], hip: [60, 82], hand: [46, 60], knee: [78, 62], foot: [96, 82] },
    note: 'Lig op je rug, armen en knieën omhoog. Strek afwisselend één arm en het tegenovergestelde been, laag boven de grond.'
  }
};

function limb(x1, y1, x2, y2, color, width = 5) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" />`;
}

function figureMarkup(pose, color, opacity) {
  const parts = [];
  parts.push(limb(pose.shoulder[0], pose.shoulder[1], pose.hip[0], pose.hip[1], color));
  parts.push(limb(pose.shoulder[0], pose.shoulder[1], pose.hand[0], pose.hand[1], color));
  if (pose.hand2) parts.push(limb(pose.shoulder[0], pose.shoulder[1], pose.hand2[0], pose.hand2[1], color));
  if (pose.knee) {
    parts.push(limb(pose.hip[0], pose.hip[1], pose.knee[0], pose.knee[1], color));
    parts.push(limb(pose.knee[0], pose.knee[1], pose.foot[0], pose.foot[1], color));
  }
  if (pose.knee2) {
    parts.push(limb(pose.hip[0], pose.hip[1], pose.knee2[0], pose.knee2[1], color));
    parts.push(limb(pose.knee2[0], pose.knee2[1], pose.foot2[0], pose.foot2[1], color));
  }
  parts.push(`<circle cx="${pose.head[0]}" cy="${pose.head[1]}" r="7" fill="${color}" />`);
  return `<g opacity="${opacity}">${parts.join('')}</g>`;
}

export function resolvePoseKey(exerciseId, levelLabel) {
  if (exerciseId === 'pushup' && levelLabel && levelLabel.toLowerCase().includes('knie')) return 'pushup_knee';
  return exerciseId;
}

export function exerciseDiagramSvg(exerciseId) {
  const data = POSES[exerciseId];
  if (!data) return '';
  const startColor = '#475569';
  const endColor = '#22d3ee';
  let inner = figureMarkup(data.start, startColor, data.hold ? 1 : 0.55);
  if (!data.hold) inner += figureMarkup(data.end, endColor, 1);
  return `<svg viewBox="0 0 110 110" class="exercise-diagram">${inner}</svg>`;
}

export function exerciseNote(exerciseId) {
  return POSES[exerciseId] ? POSES[exerciseId].note : '';
}
