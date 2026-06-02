/** Shared formatting + small client-side helpers. */

export const DAILY_CAPACITY = 480;

/** Today's date as "YYYY-MM-DD" (matches the backend). */
export function currentDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Monday..Sunday range containing the given date (or today). */
export function weekRangeOf(dateStr) {
  const base = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const day = d.getDay() || 7; // 1 (Mon)..7 (Sun)
  const monday = new Date(d);
  monday.setDate(d.getDate() - day + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: currentDateString(monday), to: currentDateString(sunday) };
}

/** Shift a Mon–Sun week by N weeks; returns the Monday date string. */
export function shiftWeek(mondayStr, weeks) {
  const d = new Date(`${mondayStr}T00:00:00`);
  d.setDate(d.getDate() + weeks * 7);
  return currentDateString(d);
}

/** "2026-05-25".."2026-05-31" -> "25 – 31 May 2026". */
export function weekLabel(from, to) {
  if (!from || !to) return "";
  const a = new Date(`${from}T00:00:00`);
  const b = new Date(`${to}T00:00:00`);
  const day = (x) => x.getDate();
  const mon = (x) => x.toLocaleDateString(undefined, { month: "short" });
  const yr = (x) => x.getFullYear();
  if (a.getMonth() === b.getMonth()) {
    return `${day(a)} – ${day(b)} ${mon(b)} ${yr(b)}`;
  }
  return `${day(a)} ${mon(a)} – ${day(b)} ${mon(b)} ${yr(b)}`;
}

/** "2026-05-29" -> "Fri, 29 May 2026". */
export function humanDate(value) {
  if (!value) return "";
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Turn minutes into a friendly "2h 30m" string. */
export function minutesToHuman(mins) {
  if (mins == null) return "—";
  const sign = mins < 0 ? "-" : "";
  const abs = Math.abs(mins);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h && m) return `${sign}${h}h ${m}m`;
  if (h) return `${sign}${h}h`;
  return `${sign}${m}m`;
}

/** CSS modifier suffix for an availability status string. */
export function statusClass(status) {
  switch (status) {
    case "Available":
      return "available";
    case "Partially Occupied":
      return "partial";
    case "Occupied":
      return "occupied";
    default:
      return "";
  }
}

/** Task progress status options used in the UI. */
export const STATUS_OPTIONS = ["pending", "in-progress", "completed"];

/** "in-progress" -> "In Progress" for display. */
export function statusLabel(status) {
  return String(status || "")
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

/**
 * Group plans by project name, preserving first-seen order.
 * Returns [{ projectName, items: [...plans] }]. Tasks sharing the same project
 * name are clustered together (case-insensitive match).
 */
export function groupByProject(plans = []) {
  const map = new Map();
  for (const p of plans) {
    const name = (p.projectName || "—").trim();
    const key = name.toLowerCase();
    if (!map.has(key)) map.set(key, { projectName: name, items: [] });
    map.get(key).items.push(p);
  }
  return Array.from(map.values());
}
