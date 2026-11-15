/* Run with: node --test public/rotina/emoji.test.cjs */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
function setup() {
  const dom = new JSDOM(fs.readFileSync(path.join(__dirname, 'app.html'), 'utf8'), { runScripts: 'outside-only', url: 'https://school.example/rotina/app.html' });
  dom.window.eval(fs.readFileSync(path.join(__dirname, 'emoji.js'), 'utf8'));
  return dom;
}
test('40–60 local SVGs include every default and all requested classroom emojis', () => {
  const dom = setup(), api = dom.window.RotinaEmoji;
  assert.ok(api.choices.length >= 40 && api.choices.length <= 60);
  const required = '🪥 🧼 🚽 🚿 🍎 🥛 🍽️ 📚 ✏️ 🎨 🧮 🎒 😊 😢 😠 😌 ⚽ 🎵 🛝 🏠 ✨ ⭐ 🛏️ 😴 🚌 🏫 👕 🧥 👟 🥪 🍌 🍪 🧃 🖍️ ✂️ 🧩 🎲 📖 🖥️ 🚶 🧘 👏 🤝 🙋 😮 😨 🤒 ❤️ ✅ ❌ ⏰ ☀️ 🌙'.split(' ');
  for (const emoji of required) {
    assert.ok(api.choices.some(item => item[0] === emoji));
    assert.match(fs.readFileSync(path.join(__dirname, 'emoji', api.code(emoji) + '.svg'), 'utf8'), /<svg/);
  }
  dom.window.close();
});
test('Unicode filenames omit FE0F and retain joined ZWJ sequence codes', () => {
  const dom = setup(), api = dom.window.RotinaEmoji;
  assert.equal(api.code('🪥'), '1faa5');
  assert.equal(api.code('🍽️'), '1f37d');
  assert.equal(api.code('👩‍🏫'), '1f469-200d-1f3eb');
  dom.window.close();
});
test('unsupported saved emoji and failed SVG fall back to native text', () => {
  const dom = setup(), api = dom.window.RotinaEmoji;
  assert.equal(api.emo('🦄'), '<span aria-hidden="true">🦄</span>');
  const holder = dom.window.document.createElement('div');
  holder.innerHTML = api.emo('🪥'); dom.window.document.body.append(holder);
  holder.querySelector('img').dispatchEvent(new dom.window.Event('error'));
  assert.equal(holder.textContent, '🪥'); assert.equal(holder.querySelector('img'), null);
  dom.window.close();
});
test('three pickers default to star and keyboard selection updates one option', () => {
  const dom = setup(), api = dom.window.RotinaEmoji;
  for (const grid of dom.window.document.querySelectorAll('.emoji-grid')) {
    api.init(grid); assert.equal(grid.dataset.emoji, '⭐');
    grid.querySelector('[role="radio"]').dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    assert.equal(grid.dataset.emoji, '🪥');
    assert.equal(grid.querySelectorAll('[aria-checked="true"]').length, 1);
    api.reset(grid); assert.equal(grid.dataset.emoji, '⭐');
  }
  dom.window.close();
});
test('offline registration stays disabled on preview, iframe and kill-switch URLs', async () => {
  for (const url of ['http://localhost:8080/rotina/app.html', 'https://preview-v2--school.lovable.app/rotina/app.html', 'https://id-preview--school.lovable.app/rotina/app.html', 'https://project--school-dev.lovable.app/rotina/app.html', 'https://school.example/rotina/app.html?sw=off']) {
    const dom = new JSDOM('', { runScripts: 'outside-only', url });
    let calls = 0;
    Object.defineProperty(dom.window.navigator, 'serviceWorker', { value: { getRegistrations: async () => [], register: async () => { calls++; return { update: async () => {} }; } } });
    dom.window.eval(fs.readFileSync(path.join(__dirname, 'offline.js'), 'utf8'));
    await dom.window.RotinaOffline.register(); assert.equal(calls, 0);
    dom.window.close();
  }
});
test('published app registers its scoped offline worker', async () => {
  const dom = setup(); let called;
  Object.defineProperty(dom.window.navigator, 'serviceWorker', { value: { register: async (...args) => { called = args; return { update: async () => {} }; } } });
  dom.window.eval(fs.readFileSync(path.join(__dirname, 'offline.js'), 'utf8'));
  await dom.window.RotinaOffline.register();
  assert.equal(called[0], 'https://school.example/rotina/sw.js');
  assert.equal(called[1].scope, './'); dom.window.close();
});
