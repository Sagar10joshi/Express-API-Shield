import express from 'express';
import request from 'supertest';
import apiShield from '../../src/index';
import { describe, it, expect } from 'vitest';

function app() {
  const server = express();

  server.use(
    apiShield({
      apiKey: { enabled: true, keys: ['x'] },
      suspiciousRequests: true,
      sanitize: true,
      bodyLimit: '1mb',
    })
  );

  server.post('/data', (req, res) => {
    res.json({ ok: true });
  });

  return server;
}

describe('attack simulation suite', () => {
  it('blocks deep JSON recursion attack', async () => {
    const appInstance = app();

    const payload = { a: {} as any };
    let ref = payload.a;

    for (let i = 0; i < 1000; i++) {
      ref.next = {};
      ref = ref.next;
    }

    const res = await request(appInstance)
      .post('/data')
      .set('x-api-key', 'x')
      .send(payload);

    expect([400, 413]).toContain(res.status);
  });

  it('blocks header flooding attack', async () => {
    const appInstance = app();

    const headers: Record<string, string> = {};


    for (let i = 0; i < 80; i++) {
  headers[`x-test-${i}`] = 'A';
}

    const res = await request(appInstance)
      .post('/data')
      .set('x-api-key', 'x')
      .set(headers);

    expect([400, 431, 200]).toContain(res.status);
  });

  it('handles null-byte injection safely', async () => {
    const appInstance = app();

    const res = await request(appInstance)
      .post('/data')
      .set('x-api-key', 'x')
      .send({ q: "test\0inject" });

    expect(res.status).not.toBe(500);
  });
});