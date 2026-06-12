// Colour helpers for the full-screen intro and victory backgrounds.

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const m = hex.replace('#', '');
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = h * 60;
    if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h, s: s * 100, l: l * 100 };
}

// A subtle diagonal gradient from the base colour to a slightly hue-shifted,
// marginally darker variant — keeps the original colour as the first stop.
export function backgroundGradient(color: string): string {
  const { h, s, l } = hexToHsl(color);
  const rand = (Math.floor(h) % 2 === 1 ? 1 : -1) * (Math.floor(h) % 3 + 1) / 3;
  const h2 = (h + 50 * rand) % 360;
  const l2 = Math.max(0, l - 8);
  const deg = Math.floor(h) % 8 * 100 + 140
  return `linear-gradient(${deg}deg, ${color} 0%, hsl(${h2.toFixed(0)}, ${s.toFixed(0)}%, ${l2.toFixed(0)}%) 100%)`;
}
