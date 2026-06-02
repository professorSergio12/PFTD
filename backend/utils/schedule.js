const { WORK_WINDOWS } = require("../config/constants");

/**
 * Working-hours helpers. The day is made of WORK_WINDOWS; the gaps between
 * them are breaks (lunch) that don't count toward elapsed work time. These
 * helpers translate "N working-minutes since the day started" into an actual
 * wall-clock time, correctly skipping over the break(s).
 */

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function windowLength(w) {
  return toMinutes(w.end) - toMinutes(w.start);
}

/**
 * Convert N working-minutes (from the start of the day) into a clock value in
 * minutes-since-midnight, skipping the breaks. If N runs past the last window,
 * the overflow is added after the final window's end.
 */
function clockMinutesForWorking(minutes) {
  let remaining = Math.max(0, minutes);
  for (const w of WORK_WINDOWS) {
    const len = windowLength(w);
    if (remaining <= len) {
      return toMinutes(w.start) + remaining;
    }
    remaining -= len;
  }
  const last = WORK_WINDOWS[WORK_WINDOWS.length - 1];
  return toMinutes(last.end) + remaining; // beyond working hours
}

/**
 * A Date (server local time) for `minutes` of working time into the given
 * "YYYY-MM-DD", accounting for breaks.
 */
function dueDateForWorkingMinutes(dateStr, minutes) {
  const clockMin = clockMinutesForWorking(minutes);
  const d = new Date(`${dateStr}T00:00:00`);
  d.setHours(0, clockMin, 0, 0);
  return d;
}

/**
 * "hh:mm AM/PM" label for the clock time after `minutes` of working time,
 * accounting for breaks.
 */
function freeAtLabel(minutes) {
  const clockMin = clockMinutesForWorking(minutes);
  let hours = Math.floor(clockMin / 60) % 24;
  const mm = String(clockMin % 60).padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, "0")}:${mm} ${period}`;
}

module.exports = {
  clockMinutesForWorking,
  dueDateForWorkingMinutes,
  freeAtLabel,
};
