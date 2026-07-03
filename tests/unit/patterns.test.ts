import { describe, it, expect } from 'vitest';
import { PATTERNS, patternsForCategories } from '../../src/utils/patterns';

describe('detection patterns', () => {
  it('detects classic SQL injection payloads', () => {
    const sql = patternsForCategories(['sql']);
    expect(sql.some((p) => p.regex.test("' OR 1=1 --"))).toBe(true);
    expect(sql.some((p) => p.regex.test('UNION SELECT password FROM users'))).toBe(true);
    expect(sql.some((p) => p.regex.test('DROP TABLE users'))).toBe(true);
  });

  it('detects NoSQL operator injection', () => {
    const nosql = patternsForCategories(['nosql']);
    expect(nosql.some((p) => p.regex.test('{"$gt": ""}'))).toBe(true);
    expect(nosql.some((p) => p.regex.test('$where'))).toBe(true);
  });

  it('detects XSS payloads', () => {
    const xss = patternsForCategories(['xss']);
    expect(xss.some((p) => p.regex.test('<script>alert(1)</script>'))).toBe(true);
    expect(xss.some((p) => p.regex.test('<img onerror=alert(1)>'))).toBe(true);
  });

  it('detects path traversal', () => {
    const pt = patternsForCategories(['pathTraversal']);
    expect(pt.some((p) => p.regex.test('../../etc/passwd'))).toBe(true);
  });

  it('detects template injection', () => {
    const ti = patternsForCategories(['templateInjection']);
    expect(ti.some((p) => p.regex.test('{{7*7}}'))).toBe(true);
    expect(ti.some((p) => p.regex.test('${7*7}'))).toBe(true);
  });

  it('does not flag ordinary benign text', () => {
    const all = PATTERNS;
    const benign = 'Hello, my name is Alex and I like hiking on weekends.';
    expect(all.some((p) => p.regex.test(benign))).toBe(false);
  });
});
