// Google Apps Script API service
// After deploying your Apps Script as Web App, paste the URL here:

const API_URL = import.meta.env.VITE_API_URL || '';

if (!API_URL) {
  console.warn(
    '[HKC] VITE_API_URL is not set. Create a .env file with:\n' +
    'VITE_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYED_URL/exec\n' +
    'Then restart the dev server.'
  );
}

export interface SheetParticipant {
  registrationId: string;
  fullName: string;
  address: string;
  paymentAmount: number;
  phone: string;
  church: string;
  serviceDistrict: string;
  date: string;
  paymentMethod: string;
}

// ── Core API call ──────────────────────────────────────────

async function apiGet(action: string, params: Record<string, string> = {}) {
  if (!API_URL) throw new Error('VITE_API_URL not configured — see console for instructions');
  const url = new URL(API_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiPost(action: string, body: unknown) {
  if (!API_URL) throw new Error('VITE_API_URL not configured — see console for instructions');
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...(body as object) }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── Participants ───────────────────────────────────────────

let cachedData: SheetParticipant[] | null = null;
let cacheTime = 0;
const CACHE_DURATION = 30 * 1000; // 30 seconds

export async function fetchSheetData(forceRefresh = false): Promise<SheetParticipant[]> {
  const now = Date.now();
  if (!forceRefresh && cachedData && (now - cacheTime) < CACHE_DURATION) {
    return cachedData;
  }

  if (!API_URL) {
    throw new Error('APP_CONFIG_MISSING: Set VITE_API_URL in .env and restart dev server');
  }

  try {
    const result = await apiGet('participants');
    if (result.success && Array.isArray(result.data)) {
      cachedData = result.data;
      cacheTime = now;
      return result.data;
    }
    return cachedData || [];
  } catch (err) {
    console.error('Failed to fetch from Apps Script:', err);
    if (cachedData) return cachedData;
    throw err;
  }
}

export async function searchParticipants(query: string): Promise<SheetParticipant[]> {
  try {
    const result = await apiGet('search', { q: query });
    if (result.success && Array.isArray(result.data)) {
      return result.data;
    }
  } catch (err) {
    console.error('Search failed:', err);
  }
  // Fallback to local filter
  const data = await fetchSheetData();
  const q = query.toLowerCase();
  return data.filter(p =>
    p.fullName.toLowerCase().includes(q) ||
    p.registrationId.toLowerCase().includes(q) ||
    p.phone.includes(q) ||
    p.church.toLowerCase().includes(q) ||
    p.address.toLowerCase().includes(q) ||
    p.serviceDistrict.toLowerCase().includes(q)
  );
}

export async function getParticipantByRegId(regId: string): Promise<SheetParticipant | null> {
  try {
    const result = await apiGet('participant', { id: regId });
    if (result.success && result.data) {
      return result.data;
    }
  } catch (err) {
    console.error('Get participant failed:', err);
  }
  return null;
}

export async function registerParticipant(data: {
  fullName: string;
  phone?: string;
  address?: string;
  church?: string;
  serviceDistrict?: string;
  paymentAmount?: number;
  paymentMethod?: string;
}) {
  try {
    const result = await apiPost('register', data);
    // Invalidate cache
    cachedData = null;
    return result;
  } catch (err) {
    console.error('Registration failed:', err);
    return { success: false, error: String(err) };
  }
}

// ── Meals ──────────────────────────────────────────────────

export async function verifyMeal(registrationId: string) {
  try {
    return await apiGet('verify', { regId: registrationId });
  } catch (err) {
    console.error('Verify meal failed:', err);
    return { success: false, error: String(err) };
  }
}

export async function recordMeal(registrationId: string, distributedBy: string) {
  try {
    return await apiPost('recordMeal', { registrationId, distributedBy });
  } catch (err) {
    console.error('Record meal failed:', err);
    return { success: false, error: String(err) };
  }
}

export async function getMealHistory(registrationId: string) {
  try {
    return await apiGet('meals', { regId: registrationId });
  } catch (err) {
    console.error('Meal history failed:', err);
    return { success: false, error: String(err) };
  }
}

// ── Stats ──────────────────────────────────────────────────

export function getSheetStats(participants: SheetParticipant[]) {
  // Calculate stats locally from the data we have
  const churches: Record<string, number> = {};
  const districts: Record<string, number> = {};
  const paymentMethods: Record<string, number> = {};
  let totalPayment = 0;

  participants.forEach(p => {
    churches[p.church || 'Unknown'] = (churches[p.church || 'Unknown'] || 0) + 1;
    if (p.serviceDistrict) {
      districts[p.serviceDistrict] = (districts[p.serviceDistrict] || 0) + 1;
    }
    paymentMethods[p.paymentMethod || 'Unknown'] = (paymentMethods[p.paymentMethod || 'Unknown'] || 0) + 1;
    totalPayment += p.paymentAmount || 0;
  });

  return {
    total: participants.length,
    totalPayment,
    churches: Object.entries(churches).sort((a, b) => b[1] - a[1]),
    districts: Object.entries(districts).sort((a, b) => b[1] - a[1]),
    paymentMethods: Object.entries(paymentMethods).sort((a, b) => b[1] - a[1]),
  };
}
