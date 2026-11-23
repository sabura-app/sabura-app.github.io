// Builds assets/sketch/*.svg: the hand-drawn outlines, washes and arrows the
// site uses for its board-like edges. Run from the site root:
//   node scripts/make-sketches.mjs
// The strokes come from the editor's own sketch generator (../editor), so the
// site's edges are drawn the same way Sabura draws shapes on a board.
// Each image is written once per page scheme, because an SVG used as a CSS
// image can't inherit the page's text colour.
import fs from 'node:fs';
const E = new URL('../../editor/', import.meta.url);
const { generateSketchPath, generateClosedFillPath, sketchLine, createPRNG } = await import(new URL('src/core/sketch.js', E));

const OUT = new URL('../assets/sketch/', import.meta.url);
fs.mkdirSync(OUT, { recursive: true });

// Ink and wash colours: the paper board's pen and pigments for the light page,
// the night board's chalk and pigments for the dark page.
const SCHEMES = {
  light: { ink: '#1e1e1e', yellow: '#ffec99' },
  dark: { ink: '#f4f4f5', yellow: '#ff9e64' },
};
// Pigment layers: the paper board's on the light page; fainter on the dark page
// so body text on the wash keeps its contrast.
const PIGMENT = { light: [0.66, 0.48], dark: [0.12, 0.08] };

const svg = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>\n`;
const stroke = (d, ink, width = 1.7) =>
  `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;

// A rough rectangle used as a 9-slice border-image: corners keep their shape
// and the edges stretch only along their length, so the line weight stays the
// same at every box size. CSS slices it 24px in from each side.
function box(seed, ink) {
  const d = generateSketchPath({ type: 'rectangle', x: 6, y: 6, width: 108, height: 108, seed, roughness: 1 });
  return svg(120, 120, stroke(d, ink));
}

// A rough circle for numbered steps.
function ring(seed, ink) {
  const d = generateSketchPath({ type: 'ellipse', x: 3, y: 3, width: 34, height: 34, seed, roughness: 1 });
  return svg(40, 40, stroke(d, ink, 1.6));
}

// A pigment wash: the board's two offset fill layers, no outline. Stretching
// it is fine because it has no line weight to distort.
function wash(seed, colour, layers) {
  const d = generateClosedFillPath({ type: 'rectangle', x: 4, y: 4, width: 192, height: 112, seed, roughness: 1 });
  const offsets = [[0.8, -0.6], [-1.1, 0.9]];
  const body = layers.map((opacity, i) =>
    `<path d="${d}" fill="${colour}" fill-opacity="${opacity}" transform="translate(${offsets[i][0]} ${offsets[i][1]})"/>`).join('');
  return svg(200, 120, body).replace('<svg ', '<svg preserveAspectRatio="none" ');
}

// A short hand-drawn arrow pointing up and to the right, for annotations that
// point at the board above them.
function arrow(seed, ink) {
  const prng = createPRNG(seed);
  const [x1, y1, x2, y2] = [6, 34, 40, 8];
  const shaft = sketchLine(x1, y1, x2, y2, prng, 0.8);
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const wing = (a) => `M ${(x2 + Math.cos(a) * 11).toFixed(1)} ${(y2 + Math.sin(a) * 11).toFixed(1)} L ${x2} ${y2}`;
  return svg(46, 42, stroke(`${shaft} ${wing(angle + Math.PI * 0.84)} ${wing(angle - Math.PI * 0.84)}`, ink, 1.6));
}

const files = {};
for (const [name, c] of Object.entries(SCHEMES)) {
  files[`box-${name}.svg`] = box(41, c.ink);
  files[`box-alt-${name}.svg`] = box(97, c.ink);
  files[`ring-${name}.svg`] = ring(23, c.ink);
  files[`arrow-${name}.svg`] = arrow(7, c.ink);
  files[`wash-yellow-${name}.svg`] = wash(13, c.yellow, PIGMENT[name]);
}
for (const [file, content] of Object.entries(files)) fs.writeFileSync(new URL(file, OUT), content);
console.log(`assets/sketch: ${Object.keys(files).length} files`);
