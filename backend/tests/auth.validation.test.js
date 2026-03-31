import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app.js';

describe('POST /api/auth/register validation', () => {
  let app;

  before(async () => {
    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  test('rejects invalid email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { 'content-type': 'application/json' },
      payload: { email: 'not-an-email', username: 'u', password: '12345678' },
    });
    assert.equal(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.ok(body.error);
  });

  test('rejects short password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { 'content-type': 'application/json' },
      payload: { email: 'a@b.co', username: 'user', password: 'short' },
    });
    assert.equal(res.statusCode, 400);
  });
});

describe('POST /api/auth/login validation', () => {
  let app;

  before(async () => {
    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  test('rejects malformed body', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { 'content-type': 'application/json' },
      payload: {},
    });
    assert.equal(res.statusCode, 400);
  });
});
