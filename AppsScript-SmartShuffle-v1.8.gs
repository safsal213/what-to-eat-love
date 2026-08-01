/**
 * API לאפליקציה "מה בא לך לאכול אהובתי?"
 * כולל Smart Shuffle History.
 */

const SHEETS = {
  CATEGORIES: 'קטגוריות',
  MEALS: 'מנות',
  SELECTIONS: 'בחירות',
  USERS: 'משתמשים',
  FAVORITES: 'מועדפים',
  SHOPPING: 'רשימת קניות',
  SETTINGS: 'הגדרות',
};

function doGet(e) {
  try {
    const action = String(e?.parameter?.action || 'data').trim();
    const user = String(e?.parameter?.user || 'מעיין').trim();

    if (action === 'data') {
      return jsonResponse({
        ok: true,
        categories: readSheetObjects(SHEETS.CATEGORIES),
        meals: readSheetObjects(SHEETS.MEALS),
        settings: readSettings(),
        favorites: getFavorites(user),
      });
    }

    if (action === 'latestSelection') {
      return jsonResponse({
        ok: true,
        selection: getLatestSelection(),
      });
    }

    if (action === 'selectionHistory') {
      const limit = Math.max(
        1,
        Math.min(1000, Number(e?.parameter?.limit || 200))
      );

      return jsonResponse({
        ok: true,
        selections: getSelectionHistory(limit),
      });
    }

    if (action === 'favorites') {
      return jsonResponse({
        ok: true,
        favorites: getFavorites(user),
      });
    }

    return jsonResponse({
      ok: false,
      error: 'Unknown action',
    });
  } catch (error) {
    console.error(error);
    return jsonResponse({
      ok: false,
      error: error.message,
    });
  }
}

function doPost(e) {
  try {
    const payload = parseRequestBody(e);
    const action = String(payload.action || '').trim();

    if (action === 'selectMeal') {
      return jsonResponse({
        ok: true,
        selection: saveSelection(payload),
      });
    }

    if (action === 'toggleFavorite') {
      return jsonResponse({
        ok: true,
        favorite: toggleFavorite(payload),
      });
    }

    return jsonResponse({
      ok: false,
      error: 'Unknown action',
    });
  } catch (error) {
    console.error(error);
    return jsonResponse({
      ok: false,
      error: error.message,
    });
  }
}

function readSheetObjects(sheetName) {
  const sheet = getRequiredSheet(sheetName);
  const values = sheet.getDataRange().getDisplayValues();

  if (values.length < 2) return [];

  const headers = values[0].map(header => String(header).trim());

  return values
    .slice(1)
    .filter(row => row.some(cell => String(cell).trim() !== ''))
    .map(row => {
      const item = {};
      headers.forEach((header, index) => {
        if (header) item[header] = normalizeValue(row[index]);
      });
      return item;
    });
}

function readSettings() {
  const rows = readSheetObjects(SHEETS.SETTINGS);
  const settings = {};

  rows.forEach(row => {
    const key = row.Setting || row.setting;
    const value = row.Value || row.value;
    if (key) settings[key] = value;
  });

  return settings;
}

function saveSelection(payload) {
  const mealId = String(payload.mealId || '').trim();
  const mealName = String(payload.mealName || '').trim();
  const selectedBy = String(payload.selectedBy || 'מעיין').trim();
  const notes = String(payload.notes || '').trim();

  if (!mealId || !mealName) {
    throw new Error('חסרים מזהה מנה או שם מנה');
  }

  const sheet = getRequiredSheet(SHEETS.SELECTIONS);
  const selectionId = Utilities.getUuid();
  const selectedAt = new Date();
  const status = 'חדש';

  sheet.appendRow([
    selectionId,
    selectedAt,
    selectedBy,
    mealId,
    mealName,
    status,
    notes,
  ]);

  return {
    SelectionID: selectionId,
    Date: selectedAt.toISOString(),
    User: selectedBy,
    MealID: mealId,
    MealName: mealName,
    Status: status,
    Notes: notes,
  };
}

function getLatestSelection() {
  const selections = readSheetObjects(SHEETS.SELECTIONS);
  return selections.length ? selections[selections.length - 1] : null;
}

function getSelectionHistory(limit) {
  return readSheetObjects(SHEETS.SELECTIONS)
    .slice(-limit)
    .reverse();
}

function getFavorites(user) {
  return readSheetObjects(SHEETS.FAVORITES).filter(row => {
    return String(row.User || '').trim() === user &&
      normalizeBoolean(row.Active);
  });
}

function toggleFavorite(payload) {
  const user = String(payload.user || 'מעיין').trim();
  const mealId = String(payload.mealId || '').trim();
  const mealName = String(payload.mealName || '').trim();

  if (!mealId || !mealName) {
    throw new Error('חסרים מזהה מנה או שם מנה');
  }

  const sheet = getRequiredSheet(SHEETS.FAVORITES);
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(value => String(value).trim());

  const userIndex = headers.indexOf('User');
  const mealIdIndex = headers.indexOf('MealID');
  const activeIndex = headers.indexOf('Active');
  const updatedAtIndex = headers.indexOf('UpdatedAt');

  if ([userIndex, mealIdIndex, activeIndex].some(index => index === -1)) {
    throw new Error('מבנה הגיליון מועדפים אינו תקין');
  }

  let existingRow = -1;

  for (let rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    const rowUser = String(values[rowIndex][userIndex] || '').trim();
    const rowMealId = String(values[rowIndex][mealIdIndex] || '').trim();

    if (rowUser === user && rowMealId === mealId) {
      existingRow = rowIndex + 1;
      break;
    }
  }

  const now = new Date();

  if (existingRow > 0) {
    const currentActive = normalizeBoolean(
      sheet.getRange(existingRow, activeIndex + 1).getValue()
    );
    const nextActive = !currentActive;

    sheet.getRange(existingRow, activeIndex + 1).setValue(nextActive);

    if (updatedAtIndex >= 0) {
      sheet.getRange(existingRow, updatedAtIndex + 1).setValue(now);
    }

    return {
      FavoriteID: String(sheet.getRange(existingRow, 1).getValue()),
      User: user,
      MealID: mealId,
      MealName: mealName,
      Active: nextActive,
      UpdatedAt: now.toISOString(),
    };
  }

  const favoriteId = Utilities.getUuid();

  sheet.appendRow([
    favoriteId,
    user,
    mealId,
    mealName,
    now,
    now,
    true,
  ]);

  return {
    FavoriteID: favoriteId,
    User: user,
    MealID: mealId,
    MealName: mealName,
    CreatedAt: now.toISOString(),
    UpdatedAt: now.toISOString(),
    Active: true,
  };
}

function getRequiredSheet(sheetName) {
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(sheetName);

  if (!sheet) {
    throw new Error(`הגיליון "${sheetName}" לא נמצא`);
  }

  return sheet;
}

function parseRequestBody(e) {
  if (!e?.postData?.contents) return {};

  try {
    return JSON.parse(e.postData.contents);
  } catch {
    throw new Error('הבקשה שנשלחה אינה JSON תקין');
  }
}

function normalizeValue(value) {
  const text = String(value ?? '').trim();
  const lower = text.toLowerCase();

  if (lower === 'true' || text === 'כן') return true;
  if (lower === 'false' || text === 'לא') return false;

  return text;
}

function normalizeBoolean(value) {
  if (typeof value === 'boolean') return value;

  const text = String(value ?? '').trim().toLowerCase();

  return ['true', '1', 'yes', 'כן', 'on'].includes(text);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
