// tests/test-helpers.js
// Minimal test assertion helpers for browser-based testing.
// Used by test_etapa1.js and future test files.

let testResults = [];
let currentDescribe = '';

export function describe(name, fn) {
  currentDescribe = name;
  fn();
  currentDescribe = '';
}

export function it(name, fn) {
  try {
    fn();
    testResults.push({ describe: currentDescribe, name, status: 'PASS' });
    console.log(`  ✅ ${name}`);
  } catch (e) {
    testResults.push({ describe: currentDescribe, name, status: 'FAIL', error: e.message });
    console.error(`  ❌ ${name}: ${e.message}`);
  }
}

export function assert(condition, message = 'assertion failed') {
  if (!condition) throw new Error(message);
}

export function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

export function assertDeepEquals(actual, expected, message) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) {
    throw new Error(message || `expected ${b}, got ${a}`);
  }
}

export function assertContains(str, substring, message) {
  if (!str.includes(substring)) {
    throw new Error(message || `expected string to contain "${substring}"`);
  }
}

export function summary() {
  const pass = testResults.filter(r => r.status === 'PASS').length;
  const fail = testResults.filter(r => r.status === 'FAIL').length;
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Test Results: ${pass} passed, ${fail} failed, ${testResults.length} total`);
  testResults.filter(r => r.status === 'FAIL').forEach(r => {
    console.error(`  FAIL: ${r.describe} > ${r.name}`);
    console.error(`    ${r.error}`);
  });
  return { pass, fail, total: testResults.length, results: testResults };
}
