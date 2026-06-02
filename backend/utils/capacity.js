const {
  DAILY_CAPACITY,
  AVAILABLE_THRESHOLD,
  WORKDAY_START,
} = require("../config/constants");

/**
 * Pick the authoritative minutes for a plan.
 * - Admin view (default): admin's expected time wins once set, else the
 *   employee's planned time.
 * - User view (useUserTime): always the employee's own planned time, since
 *   users never see the admin expected time.
 */
function assignedMinutesFor(plan, useUserTime = false) {
  if (
    !useUserTime &&
    plan.adminExpectedTime !== null &&
    plan.adminExpectedTime !== undefined
  ) {
    return plan.adminExpectedTime;
  }
  return plan.userEstimatedTime || 0;
}

/**
 * Decide availability from remaining minutes.
 */
function statusFromRemaining(remaining) {
  if (remaining >= AVAILABLE_THRESHOLD) return "Available";
  if (remaining > 0) return "Partially Occupied";
  return "Occupied";
}

/**
 * Format the time at which the employee becomes free, starting from the
 * configured workday start + total assigned minutes. Returns "hh:mm AM/PM".
 */
function freeAtFrom(assignedMinutes, capacity = DAILY_CAPACITY) {
  if (assignedMinutes >= capacity) return "Over capacity";

  const [startH, startM] = WORKDAY_START.split(":").map(Number);
  const totalMinutes = startH * 60 + startM + assignedMinutes;

  let hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const period = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  if (hours === 0) hours = 12;

  const mm = String(minutes).padStart(2, "0");
  const hh = String(hours).padStart(2, "0");
  return `${hh}:${mm} ${period}`;
}

/**
 * Roll a list of plans up into a capacity summary.
 * @param {Array}  plans
 * @param {number} [capacity]
 * @param {object} [opts]   { useUserTime: boolean }
 */
function summarizePlans(plans, capacity = DAILY_CAPACITY, opts = {}) {
  const { useUserTime = false } = opts;
  const assignedMinutes = plans.reduce(
    (sum, p) => sum + assignedMinutesFor(p, useUserTime),
    0
  );
  const remainingMinutes = capacity - assignedMinutes;
  const utilization = Math.round((assignedMinutes / capacity) * 100);

  return {
    capacity,
    assignedMinutes,
    remainingMinutes,
    utilization,
    status: statusFromRemaining(remainingMinutes),
    freeAt: freeAtFrom(assignedMinutes, capacity),
  };
}

module.exports = {
  assignedMinutesFor,
  statusFromRemaining,
  freeAtFrom,
  summarizePlans,
};
