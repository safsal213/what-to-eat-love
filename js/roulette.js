import { el, showView } from './ui.js';
import { escapeHtml, shuffleArray } from './utils.js';

const ITEM_HEIGHT = 116;
const SPIN_DURATION = 2450;
const SETTLE_DELAY = 620;

export function createRouletteController({
  onComplete,
  onCancel,
  onPreload,
  onFeedback
}) {
  let animation = null;
  let completionTimer = null;
  let running = false;

  function start({ meals = [], pickedMeal }) {
    if (!pickedMeal || !meals.length || running) return;

    stopTimers();
    running = true;

    const sequence = buildSequence(meals, pickedMeal);
    renderSequence(sequence);

    if (typeof onPreload === 'function') {
      onPreload(sequence.map(meal => meal.image).filter(Boolean));
    }

    el('rouletteStatus').textContent = 'מערבב את המנות';
    el('cancelRouletteBtn').disabled = false;
    showView('rouletteView');

    const reel = el('rouletteReel');
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    requestAnimationFrame(() => {
      if (reducedMotion) {
        reel.style.transform =
          `translateY(-${(sequence.length - 1) * ITEM_HEIGHT}px)`;

        finish(pickedMeal);
        return;
      }

      animation = reel.animate(
        [
          {
            transform: 'translateY(0)',
            filter: 'blur(0)'
          },
          {
            transform:
              `translateY(-${(sequence.length - 1) * ITEM_HEIGHT}px)`,
            filter: 'blur(.7px)'
          }
        ],
        {
          duration: SPIN_DURATION,
          easing: 'cubic-bezier(.08,.72,.15,1)',
          fill: 'forwards'
        }
      );

      animation.onfinish = () => finish(pickedMeal);
      animation.oncancel = () => {};
    });
  }

  function finish(pickedMeal) {
    el('rouletteStatus').textContent = 'מצאתי!';
    el('cancelRouletteBtn').disabled = true;

    const finalItem = el('rouletteReel').lastElementChild;
    finalItem?.classList.add('is-winner');

    if (typeof onFeedback === 'function') {
      onFeedback();
    }

    completionTimer = window.setTimeout(() => {
      running = false;

      if (typeof onComplete === 'function') {
        onComplete(pickedMeal);
      }
    }, SETTLE_DELAY);
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

    for (let index = 0; index < 18; index += 1) {
      const source = pool.length
        ? pool[index % pool.length]
        : pickedMeal;

      sequence.push(source);
    }

    return [...shuffleArray(sequence), pickedMeal];
  }

  function stopTimers() {
    window.clearTimeout(completionTimer);
    completionTimer = null;
  }

  el('cancelRouletteBtn').addEventListener('click', cancel);

  return {
    start,
    cancel,
    isRunning: () => running
  };
}
