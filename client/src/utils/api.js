const BASE = import.meta.env.VITE_SERVER_URL || '';

async function request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  return data;
}

export const api = {
  auth: {
    register: (body) => request('POST', '/auth/register', body),
    login: (body) => request('POST', '/auth/login', body),
    me: (token) => request('GET', '/auth/me', null, token),
    updateAvatar: (avatar, token) => request('PATCH', '/auth/avatar', { avatar }, token),
  },
  rooms: {
    categories: () => request('GET', '/rooms/meta/categories'),
    get: (code, token) => request('GET', `/rooms/${code}`, null, token),
    pin: (data, token) => request('POST', '/rooms/pin', data, token),
    pins: (token) => request('GET', '/rooms/pins/mine', token),
    addCustomQuestion: (text, token) => request('POST', '/rooms/questions/custom', { text }, token),
  },
};
