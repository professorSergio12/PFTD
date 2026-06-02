const { DAILY_CAPACITY, AVAILABLE_THRESHOLD } = require("../config/constants");
const { freeAtLabel } = require("./schedule");

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
 * The time at which the employee becomes free: workday start + total assigned
 * working minutes, skipping the lunch break. Returns "hh:mm AM/PM".
 */
function freeAtFrom(assignedMinutes, capacity = DAILY_CAPACITY) {
  if (assignedMinutes >= capacity) return "Over capacity";
  return freeAtLabel(assignedMinutes);
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
