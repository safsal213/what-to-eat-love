export const API_URL = 'https://script.google.com/macros/s/AKfycbxnMeo5xc1VpgzJ7kXp5W5Fj-F0gGo7MaItOxHPcb6HboJFGA3nhsKfz1ftoS6i2z9aPA/exec';

export async function fetchAppData() {
  const response = await fetch(`${API_URL}?action=data&_=${Date.now()}`, {
    method: 'GET',
    redirect: 'follow',
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`שגיאת שרת ${response.status}`);
  }

  const data = await response.json();

  if (!data?.ok) {
    throw new Error(data?.error || 'ה־API החזיר תשובה לא תקינה');
  }

  return data;
}
