const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDateString(s) {
  return typeof s === 'string' && DATE_RE.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
}

export function localDateString(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// "?today=YYYY-MM-DD" is a testing aid for previewing review scheduling.
export function today(search = '') {
  const o = new URLSearchParams(search).get('today');
  return isDateString(o) ? o : localDateString();
}
