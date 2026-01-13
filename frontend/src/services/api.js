const BASE = process.env.REACT_APP_API_URL || "http://localhost:5050/api";

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
};

const request = (endpoint, options = {}) => {
  return fetch(`${BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }).then(handleResponse);
};

export const api = {
  leads: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/leads${query ? '?' + query : ''}`);
    },
    getById: (id) => request(`/leads/${id}`),
    create: (data) => request('/leads', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/leads/${id}`, { method: 'DELETE' }),
    getLeaderboard: (limit = 10) => request(`/leads/leaderboard?limit=${limit}`),
    getStats: () => request('/leads/stats'),
  },

  events: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/events${query ? '?' + query : ''}`);
    },
    getById: (eventId) => request(`/events/${eventId}`),
    create: (data) => request('/events', { method: 'POST', body: JSON.stringify(data) }),
    processNow: (data) => request('/events/process-now', { method: 'POST', body: JSON.stringify(data) }),
    getStats: () => request('/events/stats'),
    getByLead: (leadId) => request(`/events/lead/${leadId}`),
    retryFailed: () => request('/events/retry-failed', { method: 'POST' }),
  },

  scores: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/scores${query ? '?' + query : ''}`);
    },
    getRecent: (limit = 50) => request(`/scores/recent?limit=${limit}`),
    getByLead: (leadId, limit = 100) => request(`/scores/lead/${leadId}?limit=${limit}`),
    getTrend: (leadId, days = 30) => request(`/scores/lead/${leadId}/trend?days=${days}`),
    getBreakdown: (leadId) => request(`/scores/lead/${leadId}/breakdown`),
    recalculate: (leadId) => request(`/scores/lead/${leadId}/recalculate`, { method: 'POST' }),
    getStats: () => request('/scores/stats'),
    getBigMovers: (days = 7, limit = 10) => request(`/scores/big-movers?days=${days}&limit=${limit}`),
  },

  rules: {
    getAll: () => request('/rules'),
    getActive: () => request('/rules/active'),
    getById: (id) => request(`/rules/${id}`),
    update: (id, data) => request(`/rules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    toggle: (id) => request(`/rules/${id}/toggle`, { method: 'PATCH' }),
    getStats: () => request('/rules/stats'),
  },

  upload: {
    file: (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return fetch(`${BASE}/upload/file`, {
        method: 'POST',
        body: formData,
      }).then(handleResponse);
    },
    batch: (events) => request('/upload/batch', { method: 'POST', body: JSON.stringify({ events }) }),
    batchQueue: (events) => request('/upload/batch-queue', { method: 'POST', body: JSON.stringify({ events }) }),
    queueStats: () => request('/upload/queue/stats'),
    getJobs: (status, start = 0, end = 10) => request(`/upload/queue/jobs/${status}?start=${start}&end=${end}`),
  },

  health: () => request('/health', { baseURL: BASE.replace('/api', '') }),
};

export default api;