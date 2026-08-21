// ============================================================
// Google Apps Script — HKC Registration & Meal Backend
// Deploy as: Web App → Execute as: Me → Who has access: Anyone
// ============================================================

const SPREADSHEET_ID = '1i1W7tDxKRqPcLI9veLDhz6OLiDzK3CE48CV-2j2W3T0';

// Event start date — update this when the event begins
// Format: 'YYYY-MM-DD' (used to calculate which meal day it is)
const EVENT_START_DATE = '2026-08-21';
const EVENT_DAYS = 6;

// Your sheet's actual column headers (Amharic)
const COL = {
  REG_ID: 'መለያ ቁጥር',
  NAME: 'ሙሉ ስም',
  ADDRESS: 'አድራሻ',
  PAYMENT: 'ክፍያ',
  PHONE: 'ስልክ',
  CHURCH: 'ቤተ-ክርስቲያን',
  DISTRICT: 'የአገልግሎት ድርሻ',
  DATE: 'ቀን',
  METHOD: 'ምርመራ',
};

// ── HTTP Handlers ──────────────────────────────────────────

function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}

function handleRequest(e, method) {
  const params = e.parameter || {};
  const path = params.action || params.path || '';
  const body = e.postData ? JSON.parse(e.postData.contents) : null;

  const output = ContentService.createTextOutput;
  const json = ContentService.MimeType.JSON;

  try {
    let result;

    switch (path) {
      case 'participants':
        result = getParticipants(params);
        break;
      case 'participant':
        result = getParticipant(params.id);
        break;
      case 'register':
        result = createParticipant(body);
        break;
      case 'verify':
        result = verifyMeal(params.regId || body?.registrationId);
        break;
      case 'recordMeal':
        result = recordMeal(body);
        break;
      case 'meals':
        result = getMealHistory(params.regId);
        break;
      case 'stats':
        result = getStats();
        break;
      case 'search':
        result = searchParticipants(params.q);
        break;
      default:
        result = { success: false, error: 'Unknown action: ' + path };
    }

    return output(JSON.stringify(result)).setMimeType(json);

  } catch (err) {
    return output(JSON.stringify({
      success: false,
      error: err.message || String(err)
    })).setMimeType(json);
  }
}

// ── Helpers ────────────────────────────────────────────────

function getMainSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  // Use the first sheet (the one with your data)
  return ss.getSheets()[0];
}

function getOrCreateSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function generateId() {
  return Utilities.getUuid().split('-')[0];
}

function generateRegId(seqNum) {
  const year = new Date().getFullYear();
  return `HKC/${year}/${String(seqNum).padStart(5, '0')}`;
}

// Read all rows from main sheet and map to objects
function readAllParticipants() {
  const sheet = getMainSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  // First row = headers (Amharic)
  const headers = data[0];
  const participants = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const regId = String(row[0] || '').trim();
    const name = String(row[1] || '').trim();

    // Skip empty rows
    if (!regId && !name) continue;

    participants.push({
      registrationId: regId,
      fullName: name,
      address: String(row[2] || ''),
      paymentAmount: parseInt(row[3]) || 0,
      phone: String(row[4] || ''),
      church: String(row[5] || ''),
      serviceDistrict: String(row[6] || ''),
      date: String(row[7] || ''),
      paymentMethod: String(row[8] || ''),
      _row: i + 1, // 1-indexed row number for updates
    });
  }

  return participants;
}

// ── Participants ───────────────────────────────────────────

function getParticipants(params) {
  const all = readAllParticipants();

  // If searching
  if (params && params.search) {
    const q = params.search.toLowerCase();
    const filtered = all.filter(p =>
      p.fullName.toLowerCase().includes(q) ||
      p.registrationId.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      p.church.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q) ||
      p.serviceDistrict.toLowerCase().includes(q)
    );
    return { success: true, data: filtered, total: filtered.length };
  }

  return { success: true, data: all, total: all.length };
}

function getParticipant(id) {
  if (!id) return { success: false, error: 'No ID provided' };

  const all = readAllParticipants();
  const found = all.find(p =>
    p.registrationId === id ||
    p.registrationId.toLowerCase() === id.toLowerCase()
  );

  return found
    ? { success: true, data: found }
    : { success: false, error: 'Participant not found' };
}

function createParticipant(data) {
  const sheet = getMainSheet();
  const existing = readAllParticipants();
  const seqNum = existing.length + 1;
  const regId = generateRegId(seqNum);

  // Write to sheet using Amharic column order
  const row = [
    regId,                          // መለያ ቁጥር
    data.fullName || '',            // ሙሉ ስም
    data.address || '',             // አድራሻ
    data.paymentAmount || 0,        // ክፍያ
    data.phone || '',               // ስልክ
    data.church || '',              // ቤተ-ክርስቲያን
    data.serviceDistrict || '',     // የአገልግሎት ድርሻ
    new Date().toLocaleDateString('am-ET'), // ቀን
    data.paymentMethod || 'Transfer', // ምርመራ
  ];

  sheet.appendRow(row);

  return {
    success: true,
    data: {
      registrationId: regId,
      fullName: data.fullName,
      phone: data.phone,
      church: data.church,
    }
  };
}

