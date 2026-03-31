import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, assetUrl } from './api.js';

describe('assetUrl', () => {
  it('returns absolute URLs unchanged', () => {
    expect(assetUrl('https://x.com/a.png')).toBe('https://x.com/a.png');
  });

  it('preserves relative upload path suffix', () => {
    expect(assetUrl('/uploads/x.jpg')).toMatch(/\/uploads\/x\.jpg$/);
  });
});

describe('api()', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws with message on error JSON', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'ERR',
      text: async () => JSON.stringify({ error: 'fail', detail: 'reason' }),
    });
    await expect(api('/api/x')).rejects.toThrow(/fail/);
  });

  it('sends Authorization when token in localStorage', async () => {
    localStorage.setItem('token', 'abc');
    global.fetch.mockResolvedValue({
      ok: true,
      text: async () => '{"ok":true}',
    });
    await api('/api/auth/me');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/auth/me',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer abc' }),
      })
    );
  });
});
