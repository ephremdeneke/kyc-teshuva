// API client — calls Google Apps Script backend
// After deploying, update the URL in .env:
//   VITE_API_URL=https://script.google.com/macros/s/YOUR_ID/exec

const API_URL = import.meta.env.VITE_API_URL || '';

async function apiCall(params: Record<string, string>) {
  const url = new URL(API_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiPost(body: Record<string, unknown>) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const api = {
  // Participants
  getParticipants: () => apiCall({ action: 'participants' }),
  getParticipant: (id: string) => apiCall({ action: 'participant', id }),
  searchParticipants: (q: string) => apiCall({ action: 'search', q }),
  registerParticipant: (data: Record<string, unknown>) =>
    apiPost({ action: 'register', ...data }),

  // Meals
  verifyMeal: (regId: string) => apiCall({ action: 'verify', regId }),
  recordMeal: (registrationId: string, distributedBy: string) =>
    apiPost({ action: 'recordMeal', registrationId, distributedBy }),
  getMealHistory: (regId: string) => apiCall({ action: 'meals', regId }),

  // Stats
  getStats: () => apiCall({ action: 'stats' }),
};
