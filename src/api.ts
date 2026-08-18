const API_BASE = import.meta.env.VITE_API_URL || '';

async function apiCall(endpoint: string, method = 'GET', body?: unknown) {
  const url = `${API_BASE}/api/${endpoint}`;
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);
  
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  getParticipants: () => apiCall('participants'),
  getParticipant: (id: string) => apiCall(`participants/${id}`),
  getParticipantByQR: (qrToken: string) => apiCall(`participants/qr/${qrToken}`),
  createParticipant: (data: Record<string, unknown>) => apiCall('participants', 'POST', data),
  updateParticipant: (id: string, data: Record<string, unknown>) => apiCall(`participants/${id}`, 'PUT', data),
  deleteParticipant: (id: string) => apiCall(`participants/${id}`, 'DELETE'),
  
  verifyMeal: (registrationId: string) => apiCall(`meals/verify/${registrationId}`),
  recordMeal: (data: { registrationId: string; distributedBy: string }) => apiCall('meals', 'POST', data),
  getMealHistory: (registrationId: string) => apiCall(`meals/history/${registrationId}`),
  
  getStats: () => apiCall('stats'),
  getEventConfig: () => apiCall('config'),
  updateEventConfig: (data: Record<string, unknown>) => apiCall('config', 'POST', data),
  
  login: (pin: string) => apiCall('auth/login', 'POST', { pin }),
};
