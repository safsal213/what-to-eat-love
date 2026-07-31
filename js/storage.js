const DATA_CACHE_KEY = 'whatToEat.cache.v1';
const LATEST_SELECTION_KEY = 'whatToEat.latestSelection.v1';

export function saveCachedData(data) {
  localStorage.setItem(DATA_CACHE_KEY, JSON.stringify({
    savedAt: new Date().toISOString(),
    data
  }));
}

export function getCachedData() {
  try {
    const value = JSON.parse(localStorage.getItem(DATA_CACHE_KEY) || 'null');
    return value?.data || null;
  } catch {
    return null;
  }
}

export function saveLatestSelection(selection) {
  localStorage.setItem(LATEST_SELECTION_KEY, JSON.stringify(selection));
}

export function getLatestSelection() {
  try {
    return JSON.parse(localStorage.getItem(LATEST_SELECTION_KEY) || 'null');
  } catch {
    return null;
  }
}
