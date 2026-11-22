// Builds board/index.html: a real Sabura board (editor runtime + document)
// that explains Sabura. Run from the site root: node scripts/make-board.mjs
// Uses the editor checkout next to this repo (../editor) for its runtime and
// document code, so the demo is always a genuine Sabura file.
import fs from 'node:fs';
const E = new URL('../../editor/', import.meta.url);
const { createDefaultDocument, normalizeDocument, validateDocument } = await import(new URL('src/core/document.js', E));
const { applyCommandBatch } = await import(new URL('src/core/commands.js', E));
const { packageHtmlWithDocument } = await import(new URL('src/storage/file-packer.js', E));

const box = (id, x, y, text, extra = {}) => ({ type: 'create_object', object: { id, type: 'rectangle', x, y, width: 190, height: 84, text, seed: 11 + x + y, ...extra } });
const link = (connectorId, fromId, toId) => ({ type: 'connect_objects', connectorId, fromId, toId });
const commands = [
  box('ask', 0, 0, 'You ask Claude for a diagram'),
  box('draw', 260, 0, 'Claude draws it on a Sabura board'),
  box('edit', 520, 0, 'You move, rename and add things'),
  box('save', 520, 170, 'Save Copy gives you one HTML file', { fill: '#fff3b0' }),
  box('open', 230, 160, 'Anyone opens it in a browser, offline', { type: 'ellipse', width: 240, height: 110 }),
  link('c1', 'ask', 'draw'),
  link('c2', 'draw', 'edit'),
  link('c3', 'edit', 'save'),
  link('c4', 'save', 'open'),
  { type: 'create_object', object: { id: 'note', type: 'text', x: 0, y: 320, width: 300, height: 40, text: 'This board is a real Sabura file. Drag a box.', seed: 5 } },
];
let doc = normalizeDocument(createDefaultDocument({ id: 'board_site_demo', title: 'How Sabura works' }));
doc.title = 'How Sabura works';
doc = applyCommandBatch(doc, commands).doc;
const valid = validateDocument(doc);
if (!valid.valid) throw new Error(valid.errors.join('\n'));
const runtime = fs.readFileSync(new URL('sabura.html', E), 'utf8');
const packed = packageHtmlWithDocument(runtime, doc);
if (!packed.success) throw new Error(packed.error);
fs.writeFileSync(new URL('../board/index.html', import.meta.url), packed.html);
console.log(`board/index.html ${packed.html.length} bytes, ${Object.keys(doc.objects).length} objects`);
