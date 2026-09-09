import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

for (const path of ['docs/app.js', 'app.js']) {
  test(`${path} pins the browser-compatible legacy PDF.js build`, () => {
    const source = fs.readFileSync(path, 'utf8');
    assert.match(source, /pdfjs-dist@4\.10\.38\/legacy\/build\/pdf\.mjs/);
    assert.match(source, /pdfjs-dist@4\.10\.38\/legacy\/build\/pdf\.worker\.mjs/);
    assert.doesNotMatch(source, /pdfjs-dist@6\.3\.289/);
  });
}
