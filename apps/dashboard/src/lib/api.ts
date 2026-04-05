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

/** Returns the active app ID regardless of auth mode */
export function getActiveAppId(): string {
  // API key mode stores it as cl_app_id; company session mode as cl_active_app_id
  return localStorage.getItem('cl_app_id') ?? localStorage.getItem('cl_active_app_id') ?? '';
}

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const apiKey = getApiKey();
  const companyToken = localStorage.getItem('cl_company_token');

  if (apiKey) {
    // API key mode — send raw key
    config.headers['Authorization'] = `Bearer ${apiKey}`;
  } else if (companyToken) {
    // Company session mode — send session token + active app id
    config.headers['Authorization'] = `Bearer ${companyToken}`;
    const activeAppId = localStorage.getItem('cl_active_app_id');
    if (activeAppId) config.headers['x-app-id'] = activeAppId;
  }
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
    api.get(`/leaderboard?app_id=${appId}&period=all_time&limit=${limit}&offset=${(page - 1) * limit}`),
};

// ─── App registration ─────────────────────────────────────────────────────────

export const appsApi = {
  register: (name: string) => axios.post(`${BASE}/apps/register`, { name }),
  get: (appId: string) => api.get(`/apps/${appId}`),
};

// ─── Company auth ─────────────────────────────────────────────────────────────

export const companyApi = {
  register: (data: {
    name: string; email: string; password: string;
    contact_name?: string; industry?: string; website?: string; country?: string;
  }) => axios.post(`${BASE}/company/register`, data),

  login: (email: string, password: string) =>
    axios.post(`${BASE}/company/login`, { email, password }),

  logout: (token: string) =>
    axios.post(`${BASE}/company/logout`, {}, { headers: { Authorization: `Bearer ${token}` } }),

  me: (token: string) =>
    axios.get(`${BASE}/company/me`, { headers: { Authorization: `Bearer ${token}` } }),

  updateProfile: (token: string, data: unknown) =>
    axios.put(`${BASE}/company/me`, data, { headers: { Authorization: `Bearer ${token}` } }),

  getApps: (token: string) =>
    axios.get(`${BASE}/company/apps`, { headers: { Authorization: `Bearer ${token}` } }),

  createApp: (token: string, name: string, webhookUrl?: string) =>
    axios.post(`${BASE}/company/apps`, { name, webhook_url: webhookUrl }, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getAnalytics: (token: string) =>
    axios.get(`${BASE}/company/analytics`, { headers: { Authorization: `Bearer ${token}` } }),

  getApiKey: (token: string) =>
    axios.get(`${BASE}/company/api-key`, { headers: { Authorization: `Bearer ${token}` } }),

  generateApiKey: (token: string) =>
    axios.post(`${BASE}/company/api-key`, {}, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    }),
};
