// Run with: node examples/basic.js (after `npm run build`)
const express = require('express');
const apiShield = require('../dist/index.cjs.js').default;

const app = express();

app.use(
  apiShield({
    preset: 'production',
    apiKey: {
      enabled: true,
      keys: ['demo-key-123'],
      ignore: ['/health'],
    },
    ignore: ['/health'],
    hooks: {
      onBlocked: (event) => console.log('blocked:', event.code, event.reason),
    },
  })
);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/', (req, res) => {
  res.json({ message: 'hello', requestId: req.id });
});

app.listen(3000, () => console.log('listening on http://localhost:3000 (try curl -H "x-api-key: demo-key-123" localhost:3000/)'));
