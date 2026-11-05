import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const app = read('../src/App.tsx');
const auth = read('../src/components/AuthModal.tsx');
const entry = read('../src/main.tsx');

test('Homepage login includes server-authenticated GitHub Admin mode', () => {
  assert.match(auth,/Chủ xe \/ Quản trị/);
  assert.match(auth,/await gh\.admin\(adminPassword\)/);
  assert.match(app,/onGithubAdminSuccess=/);
  assert.match(app,/githubAdmin\?\.role === 'operator'/);
});

test('Old hardcoded PIN cannot grant administrator access', () => {
  assert.doesNotMatch(app,/adminPin\.trim\(\)\s*===/);
  assert.doesNotMatch(app,/mock_admin_session/);
  assert.match(app,/await gh\.logout\(\)/);
});

test('Legacy admin deep-links return to one homepage instead of a second console', () => {
  assert.match(entry,/\/quan-tri/);
  assert.doesNotMatch(entry,/GithubBackendPreview/);
  assert.match(entry,/<App\s*\/>/);
});
