const DATA_CACHE_KEY = 'whatToEat.cache.v1';
const LATEST_SELECTION_KEY = 'whatToEat.latestSelection.v1';
const USER_ROLE_KEY = 'whatToEat.userRole.v1';

export function saveCachedData(data) {
  localStorage.setItem(DATA_CACHE_KEY, JSON.stringify({ savedAt: new Date().toISOString(), data }));
}

export function getCachedData() {
  try { return JSON.parse(localStorage.getItem(DATA_CACHE_KEY) || 'null')?.data || null; }
  catch { return null; }
}

export function saveLatestSelection(selection) {
  localStorage.setItem(LATEST_SELECTION_KEY, JSON.stringify(selection));
}

export function getLatestSelection() {
  try { return JSON.parse(localStorage.getItem(LATEST_SELECTION_KEY) || 'null'); }
  catch { return null; }
}

export function saveUserRole(role) {
  localStorage.setItem(USER_ROLE_KEY, role);
}

export function getUserRole() {
  const role = localStorage.getItem(USER_ROLE_KEY);
  return role === 'maayan' || role === 'haim' ? role : null;
}

export function clearUserRole() {
  localStorage.removeItem(USER_ROLE_KEY);
}
