/**
 * Date helpers. Plans are planned per day; the "date" field is "YYYY-MM-DD".
 * Weeks run Monday..Sunday (ISO style) for the admin week filter.
 */

function pad(n) {
  return String(n).padStart(2, "0");
}

/** Format a Date (UTC parts) as "YYYY-MM-DD". */
function toDateStr(d) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(
    d.getUTCDate()
  )}`;
}

/** Returns today's date formatted as "YYYY-MM-DD". */
function currentDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  return `${y}-${m}-${d}`;
}

/**
 * Monday..Sunday range that contains the given date (or today).
 * @param {string} [dateStr] "YYYY-MM-DD"
 * @returns {{from: string, to: string}}
 */
function weekRangeOf(dateStr) {
  const base = dateStr ? new Date(`${dateStr}T00:00:00Z`) : new Date();
  const d = new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate())
  );
  const day = d.getUTCDay() || 7; // 1 (Mon) .. 7 (Sun)
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - day + 1);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return { from: toDateStr(monday), to: toDateStr(sunday) };
}

/** Count Mon–Fri days within an inclusive [from, to] range. */
function workingDaysBetween(from, to) {
  let count = 0;
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  for (
    let d = new Date(start);
    d <= end;
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) count++;
  }
  return count;
}

module.exports = {
  currentDateString,
  weekRangeOf,
  workingDaysBetween,
};