// ── Meals ──────────────────────────────────────────────────

function getMealsSheet() {
  return getOrCreateSheet('Meals');
}

function readAllMeals() {
  const sheet = getMealsSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function getCurrentDay() {
  const now = new Date();
  const start = new Date(EVENT_START_DATE);
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
  if (diffDays < 1) return 1; // Before event — treat as day 1
  if (diffDays > EVENT_DAYS) return EVENT_DAYS; // After event — treat as last day
  return diffDays;
}

function verifyMeal(registrationId) {
  if (!registrationId) {
    return { success: false, error: 'No registration ID' };
  }

  const all = readAllParticipants();
  const participant = all.find(p =>
    p.registrationId === registrationId ||
    p.registrationId.toLowerCase() === registrationId.toLowerCase()
  );

  if (!participant) {
    return {
      success: true,
      data: { found: false, message: 'Participant not found' }
    };
  }

  const currentDay = getCurrentDay();

  const meals = readAllMeals();
  const alreadyClaimed = meals.some(m =>
    String(m.registrationId) === registrationId &&
    Number(m.dayNumber) === currentDay
  );

  return {
    success: true,
    data: {
      found: true,
      participant: {
        registrationId: participant.registrationId,
        fullName: participant.fullName,
        church: participant.church,
        phone: participant.phone,
      },
      dayNumber: currentDay,
      canEat: !alreadyClaimed,
      alreadyClaimed,
      message: alreadyClaimed
        ? `Day ${currentDay} meal already claimed`
        : `Day ${currentDay} meal available`,
    }
  };
}

function recordMeal(data) {
  if (!data || !data.registrationId) {
    return { success: false, error: 'No registration ID' };
  }

  const sheet = getMealsSheet();

  // Ensure headers exist
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'id', 'registrationId', 'dayNumber', 'date',
      'distributedBy', 'distributedAt'
    ]);
  }

  // Check duplicate
  const meals = readAllMeals();
  const currentDay = getCurrentDay();
  const duplicate = meals.find(m =>
    String(m.registrationId) === data.registrationId &&
    Number(m.dayNumber) === currentDay
  );

  if (duplicate) {
    return { success: false, error: 'Meal already claimed for today' };
  }

  const row = [
    generateId(),
    data.registrationId,
    currentDay,
    new Date().toISOString().split('T')[0],
    data.distributedBy || 'Staff',
    new Date().toISOString(),
  ];

  sheet.appendRow(row);

  return {
    success: true,
    data: {
      registrationId: data.registrationId,
      dayNumber: currentDay,
      message: 'Meal recorded successfully'
    }
  };
}

function getMealHistory(registrationId) {
  const meals = readAllMeals();
  const filtered = meals.filter(m =>
    String(m.registrationId) === registrationId
  );
  return { success: true, data: filtered };
}

// ── Search ─────────────────────────────────────────────────

function searchParticipants(query) {
  if (!query) return getParticipants({});

  const all = readAllParticipants();
  const q = query.toLowerCase();

  const filtered = all.filter(p =>
    p.fullName.toLowerCase().includes(q) ||
    p.registrationId.toLowerCase().includes(q) ||
    p.phone.includes(q) ||
    p.church.toLowerCase().includes(q) ||
    p.address.toLowerCase().includes(q) ||
    p.serviceDistrict.toLowerCase().includes(q)
  );

  return { success: true, data: filtered, total: filtered.length };
}

// ── Stats ──────────────────────────────────────────────────

function getStats() {
  const participants = readAllParticipants();
  const meals = readAllMeals();

  const churches = {};
  const districts = {};
  const paymentMethods = {};
  let totalPayment = 0;

  participants.forEach(p => {
    churches[p.church || 'Unknown'] = (churches[p.church || 'Unknown'] || 0) + 1;
    if (p.serviceDistrict) {
      districts[p.serviceDistrict] = (districts[p.serviceDistrict] || 0) + 1;
    }
    paymentMethods[p.paymentMethod || 'Unknown'] = (paymentMethods[p.paymentMethod || 'Unknown'] || 0) + 1;
    totalPayment += p.paymentAmount || 0;
  });

  const dayStats = Array.from({ length: 6 }, (_, i) => ({
    day: i + 1,
    count: meals.filter(m => Number(m.dayNumber) === i + 1).length,
  }));

  return {
    success: true,
    data: {
      totalRegistered: participants.length,
      totalMeals: meals.length,
      totalPayment,
      churches: Object.entries(churches).sort((a, b) => b[1] - a[1]),
      districts: Object.entries(districts).sort((a, b) => b[1] - a[1]),
      paymentMethods: Object.entries(paymentMethods).sort((a, b) => b[1] - a[1]),
      mealsByDay: dayStats,
    }
  };
}

// ── CORS Helper ────────────────────────────────────────────

function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
