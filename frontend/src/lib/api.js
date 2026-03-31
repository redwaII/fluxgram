const base = '';

function getToken() {
  return localStorage.getItem('token');
}

export function assetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${import.meta.env.VITE_API_URL || ''}${path}`;
}

export async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  const t = getToken();
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(`${base}${path}`, { ...options, headers });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text };
  }
  if (!res.ok) {
    const msg = data?.error || res.statusText;
    const err = new Error(data?.detail ? `${msg}: ${data.detail}` : msg);
    err.status = res.status;
    err.details = data?.details;
    throw err;
  }
  return data;
}

export async function uploadFile(file) {
  const fd = new FormData();
  fd.append('file', file);
  const headers = {};
  const t = getToken();
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(`${base}/api/upload`, { method: 'POST', headers, body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}

export async function uploadAvatar(file) {
  const fd = new FormData();
  fd.append('file', file);
  const headers = {};
  const t = getToken();
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(`${base}/api/auth/avatar`, { method: 'POST', headers, body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}
