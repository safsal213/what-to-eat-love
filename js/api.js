export const API_URL =
'https://script.google.com/macros/s/AKfycbxnMeo5xc1VpgzJ7kXp5W5Fj-F0gGo7MaItOxHPcb6HboJFGA3nhsKfz1ftoS6i2z9aPA/exec';

async function readJson(response) {
  if (!response.ok) {
    throw new Error(`שגיאת שרת ${response.status}`);
  }

  const text = await response.text();

  if (!text) {
    throw new Error('השרת החזיר תשובה ריקה');
  }

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('השרת החזיר תשובה שאינה JSON תקין');
  }

  if (data?.ok === false) {
    throw new Error(data.error || 'השרת החזיר שגיאה');
  }

  return data;
}

async function postToApi(payload) {
  let lastError;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch(
        `${API_URL}?_=${Date.now()}&attempt=${attempt}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(payload),
          redirect: 'follow',
          cache: 'no-store'
        }
      );

      return await readJson(response);
    } catch (error) {
      lastError = error;

      if (attempt < 2) {
        await new Promise(resolve => window.setTimeout(resolve, 450));
      }
    }
  }

  throw lastError || new Error('לא הצלחנו להתחבר לשרת');
}

export async function fetchAppData() {
  const response = await fetch(
    `${API_URL}?action=data&user=${encodeURIComponent('מעיין')}&_=${Date.now()}`,
    {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store'
    }
  );

  return readJson(response);
}

export async function fetchLatestSelection() {
  const response = await fetch(
    `${API_URL}?action=latestSelection&_=${Date.now()}`,
    {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store'
    }
  );

  const data = await readJson(response);
  return data.selection || null;
}

export async function saveSelection(meal) {
  return postToApi({
    action: 'selectMeal',
    mealId: meal.id,
    mealName: meal.name,
    selectedBy: 'מעיין',
    notes: ''
  });
}

export async function toggleFavorite(meal, user = 'מעיין') {
  const data = await postToApi({
    action: 'toggleFavorite',
    user,
    mealId: meal.id,
    mealName: meal.name
  });

  if (!data.favorite) {
    throw new Error('השרת לא החזיר את מצב המועדף');
  }

  return data.favorite;
}
