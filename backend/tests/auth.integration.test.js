import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { buildApp } from '../src/app.js';
import { connectMongo } from '../src/config/database.js';
import { User } from '../src/models/User.js';

describe('Auth + protected routes (MongoDB)', () => {
  let app;
  let mongoOk = false;
  let testEmail;

  before(async () => {
    try {
      await connectMongo();
      mongoOk = true;
    } catch (e) {
      console.warn('[test] MongoDB недоступен, интеграционные тесты пропущены:', e.message);
      return;
    }
    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    if (testEmail) {
      await User.deleteMany({ email: testEmail }).catch(() => {});
    }
    if (app) await app.close();
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  test('register → login → /me → /chats', async (t) => {
    if (!mongoOk || !app) {
      t.skip();
      return;
    }

    testEmail = `flux_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@test.local`;
    const username = `u_${Date.now()}`;
    const password = 'testpass123';

    const reg = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { 'content-type': 'application/json' },
      payload: { email: testEmail, username, password },
    });
    assert.equal(reg.statusCode, 201, reg.body);
    const regBody = JSON.parse(reg.body);
    assert.ok(regBody.token);
    assert.equal(regBody.user.email, testEmail);
    const token = regBody.token;

    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { 'content-type': 'application/json' },
      payload: { email: testEmail, password },
    });
    assert.equal(login.statusCode, 200);
    assert.ok(JSON.parse(login.body).token);

    const me = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(me.statusCode, 200);
    assert.equal(JSON.parse(me.body).email, testEmail);

    const chats = await app.inject({
      method: 'GET',
      url: '/api/chats',
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(chats.statusCode, 200);
    const chatsBody = JSON.parse(chats.body);
    assert.ok(Array.isArray(chatsBody.chats));
  });

  test('GET /api/chats without token → 401', async (t) => {
    if (!mongoOk || !app) {
      t.skip();
      return;
    }
    const res = await app.inject({ method: 'GET', url: '/api/chats' });
    assert.equal(res.statusCode, 401);
  });
});
