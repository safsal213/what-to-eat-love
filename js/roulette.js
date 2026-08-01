import { el, showView } from './ui.js';
import { escapeHtml, shuffleArray } from './utils.js';

const ITEM_HEIGHT = 116;
const SPIN_DURATION = 2650;
const SETTLE_DELAY = 980;
const STATUS_INTERVAL = 520;

const STATUS_MESSAGES = [
  '🧠 בודק מה לא אכלתם לאחרונה…',
  '❤️ נותן עדיפות למועדפים…',
  '📅 מסתכל על ההיסטוריה…',
  '🍽️ מחפש משהו שיתאים…',
  '✨ כמעט מצאתי…'
];

export function createRouletteController({
  onComplete,
  onCancel,
  onPreload,
  onFeedback
}) {
  let animation = null;
  let completionTimer = null;
  let statusTimer = null;
  let running = false;
  let statusIndex = 0;

  function start({ meals = [], pickedMeal, pickedScore = null }) {
    if (!pickedMeal || !meals.length || running) return;

    stopTimers();
    running = true;
    statusIndex = 0;

    const sequence = buildSequence(meals, pickedMeal);
    renderSequence(sequence);

    if (typeof onPreload === 'function') {
      onPreload(sequence.map(meal => meal.image).filter(Boolean));
    }

    el('rouletteStatus').textContent = STATUS_MESSAGES[0];
    el('rouletteStatus').classList.remove('is-winner-text');

    el('rouletteWinnerCopy').classList.add('hidden');
    el('rouletteWinnerName').textContent = '';
    el('rouletteWinnerReason').textContent = '';

    document.querySelector('.roulette-window')
      ?.classList.remove('is-spotlight', 'is-pulsing');

    el('cancelRouletteBtn').disabled = false;
    showView('rouletteView');

    startStatusCycle();

    const reel = el('rouletteReel');
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    requestAnimationFrame(() => {
      if (reducedMotion) {
        reel.style.transform =
          `translateY(-${(sequence.length - 1) * ITEM_HEIGHT}px)`;

        finish(pickedMeal, pickedScore);
        return;
      }

      animation = reel.animate(
        [
          {
            offset: 0,
            transform: 'translateY(0)',
            filter: 'blur(0)'
          },
          {
            offset: .7,
            transform:
              `translateY(-${(sequence.length - 4) * ITEM_HEIGHT}px)`,
            filter: 'blur(1.1px)'
          },
          {
            offset: .9,
            transform:
              `translateY(-${(sequence.length - 2) * ITEM_HEIGHT}px)`,
            filter: 'blur(.45px)'
          },
          {
            offset: 1,
            transform:
              `translateY(-${(sequence.length - 1) * ITEM_HEIGHT}px)`,
            filter: 'blur(0)'
          }
        ],
        {
          duration: SPIN_DURATION,
          easing: 'cubic-bezier(.08,.72,.15,1)',
          fill: 'forwards'
        }
      );

      animation.onfinish = () => finish(pickedMeal, pickedScore);
      animation.oncancel = () => {};
    });
  }

  function startStatusCycle() {
    window.clearInterval(statusTimer);

    statusTimer = window.setInterval(() => {
      statusIndex = (statusIndex + 1) % STATUS_MESSAGES.length;
      const status = el('rouletteStatus');

      status.classList.remove('status-swap');
      void status.offsetWidth;
      status.textContent = STATUS_MESSAGES[statusIndex];
      status.classList.add('status-swap');
    }, STATUS_INTERVAL);
  }

  function finish(pickedMeal, pickedScore = null) {
    window.clearInterval(statusTimer);
    statusTimer = null;

    const status = el('rouletteStatus');
    status.textContent = 'ההמלצה שלנו להיום';
    status.classList.add('is-winner-text');

    el('cancelRouletteBtn').disabled = true;

    const reel = el('rouletteReel');
    const finalItem = reel.lastElementChild;
    const rouletteWindow = document.querySelector('.roulette-window');

    [...reel.children].forEach(item => {
      if (item !== finalItem) {
        item.classList.add('is-dimmed');
      }
    });

    finalItem?.classList.add('is-winner');
    rouletteWindow?.classList.add('is-spotlight', 'is-pulsing');

    el('rouletteWinnerName').textContent = pickedMeal.name;
    el('rouletteWinnerReason').textContent =
      buildReason(pickedMeal, pickedScore);

    el('rouletteWinnerCopy').classList.remove('hidden');
    createConfetti();

    if (typeof onFeedback === 'function') {
      onFeedback();
    }

    completionTimer = window.setTimeout(() => {
      running = false;

      if (typeof onComplete === 'function') {
        onComplete(pickedMeal);
      }
    }, 1650);
  }

  function buildReason(meal, pickedScore) {
    const reasons = pickedScore?.reasons || [];

    if (meal.favorite) {
      return '❤️ אחת המנות האהובות על מעיין';
    }

    if (reasons.some(reason => reason.includes('לא נבחרה חודש'))) {
      return '📅 הרבה זמן לא אכלתם אותה';
    }

    if (reasons.some(reason => reason.includes('טרם נבחרה'))) {
      return '✨ הגיע הזמן לנסות אותה';
    }

    if (reasons.some(reason => reason.includes('נבחרה השבוע'))) {
      return '⚖️ נבחרה באיזון עם הבחירות האחרונות';
    }

    return '🧠 נבחרה לפי ההעדפות וההיסטוריה שלכם';
  }

  function cancel() {
    if (!running) return;

    animation?.cancel();
    stopTimers();
    running = false;

    if (typeof onCancel === 'function') {
      onCancel();
    }
  }

  function createConfetti() {
    const shell = document.querySelector('.roulette-shell');
    if (!shell) return;

    shell.querySelector('.roulette-confetti')?.remove();

    const layer = document.createElement('div');
    layer.className = 'roulette-confetti';
    layer.setAttribute('aria-hidden', 'true');

    const symbols = ['✨', '❤️', '🎉', '🍽️', '💫'];

    for (let index = 0; index < 18; index += 1) {
      const piece = document.createElement('span');
      piece.textContent = symbols[index % symbols.length];
      piece.style.setProperty('--x', `${Math.random() * 100}%`);
      piece.style.setProperty('--delay', `${Math.random() * 160}ms`);
      piece.style.setProperty('--drift', `${-55 + Math.random() * 110}px`);
      piece.style.setProperty('--rotate', `${-90 + Math.random() * 180}deg`);
      layer.appendChild(piece);
    }

    shell.appendChild(layer);

    window.setTimeout(() => layer.remove(), 1250);
  }

  function renderSequence(sequence) {
    const reel = el('rouletteReel');
    reel.innerHTML = '';

    sequence.forEach((meal, index) => {
      const item = document.createElement('article');
      item.className = 'roulette-item';
      item.dataset.mealId = meal.id || '';
      item.innerHTML = `
        <div class="roulette-image-wrap">
          <span class="roulette-emoji">${escapeHtml(meal.emoji || '🍽️')}</span>
          ${meal.image ? `<img src="${escapeHtml(meal.image)}" alt="">` : ''}
        </div>
        <div class="roulette-copy">
          <strong>${escapeHtml(meal.name)}</strong>
          <small>${escapeHtml(meal.description || 'נשמע טעים')}</small>
        </div>
      `;

      const image = item.querySelector('img');

      if (image) {
        image.decoding = 'async';
        image.loading = index < 4 ? 'eager' : 'lazy';
        image.onload = () => item.classList.add('has-image');
        image.onerror = () => image.remove();
      }

      reel.appendChild(item);
    });
  }

  function buildSequence(meals, pickedMeal) {
    const pool = meals.filter(meal => meal.id !== pickedMeal.id);
    const sequence = [];

    for (let index = 0; index < 20; index += 1) {
      const source = pool.length
        ? pool[index % pool.length]
        : pickedMeal;

      sequence.push(source);
    }

    return [...shuffleArray(sequence), pickedMeal];
  }

  function stopTimers() {
    window.clearTimeout(completionTimer);
    window.clearInterval(statusTimer);
    completionTimer = null;
    statusTimer = null;
  }

  el('cancelRouletteBtn').addEventListener('click', cancel);

  return {
    start,
    cancel,
    isRunning: () => running
  };
}
