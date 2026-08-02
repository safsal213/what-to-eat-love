export function renderRediscover({
  candidate,
  onOpen
}) {
  const card = document.getElementById('rediscoverCard');
  const button = document.getElementById('rediscoverBtn');

  if (!card || !button) return;

  if (!candidate) {
    card.classList.add('hidden');
    button.onclick = null;
    return;
  }

  const { meal, daysSince } = candidate;

  document.getElementById('rediscoverMealName').textContent =
    meal.name || 'מנה מהעבר';

  document.getElementById('rediscoverReason').textContent =
    daysSince === 1
      ? 'עבר יום מאז שבחרתם אותה'
      : `עברו כבר ${daysSince} ימים מאז שבחרתם אותה`;

  document.getElementById('rediscoverEmoji').textContent =
    meal.emoji || '🍽️';

  const image = document.getElementById('rediscoverImage');
  image.classList.add('hidden');
  image.removeAttribute('src');

  if (meal.image) {
    image.onload = () => image.classList.remove('hidden');
    image.onerror = () => image.classList.add('hidden');
    image.src = meal.image;
  }

  button.onclick = () => onOpen?.(meal);
  card.classList.remove('hidden');
}
