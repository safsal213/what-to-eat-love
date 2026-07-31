export const API_URL =
'https://script.google.com/macros/s/AKfycbxnMeo5xc1VpgzJ7kXp5W5Fj-F0gGo7MaItOxHPcb6HboJFGA3nhsKfz1ftoS6i2z9aPA/exec';

async function readJson(response) {
  if (!response.ok) throw new Error(`שגיאת שרת ${response.status}`);
  const data = await response.json();
  if (data?.ok === false) throw new Error(data.error || 'השרת החזיר שגיאה');
  return data;
}

export async function fetchAppData() {
  const response = await fetch(`${API_URL}?action=data&_=${Date.now()}`, {
    method: 'GET',
    redirect: 'follow',
    cache: 'no-store'
  });
  return readJson(response);
}

export async function fetchLatestSelection() {
  const response = await fetch(`${API_URL}?action=latestSelection&_=${Date.now()}`, {
    method: 'GET',
    redirect: 'follow',
    cache: 'no-store'
  });
  const data = await readJson(response);
  return data.selection || null;
}

export async function saveSelection(meal) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'selectMeal',
      mealId: meal.id,
      mealName: meal.name,
      selectedBy: 'מעיין',
      notes: ''
    })
  });
  return readJson(response);
}


export async function toggleFavorite(meal, user = 'מעיין') {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'toggleFavorite',
      user,
      mealId: meal.id,
      mealName: meal.name
    })
  });

  const data = await readJson(response);
  return data.favorite;
}
