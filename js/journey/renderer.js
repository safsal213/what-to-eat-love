export function renderJourney(journey) {
  animateNumber('journeyDays', journey.days);
  animateNumber('journeyMeals', journey.meals);
  animateNumber('journeyUnique', journey.uniqueMeals);
  animateNumber('journeyAchievements', journey.unlockedAchievements);
}

function animateNumber(id, target) {
  const element = document.getElementById(id);
  if (!element) return;

  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (reducedMotion) {
    element.textContent = String(target);
    return;
  }

  const duration = 760;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = String(Math.round(target * eased));

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}
