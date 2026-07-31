import { el } from './ui.js';
import { escapeHtml } from './utils.js';

export function createSwipeController({
  getMeals,
  getIndex,
  setIndex,
  getBusy,
  setBusy,
  onChoose
}) {
  function render() {
    const deck = el('swipeDeck');
    deck.innerHTML = '';

    const meals = getMeals();
    const index = getIndex();
    const remaining = meals.slice(index, index + 3);
    const total = meals.length;
    const current = Math.min(index + 1, total);

    el('swipeCounter').textContent = total
      ? `${current} מתוך ${total}`
      : '0 מתוך 0';

    if (!remaining.length) {
      const finished = document.createElement('div');
      finished.className = 'swipe-finished';
      finished.innerHTML = `
        <div>
          <div class="status-emoji">😅</div>
          <h2>עברנו על כל המנות</h2>
          <p>אפשר לערבב מחדש ולנסות שוב.</p>
        </div>
      `;

      deck.appendChild(finished);
      el('swipeActions').classList.add('hidden');
      return;
    }

    remaining
      .slice()
      .reverse()
      .forEach((meal, reverseIndex) => {
        const actualIndex =
          index + (remaining.length - 1 - reverseIndex);

        deck.appendChild(
          createCard(meal, actualIndex === index)
        );
      });

    el('swipeActions').classList.remove('hidden');
  }

  function createCard(meal, isTopCard) {
    const card = document.createElement('article');
    card.className = 'swipe-card';
    card.dataset.mealId = meal.id;

    const metaItems = [];

    if (meal.preparationTime) {
      metaItems.push(`⏱️ ${meal.preparationTime} דקות`);
    }

    if (meal.pregnancySafe) {
      metaItems.push('🤰 מתאים בהיריון');
    }

    if (meal.calories) {
      metaItems.push(`🔥 ${meal.calories} קלוריות`);
    }

    card.innerHTML = `
      <div class="swipe-card-image">
        <span class="swipe-card-emoji">${escapeHtml(meal.emoji || '🍽️')}</span>
        ${meal.image ? `<img src="${escapeHtml(meal.image)}" alt="">` : ''}
        <span class="swipe-card-stamp like">בא לי!</span>
        <span class="swipe-card-stamp nope">לא היום</span>
      </div>

      <div class="swipe-card-body">
        <div class="swipe-card-title-row">
          <h3>${escapeHtml(meal.name)}</h3>
          <span class="swipe-favorite">${meal.favorite ? '❤️' : '🤍'}</span>
        </div>

        <p class="swipe-card-description">
          ${escapeHtml(meal.description || 'נשמע טעים 😋')}
        </p>

        <div class="swipe-card-meta">
          ${metaItems
            .map(item => `<span class="meta-pill">${escapeHtml(item)}</span>`)
            .join('')}
        </div>
      </div>
    `;

    const image = card.querySelector('img');

    if (image) {
      image.onerror = () => image.remove();
    }

    if (isTopCard) {
      enableDrag(card, meal);
    }

    return card;
  }

  function enableDrag(card, meal) {
    let startX = 0;
    let currentX = 0;
    let dragging = false;

    const likeStamp = card.querySelector('.like');
    const nopeStamp = card.querySelector('.nope');

    const pointerDown = event => {
      if (getBusy()) return;

      dragging = true;
      startX = event.clientX;
      currentX = 0;
      card.classList.add('is-dragging');
      card.setPointerCapture?.(event.pointerId);
    };

    const pointerMove = event => {
      if (!dragging) return;

      currentX = event.clientX - startX;
      const rotation = Math.max(-13, Math.min(13, currentX / 18));

      card.style.transform =
        `translateX(${currentX}px) rotate(${rotation}deg)`;

      const strength = Math.min(1, Math.abs(currentX) / 120);

      likeStamp.style.opacity = currentX > 0 ? strength : 0;
      nopeStamp.style.opacity = currentX < 0 ? strength : 0;
    };

    const pointerUp = () => {
      if (!dragging) return;

      dragging = false;
      card.classList.remove('is-dragging');

      if (Math.abs(currentX) >= 95) {
        swipe(currentX > 0 ? 'right' : 'left', meal, card);
        return;
      }

      card.style.transform = '';
      likeStamp.style.opacity = 0;
      nopeStamp.style.opacity = 0;
    };

    card.addEventListener('pointerdown', pointerDown);
    card.addEventListener('pointermove', pointerMove);
    card.addEventListener('pointerup', pointerUp);
    card.addEventListener('pointercancel', pointerUp);
  }

  function swipe(direction, meal, card = null) {
    if (getBusy() || !meal) return;

    setBusy(true);

    const activeCard =
      card || el('swipeDeck').querySelector('.swipe-card:last-child');

    if (!activeCard) {
      setBusy(false);
      return;
    }

    activeCard.classList.add(
      direction === 'right'
        ? 'is-exiting-right'
        : 'is-exiting-left'
    );

    window.setTimeout(() => {
      if (direction === 'right') {
        onChoose(meal);
        setBusy(false);
        return;
      }

      setIndex(getIndex() + 1);
      setBusy(false);
      render();
    }, 260);
  }

  return { render, swipe };
}
