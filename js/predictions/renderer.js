export function createPredictionController({
  onOpen
}) {
  let candidates = [];
  let currentIndex = 0;

  function render(predictions) {
    candidates = predictions.candidates || [];
    currentIndex = 0;

    renderLearningScore(predictions.learningScore || 0);
    renderCurrent();
  }

  function renderCurrent() {
    const prediction = candidates[currentIndex] || null;
    const card = document.getElementById('predictionCard');
    const openButton = document.getElementById('predictionOpenBtn');
    const refreshButton = document.getElementById('predictionRefreshBtn');

    if (!card || !openButton || !refreshButton) return;

    if (!prediction) {
      document.getElementById('predictionMealName').textContent =
        'עדיין לומד אתכם';
      document.getElementById('predictionReason').textContent =
        'אחרי עוד כמה בחירות אוכל לתת המלצה מדויקת יותר.';
      document.getElementById('predictionConfidence').textContent =
        '0% התאמה';

      openButton.disabled = true;
      refreshButton.disabled = true;
      return;
    }

    const { meal, confidence, reason } = prediction;

    document.getElementById('predictionMealName').textContent =
      meal.name || 'מנה מומלצת';

    document.getElementById('predictionReason').textContent = reason;
    document.getElementById('predictionConfidence').textContent =
      `${confidence}% התאמה`;

    document.getElementById('predictionEmoji').textContent =
      meal.emoji || '🍽️';

    const image = document.getElementById('predictionImage');
    image.classList.add('hidden');
    image.removeAttribute('src');

    if (meal.image) {
      image.onload = () => image.classList.remove('hidden');
      image.onerror = () => image.classList.add('hidden');
      image.src = meal.image;
    }

    openButton.disabled = false;
    refreshButton.disabled = candidates.length < 2;

    openButton.onclick = () => onOpen?.(meal);
    refreshButton.onclick = () => {
      currentIndex = (currentIndex + 1) % candidates.length;
      card.classList.remove('prediction-swap');
      void card.offsetWidth;
      card.classList.add('prediction-swap');
      renderCurrent();
    };
  }

  return { render };
}

function renderLearningScore(score) {
  const scoreElement = document.getElementById('learningScore');
  const fill = document.getElementById('learningScoreFill');
  const hint = document.getElementById('learningScoreHint');

  if (!scoreElement || !fill || !hint) return;

  animateNumber(scoreElement, score, '%');

  requestAnimationFrame(() => {
    fill.style.setProperty('--learning-score', `${score}%`);
    fill.classList.add('is-visible');
  });

  hint.textContent =
    score < 35
      ? 'אנחנו רק מתחילים להכיר את ההעדפות שלכם.'
      : score < 70
        ? 'המערכת כבר מזהה דפוסים וחוזרת ומשתפרת.'
        : 'המערכת כבר מכירה היטב את ההרגלים שלכם.';
}

function animateNumber(element, target, suffix = '') {
  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (reducedMotion) {
    element.textContent = `${target}${suffix}`;
    return;
  }

  const duration = 720;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = `${Math.round(target * eased)}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}
