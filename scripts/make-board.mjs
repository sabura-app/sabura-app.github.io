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
  box('file', 0, 0, 'A board is one HTML file'),
  box('open', 270, 0, 'Open it in any browser, even offline'),
  box('edit', 270, 170, 'Move, rename and add things'),
  box('save', 0, 170, 'Save Copy and send it to anyone', { fill: '#fff3b0' }),
  box('agent', 240, 330, 'Claude or your own agent can edit it too', { type: 'ellipse', width: 250, height: 110 }),
  link('c1', 'file', 'open'),
  link('c2', 'open', 'edit'),
  link('c3', 'edit', 'save'),
  link('c4', 'agent', 'edit'),
  { type: 'create_object', object: { id: 'note', type: 'text', x: 0, y: 470, width: 340, height: 40, text: 'This board is a real Sabura file. Drag a box.', seed: 5 } },
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
