import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/core.js';
const {normalizeUrl,parseReader}=globalThis.RelayCore;
test('public URLs and relative links resolve correctly',()=>{
  assert.equal(normalizeUrl(' example.com '),'https://example.com/');
  assert.equal(normalizeUrl('../next?q=1','https://example.com/a/b'),'https://example.com/next?q=1');
  assert.equal(normalizeUrl('//example.org/','https://example.com/'),'https://example.org/');
  assert.equal(normalizeUrl('#part','https://example.com/a'),'https://example.com/a#part');
});
test('unsafe protocols, credentials and private addresses are rejected',()=>{
  for(const url of ['javascript:alert(1)','data:text/html,x','file:///x','https://user:secret@example.com','http://localhost','http://127.0.0.1','http://192.168.1.1','http://[::1]','http://2130706433','https://printer.local','https://example.com:1234'])assert.throws(()=>normalizeUrl(url),undefined,url);
});
test('reader metadata and redirected source are extracted separately from body',()=>{
  const page=parseReader('Title: Read this\nURL Source: https://example.org/final\n\nMarkdown Content:\n# Hello\n[Next](./next)','https://example.com');
  assert.equal(page.title,'Read this');assert.equal(page.url,'https://example.org/final');assert.equal(page.markdown,'# Hello\n[Next](./next)');
});
test('invalid service response and empty content do not become successful pages',()=>{
  assert.throws(()=>parseReader('Unauthorized','https://example.com'));
  assert.throws(()=>parseReader('Markdown Content:\n ','https://example.com'));
});
