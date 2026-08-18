// Google Apps Script - Deploy as Web App
// Spreadsheet ID from the user's sheet
const SPREADSHEET_ID = '1i1W7tDxKRqPcLI9veLDhz6OLiDzK3CE48CV-2j2W3T0';

const SHEETS = {
  PARTICIPANTS: 'Participants',
  MEALS: 'Meals',
  STAFF: 'Staff',
  CONFIG: 'EventConfig',
};

function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}

function doPut(e) {
  return handleRequest(e, 'PUT');
}

function doDelete(e) {
  return handleRequest(e, 'DELETE');
}

function handleRequest(e, method) {
  const path = e.parameter.path || '';
  const params = e.parameter || {};
  const body = e.postData ? JSON.parse(e.postData.contents) : null;

  try {
    let result;

    // Router
    if (path === 'participants' && method === 'GET') {
      result = getParticipants();
    } else if (path.startsWith('participants/qr/') && method === 'GET') {
      const token = path.split('/qr/')[1];
      result = getParticipantByQR(token);
    } else if (path.startsWith('participants/') && method === 'GET') {
      const id = path.split('/')[1];
      result = getParticipant(id);
    } else if (path === 'participants' && method === 'POST') {
      result = createParticipant(body);
    } else if (path.startsWith('participants/') && method === 'PUT') {
      const id = path.split('/')[1];
      result = updateParticipant(id, body);
    } else if (path.startsWith('participants/') && method === 'DELETE') {
      const id = path.split('/')[1];
      result = deleteParticipant(id);
    } else if (path.startsWith('meals/verify/') && method === 'GET') {
      const regId = path.split('/verify/')[1];
      result = verifyMeal(regId);
    } else if (path === 'meals' && method === 'POST') {
      result = recordMeal(body);
    } else if (path.startsWith('meals/history/') && method === 'GET') {
      const regId = path.split('/history/')[1];
      result = getMealHistory(regId);
    } else if (path === 'stats' && method === 'GET') {
      result = getStats();
    } else if (path === 'config' && method === 'GET') {
      result = getEventConfig();
    } else if (path === 'config' && method === 'POST') {
      result = updateEventConfig(body);
    } else {
      return ContentService.createTextOutput(
        JSON.stringify({ error: 'Not found' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(
      JSON.stringify(result)
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: err.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// ── Helpers ─────────────────────────────────────────────

function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map((row) => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i];
    });
    return obj;
  });
}

function generateId() {
  return Utilities.getUuid().split('-')[0];
}

function generateQRToken() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let token = '';
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function generateRegId(seqNum) {
  const year = new Date().getFullYear();
  const num = String(seqNum).padStart(5, '0');
  return `HKC/${year}/${num}`;
}

// ── Participants ────────────────────────────────────────

function getParticipants() {
  const sheet = getSheet(SHEETS.PARTICIPANTS);
  return { success: true, data: sheetToObjects(sheet) };
}

function getParticipant(id) {
  const sheet = getSheet(SHEETS.PARTICIPANTS);
  const rows = sheetToObjects(sheet);
  const found = rows.find((r) => r.id === id);
  return found
    ? { success: true, data: found }
    : { success: false, error: 'Not found' };
}

function getParticipantByQR(token) {
  const sheet = getSheet(SHEETS.PARTICIPANTS);
  const rows = sheetToObjects(sheet);
  const found = rows.find((r) => r.qrToken === token || r.registrationId === token);
  return found
    ? { success: true, data: found }
    : { success: false, error: 'Participant not found' };
}

function createParticipant(data) {
  const sheet = getSheet(SHEETS.PARTICIPANTS);
  const existing = sheetToObjects(sheet);
  const seqNum = existing.length + 1;
  const id = generateId();
  const regId = generateRegId(seqNum);
  const qrToken = generateQRToken();

  const row = {
    id,
    registrationId: regId,
    fullName: data.fullName || '',
    phone: data.phone || '',
    address: data.address || '',
    church: data.church || '',
    serviceDistrict: data.serviceDistrict || '',
    category: data.category || 'Participant',
    paymentAmount: data.paymentAmount || 0,
    paymentMethod: data.paymentMethod || 'Transfer',
    registrationDate: new Date().toISOString(),
    qrToken,
    notes: data.notes || '',
  };

  // Ensure headers exist
  const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (headerRow.length === 0 || !headerRow[0]) {
    sheet.appendRow(Object.keys(row));
  }

  sheet.appendRow(Object.values(row));

  return { success: true, data: row };
}

function updateParticipant(id, data) {
  const sheet = getSheet(SHEETS.PARTICIPANTS);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) {
      Object.keys(data).forEach((key) => {
        const colIndex = headers.indexOf(key);
        if (colIndex !== -1) {
          sheet.getRange(i + 1, colIndex + 1).setValue(data[key]);
        }
      });
      return { success: true };
    }
  }
  return { success: false, error: 'Not found' };
}

function deleteParticipant(id) {
  const sheet = getSheet(SHEETS.PARTICIPANTS);
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, error: 'Not found' };
}

// ── Meals ───────────────────────────────────────────────

