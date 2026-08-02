const DEFAULT_DURATION = 2600;

let activeToast = null;
let hideTimer = null;

export function showToast({
  type = 'info',
  icon = '',
  title = '',
  message = '',
  duration = DEFAULT_DURATION
} = {}) {
  const host = document.getElementById('toastHost');
  if (!host) return;

  window.clearTimeout(hideTimer);
  activeToast?.remove();

  const toast = document.createElement('section');
  toast.className = `app-toast app-toast-${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

  toast.innerHTML = `
    <div class="app-toast-icon" aria-hidden="true">
      ${escapeHtml(icon || getDefaultIcon(type))}
    </div>
    <div class="app-toast-copy">
      ${title ? `<strong>${escapeHtml(title)}</strong>` : ''}
      ${message ? `<span>${escapeHtml(message)}</span>` : ''}
    </div>
    <button class="app-toast-close" type="button" aria-label="סגירת ההודעה">×</button>
  `;

  toast.querySelector('.app-toast-close')
    ?.addEventListener('click', () => dismissToast(toast));

  host.appendChild(toast);
  activeToast = toast;

  requestAnimationFrame(() => toast.classList.add('is-visible'));

  hideTimer = window.setTimeout(
    () => dismissToast(toast),
    Math.max(1200, duration)
  );
}

function dismissToast(toast) {
  if (!toast?.isConnected) return;

  toast.classList.remove('is-visible');
  toast.classList.add('is-leaving');

  window.setTimeout(() => {
    toast.remove();
    if (activeToast === toast) activeToast = null;
  }, 220);
}

function getDefaultIcon(type) {
  return {
    success: '✅',
    favorite: '❤️',
    achievement: '🏆',
    prediction: '🔮',
    error: '⚠️',
    info: 'ℹ️'
  }[type] || 'ℹ️';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
