import { escapeHtml } from '../utils.js';

export function renderAchievements({
  achievements = [],
  container,
  summaryElement
}) {
  if (!container || !summaryElement) return;

  const unlockedCount = achievements.filter(item => item.unlocked).length;
  summaryElement.textContent =
    `${unlockedCount} מתוך ${achievements.length}`;

  container.innerHTML = achievements
    .map((achievement, index) =>
      renderAchievementCard(achievement, index)
    )
    .join('');

  requestAnimationFrame(() => {
    container
      .querySelectorAll('.achievement-progress-fill')
      .forEach(bar => bar.classList.add('is-visible'));
  });
}

function renderAchievementCard(achievement, index) {
  const statusText = achievement.unlocked
    ? '✓ הושלם'
    : `עוד ${achievement.remaining} לפתיחה`;

  return `
    <article
      class="achievement-card ${achievement.unlocked ? 'is-unlocked' : 'is-locked'}"
      style="--achievement-delay:${index * 70}ms"
      data-achievement-id="${escapeHtml(achievement.id)}"
    >
      <div class="achievement-card-top">
        <div class="achievement-icon" aria-hidden="true">
          ${escapeHtml(achievement.icon)}
        </div>

        <span class="achievement-state">
          ${achievement.unlocked ? 'נפתח' : 'נעול'}
        </span>
      </div>

      <div class="achievement-copy">
        <h4>${escapeHtml(achievement.title)}</h4>
        <p>${escapeHtml(achievement.description)}</p>
      </div>

      <div class="achievement-progress">
        <div class="achievement-progress-track">
          <div
            class="achievement-progress-fill"
            style="--progress:${achievement.percent}%"
          ></div>
        </div>

        <div class="achievement-progress-meta">
          <strong>
            ${achievement.cappedProgress} / ${achievement.goal}
          </strong>
          <span>${escapeHtml(statusText)}</span>
        </div>
      </div>
    </article>
  `;
}
