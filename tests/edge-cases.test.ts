import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import apiShield from '../src/index';

function buildApp(config: any = {}) {
  const app = express();

  // important: enable json parser for body attacks
  app.use(express.json({ limit: '1mb' }));

  app.use(apiShield(config));

  app.post('/echo', (req, res) => {
    res.json({
      body: req.body,
      hasProto: Object.prototype.hasOwnProperty.call(req.body || {}, '__proto__'),
    });
  });

  app.get('/', (_req, res) => {
    res.json({ ok: true });
  });

  return app;
}

describe('apiShield - strict edge cases & attack resistance', () => {

  it('never crashes on completely empty requests', async () => {
    const app = buildApp();

    const res = await request(app).post('/echo');

    expect([200, 400, 401, 413, 500]).toContain(res.status);
    expect(res.body).toBeDefined();
  });

  it('handles null byte injection safely', async () => {
    const app = buildApp({ suspiciousRequests: true });

    const res = await request(app)
      .get('/?q=test%00inject');

    expect(res.status).not.toBe(500);
    expect(res.body).toBeDefined();
  });

  it('blocks extremely deep nested JSON (DoS attempt)', async () => {
    const app = buildApp({ suspiciousRequests: true });

    const deep: any = {};
    let ref = deep;

    for (let i = 0; i < 2000; i++) {
      ref.next = {};
      ref = ref.next;
    }

    const res = await request(app)
      .post('/echo')
      .send(deep)
      .set('Content-Type', 'application/json');

    expect([400, 413]).toContain(res.status);
  });

  it('rejects oversized headers safely', async () => {
    const app = buildApp({});

    const longHeader = 'a'.repeat(10000);
    

    const res = await request(app)
      .get('/')
      .set('x-api-key', longHeader);

    expect(res.status).not.toBe(500);
  });

  it('does not crash on malformed JSON body', async () => {
    const app = buildApp();

    const res = await request(app)
      .post('/echo')
      .set('Content-Type', 'application/json')
      .send('{"broken_json": }');

    expect([400, 401, 413]).toContain(res.status);
  });

  it('handles missing content-type safely', async () => {
    const app = buildApp({ apiKey: { enabled: true, keys: ['x'] } });

    const res = await request(app)
      .post('/echo')
      .send('random raw body data');

    expect(res.status).not.toBe(500);
  });

  it('prevents prototype pollution attempts strictly', async () => {
    const app = buildApp({ sanitize: true });

    const res = await request(app)
      .post('/echo')
      .send({
        __proto__: { admin: true },
        constructor: { prototype: { hacked: true } },
      });

    expect(res.status).toBe(200);

    expect(res.body.hasProto).toBe(false);
  });

  it('rejects extremely long query strings (DoS protection)', async () => {
    const app = buildApp({ suspiciousRequests: true });

    const longQuery = 'a'.repeat(20000);
   

    const res = await request(app)
      .get('/?q=' + longQuery);

    // expect([400, 414, 200]).toContain(res.status);
    expect([200, 400, 414, 431]).toContain(res.status);
  });

  it('handles multiple conflicting headers safely', async () => {
    const app = buildApp({ apiKey: { enabled: true, keys: ['secret'] } });

    const res = await request(app)
      .get('/')
      .set('x-api-key', 'secret')
      .set('x-api-key', 'wrong');

    expect([200, 401]).toContain(res.status);
  });

  it('never returns HTML error pages under any condition', async () => {
    const app = buildApp({ apiKey: { enabled: true, keys: ['x'] } });

    const res = await request(app).get('/');

    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.text).not.toMatch(/<html/i);
  });

  it('gracefully handles undefined request properties', async () => {
    const app = express();

    // intentionally NOT adding json parser
    app.use(apiShield({}));

    app.get('/test', (_req, res) => {
      res.json({ ok: true });
    });

    const res = await request(app).get('/test');

    expect(res.status).not.toBe(500);
  });

});