/**
 * Central place for capacity / planning constants.
 * Values can be overridden through environment variables.
 */

// Total assignable minutes per planning window.
// 480 = one 8-hour working day. Use 2400 for a 5-day week.
const DAILY_CAPACITY = Number(process.env.DAILY_CAPACITY) || 480;

// Minutes considered "a meaningful free slot" when deciding availability.
const AVAILABLE_THRESHOLD = 120;

// Workday start time (24h "HH:MM") used for the "free after" calculation.
const WORKDAY_START = process.env.WORKDAY_START || "09:00";

const PLAN_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
};

const ROLES = {
  USER: "user",
  ADMIN: "admin",
};

module.exports = {
  DAILY_CAPACITY,
  AVAILABLE_THRESHOLD,
  WORKDAY_START,
  PLAN_STATUS,
  ROLES,
};