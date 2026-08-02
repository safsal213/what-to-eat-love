export function parseTimelineDate(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;

  const match = String(value).trim().match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (!match) return null;

  const [, day, month, year, hour = '0', minute = '0', second = '0'] = match;
  const parsed = new Date(+year, +month - 1, +day, +hour, +minute, +second);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatTimelineLabel(date, now = new Date()) {
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((today - target) / 86400000);

  if (days === 0) return 'היום';
  if (days === 1) return 'אתמול';
  if (days > 1 && days < 7) {
    return new Intl.DateTimeFormat('he-IL', { weekday: 'long' }).format(date);
  }
  return new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long' }).format(date);
}

export function formatTimelineTime(date) {
  return new Intl.DateTimeFormat('he-IL', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function formatTimelineFullDate(date) {
  return new Intl.DateTimeFormat('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}
