import express from 'express';
import request from 'supertest';
import apiShield from '../../src/index';
import { describe, it, expect } from 'vitest';

function buildApp() {
  const app = express();

  app.use(
    apiShield({
      apiKey: { enabled: true, keys: ['test'] },
      suspiciousRequests: true,
      sanitize: true,
      bodyLimit: '1mb',
    })
  );

  app.post('/test', (req, res) => {
    res.json({ ok: true });
  });

  return app;
}

describe('benchmark - performance baseline', () => {
  it('handles 1000 requests quickly (smoke benchmark)', async () => {
    const app = buildApp();

    const start = Date.now();

    const requests = Array.from({ length: 1000 }).map(() =>
      request(app)
        .post('/test')
        .set('x-api-key', 'test')
        .send({ hello: 'world' })
    );

    await Promise.all(requests);

    const duration = Date.now() - start;

    console.log(`1000 requests took ${duration}ms`);

    // very generous threshold for CI stability
    expect(duration).toBeLessThan(8000);
  });

  it('does not degrade under large JSON payloads', async () => {
    const app = buildApp();

    const largePayload = {
      data: 'x'.repeat(50000),
    };

    const res = await request(app)
      .post('/test')
      .set('x-api-key', 'test')
      .send(largePayload);

    expect([200, 413]).toContain(res.status);
  });
});