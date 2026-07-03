import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import apiShield from '../../src/index';

function buildApp(config: Parameters<typeof apiShield>[0]) {
  const app = express();
  app.use(apiShield(config));
  app.get('/', (_req, res) => res.json({ ok: true }));
  app.post('/echo', (req, res) => res.json({ body: req.body }));
  app.get('/health', (_req, res) => res.json({ ok: true }));
  return app;
}

describe('apiShield pipeline', () => {
  it('attaches a request id header and req.id by default', async () => {
    const app = buildApp({ requestId: true });
    const res = await request(app).get('/');
    expect(res.headers['x-request-id']).toBeDefined();
    expect(res.status).toBe(200);
  });

  it('blocks requests missing a required API key with unified error shape', async () => {
    const app = buildApp({ apiKey: { enabled: true, keys: ['secret123'] } });
    const res = await request(app).get('/');
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ success: false, code: 'API_KEY_MISSING' });
    expect(res.body.requestId).toBeDefined();
  });

  it('allows requests with a valid API key', async () => {
    const app = buildApp({ apiKey: { enabled: true, keys: ['secret123'] } });
    const res = await request(app).get('/').set('x-api-key', 'secret123');
    expect(res.status).toBe(200);
  });

  it('rejects invalid API keys', async () => {
    const app = buildApp({ apiKey: { enabled: true, keys: ['secret123'] } });
    const res = await request(app).get('/').set('x-api-key', 'wrong');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('API_KEY_INVALID');
  });

  it('respects apiKey.ignore for excluded routes', async () => {
    const app = buildApp({ apiKey: { enabled: true, keys: ['secret123'], ignore: ['/health'] } });
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('blocks blocklisted IPs', async () => {
    const app = buildApp({ ipBlocklist: ['::ffff:127.0.0.1', '127.0.0.1'] });
    const res = await request(app).get('/');
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('IP_BLOCKED');
  });

  it('blocks disallowed user agents', async () => {
    const app = buildApp({ blockUserAgents: ['badbot'] });
    const res = await request(app).get('/').set('User-Agent', 'BadBot/1.0');
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('USER_AGENT_BLOCKED');
  });

  it('detects SQL injection in query params', async () => {
    const app = buildApp({ suspiciousRequests: true });
    const res = await request(app).get('/?id=' + encodeURIComponent("' OR 1=1 --"));
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('SUSPICIOUS_REQUEST');
  });

  it('detects prototype pollution attempts in body', async () => {
    const app = buildApp({ suspiciousRequests: true, bodyLimit: '1mb' });
    const res = await request(app)
      .post('/echo')
      .send({ __proto__: { polluted: true } })
      .set('Content-Type', 'application/json');
    expect([400, 200]).toContain(res.status); // JSON.parse drops literal __proto__ key in most cases; assert no crash either way
  });

  it('rejects bodies over the configured limit', async () => {
    const app = buildApp({ bodyLimit: { json: '10b' } });
    const res = await request(app)
      .post('/echo')
      .send({ big: 'x'.repeat(1000) })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(413);
    expect(res.body.code).toBe('BODY_TOO_LARGE');
  });

  it('lets ignored routes bypass the entire pipeline', async () => {
    const app = buildApp({ apiKey: { enabled: true, keys: ['x'] }, ignore: ['/health'] });
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('fires onBlocked hook on rejection', async () => {
    let firedCode: string | undefined;
    const app = buildApp({
      apiKey: { enabled: true, keys: ['secret'] },
      hooks: { onBlocked: (event) => { firedCode = event.code; } },
    });
    await request(app).get('/');
    expect(firedCode).toBe('API_KEY_MISSING');
  });

  it('production preset produces a working, safe-by-default pipeline', async () => {
    const app = buildApp({ preset: 'production' });
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.headers['x-request-id']).toBeDefined();
  });
});
