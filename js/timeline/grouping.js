export function groupTimelineEntries(entries = []) {
  const groups = [];
  const map = new Map();

  entries.forEach(entry => {
    const key = `${entry.date.getFullYear()}-${entry.date.getMonth()}-${entry.date.getDate()}`;
    if (!map.has(key)) {
      const group = {
        key,
        label: entry.groupLabel,
        fullDateLabel: entry.fullDateLabel,
        entries: []
      };
      map.set(key, group);
      groups.push(group);
    }
    map.get(key).entries.push(entry);
  });

  return groups;
}
