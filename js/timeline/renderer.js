import { escapeHtml } from '../utils.js';
import { groupTimelineEntries } from './grouping.js';

export function renderTimeline({
  entries = [],
  container,
  emptyState,
  countElement,
  onOpen
}) {
  if (!container || !emptyState || !countElement) return;

  container.innerHTML = '';
  countElement.textContent = entries.length === 1 ? 'ארוחה אחת' : `${entries.length} ארוחות`;

  if (!entries.length) {
    container.classList.add('hidden');
    emptyState.classList.remove('hidden');
    return;
  }

  container.classList.remove('hidden');
  emptyState.classList.add('hidden');

  groupTimelineEntries(entries).forEach((group, groupIndex) => {
    const section = document.createElement('section');
    section.className = 'timeline-day';
    section.style.setProperty('--timeline-group-delay', `${groupIndex * 70}ms`);
    section.innerHTML = `
      <div class="timeline-day-marker" aria-hidden="true"><span></span></div>
      <div class="timeline-day-content">
        <div class="timeline-day-heading">
          <strong>${escapeHtml(group.label)}</strong>
          <small>${escapeHtml(group.fullDateLabel)}</small>
        </div>
        <div class="timeline-day-cards"></div>
      </div>
    `;

    const cards = section.querySelector('.timeline-day-cards');

    group.entries.forEach((entry, index) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'timeline-card';
      card.style.setProperty('--timeline-card-delay', `${index * 55}ms`);
      card.innerHTML = `
        <div class="timeline-card-image">
          <span class="timeline-card-emoji">${escapeHtml(entry.emoji)}</span>
          ${entry.image ? `<img src="${escapeHtml(entry.image)}" alt="">` : ''}
        </div>
        <div class="timeline-card-copy">
          <div class="timeline-card-title-row">
            <h3>${escapeHtml(entry.name)}</h3>
            <time datetime="${entry.date.toISOString()}">${escapeHtml(entry.timeLabel)}</time>
          </div>
          <p>${escapeHtml(entry.description || 'בחירה טעימה שנשמרה בציר הזמן')}</p>
          <div class="timeline-card-meta">
            <span>👤 ${escapeHtml(entry.selectedBy)}</span>
            ${entry.favorite ? '<span>❤️ מועדפת</span>' : ''}
            ${entry.status ? `<span>🏷️ ${escapeHtml(entry.status)}</span>` : ''}
          </div>
        </div>
        <span class="timeline-card-arrow" aria-hidden="true">←</span>
      `;

      const image = card.querySelector('img');
      if (image) {
        image.loading = 'lazy';
        image.decoding = 'async';
        image.onload = () => card.classList.add('has-image');
        image.onerror = () => image.remove();
      }

      card.addEventListener('click', () => onOpen?.(entry));
      cards.appendChild(card);
    });

    container.appendChild(section);
  });
}
