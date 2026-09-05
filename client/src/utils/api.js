const API_URL = '/api';

async function request(endpoint, options = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    credentials: 'include'
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.errors?.[0]?.msg || 'Request failed');
  }
  return data;
}

export const api = {
  auth: {
    signup: (data) => request('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
    login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    refresh: () => request('/auth/refresh', { method: 'POST' }),
    me: () => request('/auth/me')
  },
  users: {
    me: () => request('/users/me'),
    update: (data) => request('/users/me', { method: 'PUT', body: JSON.stringify(data) }),
    updatePhotos: (photos) => request('/users/me/photos', { method: 'POST', body: JSON.stringify({ photos }) }),
    uploadPhoto: (image) => request('/users/me/photos/upload', { method: 'POST', body: JSON.stringify({ image }) }),
    updatePassword: (data) => request('/users/me/password', { method: 'PUT', body: JSON.stringify(data) }),
    delete: () => request('/users/me', { method: 'DELETE' }),
    profile: (id) => request(`/users/${id}`),
    discover: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/users/discover${qs ? `?${qs}` : ''}`);
    }
  },
  swipes: {
    create: (data) => request('/swipes', { method: 'POST', body: JSON.stringify(data) })
  },
  matches: {
    list: () => request('/matches'),
    unmatch: (id) => request(`/matches/${id}`, { method: 'DELETE' }),
    messages: (id) => request(`/matches/${id}/messages`)
  },
  reports: {
    create: (data) => request('/reports', { method: 'POST', body: JSON.stringify(data) }),
    unblock: (userId) => request(`/reports/block/${userId}`, { method: 'DELETE' })
  }
};

export function formatDistance(km) {
  if (km === null || km === undefined) return 'Unknown distance';
  if (km < 1) return '< 1 km';
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export function formatTime(date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function calculateAge(birthdate) {
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export const GENDERS = ['man', 'woman', 'nonbinary'];
export const INTERESTS = [
  'gothic literature', 'vampire lore', 'dark poetry', 'vintage fashion', 'candle making',
  'tarot reading', 'midnight walks', 'classical music', 'horror films', 'taxonomy',
  'antique collecting', 'graveyard photography', 'witchcraft', 'victorian history',
  'dark academia', 'black metal', 'post-punk', 'industrial music', 'rituals',
  'shadow work', 'lunar cycles', 'crystal healing', 'herbalism', 'occult studies'
];