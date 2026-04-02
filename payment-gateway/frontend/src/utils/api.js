import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 15000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle auth errors globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// ── Payments ──────────────────────────────────────────────────────────────────
export const paymentsAPI = {
  create: (data, idempotencyKey) =>
    api.post('/payments', data, idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : {}),
  list: (params) => api.get('/payments', { params }),
  get: (id) => api.get(`/payments/${id}`),
  authorize: (id) => api.post(`/payments/${id}/authorize`),
  capture: (id) => api.post(`/payments/${id}/capture`),
  refund: (id, data) => api.post(`/payments/${id}/refund`, data),
  stats: () => api.get('/payments/stats'),
};

// ── Webhooks ──────────────────────────────────────────────────────────────────
export const webhooksAPI = {
  listEndpoints: () => api.get('/webhooks/endpoints'),
  createEndpoint: (data) => api.post('/webhooks/endpoints', data),
  deleteEndpoint: (id) => api.delete(`/webhooks/endpoints/${id}`),
  listEvents: (params) => api.get('/webhooks/events', { params }),
  retryEvent: (id) => api.post(`/webhooks/events/${id}/retry`),
};

export default api;
