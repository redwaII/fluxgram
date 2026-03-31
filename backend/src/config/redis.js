import Redis from 'ioredis';
import { env } from './env.js';

let pubClient = null;

export function getRedis() {
  if (!pubClient) {
    pubClient = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
  }
  return pubClient;
}

export async function redisSetOnline(userId) {
  const r = getRedis();
  const refKey = `online:ref:${userId}`;
  const n = await r.incr(refKey);
  await r.expire(refKey, 86400);
  if (n === 1) {
    await r.sadd('online:users', String(userId));
    await r.set(`online:user:${userId}`, '1', 'EX', 120);
  }
}

export async function redisSetOffline(userId) {
  const r = getRedis();
  const refKey = `online:ref:${userId}`;
  const n = await r.decr(refKey);
  if (n <= 0) {
    await r.del(refKey);
    await r.srem('online:users', String(userId));
    await r.del(`online:user:${userId}`);
  }
}

export async function redisIsOnline(userId) {
  const r = getRedis();
  const v = await r.get(`online:user:${userId}`);
  return v === '1';
}

export async function redisRefreshPresence(userId) {
  const r = getRedis();
  await r.set(`online:user:${userId}`, '1', 'EX', 120);
}

export async function redisPublish(channel, payload) {
  await getRedis().publish(channel, JSON.stringify(payload));
}
