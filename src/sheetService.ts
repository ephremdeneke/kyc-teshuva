// Direct Google Sheets CSV fetcher (public sheet)
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1i1W7tDxKRqPcLI9veLDhz6OLiDzK3CE48CV-2j2W3T0/export?format=csv';

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

let cachedData: SheetParticipant[] | null = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export async function fetchSheetData(forceRefresh = false): Promise<SheetParticipant[]> {
  const now = Date.now();
  if (!forceRefresh && cachedData && (now - cacheTime) < CACHE_DURATION) {
    return cachedData;
  }

  try {
    const res = await fetch(SHEET_CSV_URL);
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

    const text = await res.text();
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length < 2) return [];

    // First line is headers (Amharic)
    const participants: SheetParticipant[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVRow(lines[i]);
      if (cols.length < 9) continue;

      const regId = cols[0]?.trim();
      const name = cols[1]?.trim();

      // Skip empty rows
      if (!regId || !name) continue;

      participants.push({
        registrationId: regId,
        fullName: name,
        address: cols[2] || '',
        paymentAmount: parseInt(cols[3]) || 0,
        phone: cols[4] || '',
        church: cols[5] || '',
        serviceDistrict: cols[6] || '',
        date: cols[7] || '',
        paymentMethod: cols[8] || '',
      });
    }

    cachedData = participants;
    cacheTime = now;
    return participants;
  } catch (err) {
    console.error('Failed to fetch sheet data:', err);
    return cachedData || [];
  }
}

export async function searchParticipants(query: string): Promise<SheetParticipant[]> {
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
  const data = await fetchSheetData();
  return data.find(p => p.registrationId === regId) || null;
}

export function getSheetStats(participants: SheetParticipant[]) {
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
