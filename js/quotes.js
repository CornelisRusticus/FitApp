export const QUOTES = [
  'Klein en vaak wint van groot en eenmalig.',
  'Je hoeft niet gemotiveerd te zijn, je hoeft alleen te beginnen.',
  'Elke rit telt, ook de trage.',
  'Consistentie is de enige supplement die echt werkt.',
  'Vandaag een beetje, morgen een beetje, over een jaar een ander mens.',
  'Rust is ook trainen — maar vandaag ben je er toch al bijna.',
  'Je concurreert alleen met wie je gisteren was.',
  'Een streak van 1 is beter dan een streak van 0.',
  'Fietsen naar werk is gratis cardio die je toch al doet.',
  'Progressie voel je pas als je terugkijkt, niet als je erin zit.',
  'De sessie die je bijna oversloeg is meestal de beste.',
  'Doe het licht als je moet, maar doe het.'
];

export function quoteForToday() {
  const day = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < day.length; i++) hash = (hash * 31 + day.charCodeAt(i)) >>> 0;
  return QUOTES[hash % QUOTES.length];
}
