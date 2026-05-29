// Color helpers. pptxgenjs wants hex without '#'.
function hex(c) {
  return c.replace("#", "").toUpperCase();
}

function clamp(n) {
  return Math.max(0, Math.min(255, n));
}

// Lighten a bg color toward a card tone (the spec's "slightly lighter than bg").
function lighten(c, amt = 22) {
  const h = hex(c);
  const r = clamp(parseInt(h.slice(0, 2), 16) + amt);
  const g = clamp(parseInt(h.slice(2, 4), 16) + amt);
  const b = clamp(parseInt(h.slice(4, 6), 16) + amt);
  return [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase();
}

const TEXT = "F0E6CC"; // warm white per spec

module.exports = { hex, lighten, TEXT };
