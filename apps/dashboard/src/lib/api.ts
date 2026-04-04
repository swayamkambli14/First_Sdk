/**
 * Thin API client for the business dashboard.
 * All calls use the stored API key from localStorage.
 */
import axios from 'axios';

const BASE = '/v1';

export function getApiKey(): string {
  return localStorage.getItem('cl_api_key') ?? '';
}

export function getAppId(): string {
  return localStorage.getItem('cl_app_id') ?? '';
}

export function saveCredentials(apiKey: string, appId: string) {
  localStorage.setItem('cl_api_key', apiKey);
  localStorage.setItem('cl_app_id', appId);
}

export function clearCredentials() {
  localStorage.removeItem('cl_api_key');
  localStorage.removeItem('cl_app_id');
}

export function isLoggedIn(): boolean {
  return !!getApiKey() && !!getAppId();
}

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const key = getApiKey();
  if (key) config.headers['Authorization'] = `Bearer ${key}`;
  return config;
});

// ─── Business Rules ───────────────────────────────────────────────────────────

export const rulesApi = {
  list: () => api.get('/business/rules'),
  create: (data: unknown) => api.post('/business/rules', data),
  update: (ruleId: string, data: unknown) => api.put(`/business/rules/${ruleId}`, data),
  delete: (ruleId: string) => api.delete(`/business/rules/${ruleId}`),
  toggle: (ruleId: string, enabled: boolean) => api.patch(`/business/rules/${ruleId}/toggle`, { enabled }),
  test: (data: unknown) => api.post('/business/rules/test', data),
};

// ─── Tier Config ──────────────────────────────────────────────────────────────

export const tiersApi = {
  get: () => api.get('/business/tiers'),
  update: (data: unknown) => api.put('/business/tiers', data),
};

// ─── Spin Pools ───────────────────────────────────────────────────────────────

export const spinPoolsApi = {
  get: () => api.get('/business/spin-pools'),
  update: (data: unknown) => api.put('/business/spin-pools', data),
};

// ─── Badges ───────────────────────────────────────────────────────────────────

export const badgesApi = {
  list: () => api.get('/business/badges'),
  create: (data: unknown) => api.post('/business/badges', data),
};

// ─── Analytics ────────────────────────────────────────────────────────────────

export const analyticsApi = {
  get: () => api.get('/business/analytics'),
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const usersApi = {
  list: (appId: string, page = 1, limit = 20) =>
    api.get(`/v1/leaderboard?app_id=${appId}&period=all_time&limit=${limit}&offset=${(page - 1) * limit}`),
};

// ─── App registration ─────────────────────────────────────────────────────────

export const appsApi = {
  register: (name: string) => axios.post(`${BASE}/apps/register`, { name }),
  get: (appId: string) => api.get(`/apps/${appId}`),
};
