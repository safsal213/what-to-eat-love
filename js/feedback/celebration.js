let closeTimer = null;

export function showCelebration({
  icon = '🏆',
  title = 'כל הכבוד!',
  message = 'פתחתם הישג חדש.',
  duration = 3800
} = {}) {
  const host = document.getElementById('celebrationHost');
  if (!host) return;

  window.clearTimeout(closeTimer);

  document.getElementById('celebrationIcon').textContent = icon;
  document.getElementById('celebrationTitle').textContent = title;
  document.getElementById('celebrationMessage').textContent = message;

  renderParticles();

  host.classList.remove('hidden');
  host.setAttribute('aria-hidden', 'false');

  requestAnimationFrame(() => host.classList.add('is-visible'));

  closeTimer = window.setTimeout(
    closeCelebration,
    Math.max(2000, duration)
  );
}

export function closeCelebration() {
  const host = document.getElementById('celebrationHost');
  if (!host || host.classList.contains('hidden')) return;

  host.classList.remove('is-visible');
  host.setAttribute('aria-hidden', 'true');

  window.setTimeout(() => host.classList.add('hidden'), 280);
}

function renderParticles() {
  const layer = document.getElementById('celebrationParticles');
  if (!layer) return;

  layer.innerHTML = '';

  const symbols = ['✨', '💫', '❤️', '⭐'];
  const count = 16;

  for (let index = 0; index < count; index += 1) {
    const particle = document.createElement('span');
    particle.textContent = symbols[index % symbols.length];
    particle.style.setProperty('--particle-x', `${Math.random() * 100}%`);
    particle.style.setProperty('--particle-delay', `${Math.random() * 180}ms`);
    particle.style.setProperty('--particle-drift', `${-70 + Math.random() * 140}px`);
    particle.style.setProperty('--particle-rotate', `${-120 + Math.random() * 240}deg`);
    layer.appendChild(particle);
  }
}

document.addEventListener('click', event => {
  if (
    event.target?.id === 'celebrationCloseBtn' ||
    event.target?.classList?.contains('celebration-backdrop')
  ) {
    closeCelebration();
  }
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeCelebration();
});