function verifyMeal(registrationId) {
  const sheet = getSheet(SHEETS.MEALS);
  const rows = sheetToObjects(sheet);
  const config = getEventConfig().data;
  const currentDay = getCurrentDay(config);

  if (currentDay === null) {
    return { success: true, data: { canEat: false, message: 'Event not active' } };
  }

  const alreadyClaimed = rows.some(
    (r) => r.registrationId === registrationId && Number(r.dayNumber) === currentDay
  );

  return {
    success: true,
    data: {
      canEat: !alreadyClaimed,
      dayNumber: currentDay,
      alreadyClaimed,
      message: alreadyClaimed
        ? `Day ${currentDay} meal already claimed`
        : `Day ${currentDay} meal available`,
    },
  };
}

function recordMeal(data) {
  const sheet = getSheet(SHEETS.MEALS);
  const config = getEventConfig().data;
  const currentDay = getCurrentDay(config);

  if (currentDay === null) {
    return { success: false, error: 'Event not active' };
  }

  // Check duplicate
  const existing = sheetToObjects(sheet);
  const duplicate = existing.find(
    (r) =>
      r.registrationId === data.registrationId &&
      Number(r.dayNumber) === currentDay
  );

  if (duplicate) {
    return { success: false, error: 'Meal already claimed for today' };
  }

  const id = generateId();
  const row = {
    id,
    registrationId: data.registrationId,
    dayNumber: currentDay,
    date: new Date().toISOString().split('T')[0],
    distributedBy: data.distributedBy || 'Staff',
    distributedAt: new Date().toISOString(),
  };

  sheet.appendRow(Object.values(row));
  return { success: true, data: row };
}

function getMealHistory(registrationId) {
  const sheet = getSheet(SHEETS.MEALS);
  const rows = sheetToObjects(sheet);
  const filtered = rows.filter((r) => r.registrationId === registrationId);
  return { success: true, data: filtered };
}

// ── Stats ───────────────────────────────────────────────

function getStats() {
  const participants = sheetToObjects(getSheet(SHEETS.PARTICIPANTS));
  const meals = sheetToObjects(getSheet(SHEETS.MEALS));

  const dayStats = Array.from({ length: 6 }, (_, i) => ({
    day: i + 1,
    count: meals.filter((m) => Number(m.dayNumber) === i + 1).length,
  }));

  return {
    success: true,
    data: {
      totalRegistered: participants.length,
      mealsDistributed: dayStats,
      totalMeals: meals.length,
    },
  };
}

// ── Config ──────────────────────────────────────────────

function getEventConfig() {
  const sheet = getSheet(SHEETS.CONFIG);
  const rows = sheetToObjects(sheet);

  if (rows.length === 0) {
    return {
      success: true,
      data: {
        eventName: 'HKC Event 2026',
        eventYear: '2026',
        startDate: new Date().toISOString().split('T')[0],
        totalDays: 6,
        orgName: 'Haikal Kidist Christ',
      },
    };
  }

  return { success: true, data: rows[0] };
}

function updateEventConfig(data) {
  const sheet = getSheet(SHEETS.CONFIG);
  const rows = sheet.getDataRange().getValues();

  if (rows.length <= 1) {
    sheet.appendRow(Object.values(data));
  } else {
    const headers = rows[0];
    Object.keys(data).forEach((key) => {
      const colIndex = headers.indexOf(key);
      if (colIndex !== -1) {
        sheet.getRange(2, colIndex + 1).setValue(data[key]);
      }
    });
  }

  return { success: true, data };
}

function getCurrentDay(config) {
  if (!config || !config.startDate) return null;
  const start = new Date(config.startDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const totalDays = config.totalDays || 6;

  if (diffDays < 0 || diffDays >= totalDays) return null;
  return diffDays + 1;
}

// ── Setup Script (Run once) ────────────────────────────

function setupSpreadsheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Create Participants sheet
  let participantsSheet = ss.getSheetByName(SHEETS.PARTICIPANTS);
  if (!participantsSheet) {
    participantsSheet = ss.insertSheet(SHEETS.PARTICIPANTS);
  }
  participantsSheet.appendRow([
    'id', 'registrationId', 'fullName', 'phone', 'address',
    'church', 'serviceDistrict', 'category', 'paymentAmount',
    'paymentMethod', 'registrationDate', 'qrToken', 'notes',
  ]);

  // Create Meals sheet
  let mealsSheet = ss.getSheetByName(SHEETS.MEALS);
  if (!mealsSheet) {
    mealsSheet = ss.insertSheet(SHEETS.MEALS);
  }
  mealsSheet.appendRow([
    'id', 'registrationId', 'dayNumber', 'date',
    'distributedBy', 'distributedAt',
  ]);

  // Create Staff sheet
  let staffSheet = ss.getSheetByName(SHEETS.STAFF);
  if (!staffSheet) {
    staffSheet = ss.insertSheet(SHEETS.STAFF);
  }
  staffSheet.appendRow(['id', 'name', 'role', 'phone', 'pin', 'active']);

  // Create EventConfig sheet
  let configSheet = ss.getSheetByName(SHEETS.CONFIG);
  if (!configSheet) {
    configSheet = ss.insertSheet(SHEETS.CONFIG);
  }
  configSheet.appendRow([
    'eventName', 'eventYear', 'startDate', 'totalDays', 'orgName',
  ]);
  configSheet.appendRow([
    'HKC Event 2026', '2026', new Date().toISOString().split('T')[0], 6, 'Haikal Kidist Christ',
  ]);

  // Remove default Sheet1 if it exists
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet) {
    ss.deleteSheet(defaultSheet);
  }

  Logger.log('Spreadsheet setup complete!');
}
