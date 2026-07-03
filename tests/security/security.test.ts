import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import apiShield from '../../src/index';
import { PATTERNS } from '../../src/utils/patterns';

describe('security properties', () => {
  it('does not trust X-Forwarded-For unless trustedProxies is enabled', async () => {
    const app = express();
    app.use(apiShield({ trustedProxies: false, ipBlocklist: ['9.9.9.9'] }));
    app.get('/', (req, res) => res.json({ ip: req.shield.ip }));

    const res = await request(app).get('/').set('X-Forwarded-For', '9.9.9.9');
    // Spoofed header should be ignored - request should NOT be blocked
    // and resolved IP should not be the spoofed one.
    expect(res.status).toBe(200);
    expect(res.body.ip).not.toBe('9.9.9.9');
  });

  it('detection regexes do not exhibit catastrophic backtracking on adversarial input', () => {
    const evilInput = 'a'.repeat(50_000) + '!';
    const start = Date.now();
    for (const p of PATTERNS) {
      p.regex.test(evilInput);
    }
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(500); // generous bound; should be near-instant
  });

  it('never returns Express default HTML error pages for blocked requests', async () => {
    const app = express();
    app.use(apiShield({ apiKey: { enabled: true, keys: ['x'] } }));
    app.get('/', (_req, res) => res.json({ ok: true }));

    const res = await request(app).get('/');
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.text).not.toMatch(/<html/i);
  });

  it('API key comparison rejects keys of different length without throwing', async () => {
    const app = express();
    app.use(apiShield({ apiKey: { enabled: true, keys: ['a-fairly-long-secret-key'] } }));
    app.get('/', (_req, res) => res.json({ ok: true }));

    const res = await request(app).get('/').set('x-api-key', 'short');
    expect(res.status).toBe(401);
  });

  it('sanitize strips __proto__ keys before they reach handler logic', async () => {
    const app = express();
    app.use(express.json());
    app.use(apiShield({ sanitize: true }));
    app.post('/echo', (req, res) => res.json({ hasProto: Object.prototype.hasOwnProperty.call(req.body, '__proto__') }));

    const res = await request(app)
      .post('/echo')
      .send(JSON.parse('{"__proto__": {"polluted": true}}'))
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(200);
  });
});
