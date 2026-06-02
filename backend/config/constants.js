/**
 * Central place for capacity / planning constants.
 * Values can be overridden through environment variables.
 */

/**
 * Working windows for a day ("HH:MM", 24h). The gap *between* windows is the
 * lunch break. These are used ONLY for reminder timing / "free after" — i.e.
 * to map a task's elapsed minutes to a real wall-clock time while skipping
 * lunch. They do NOT define how much work a plan can hold.
 *
 *   09:00–14:00  work        (5h = 300 min)
 *   14:00–15:00  lunch/break (skipped for reminder timing)
 *   15:00–18:30  work        (resumes here; 480 min total work lands at 18:00,
 *                             leaving 18:00–18:30 as buffer)
 */
const WORK_WINDOWS = [
  { start: "09:00", end: "14:00" },
  { start: "15:00", end: "18:30" },
];

// Total assignable WORK minutes per day used for plans / capacity /
// availability — an employee actually plans ~8h (480 min) of work, with lunch
// counted separately. Override with the DAILY_CAPACITY env var.
const DAILY_CAPACITY = Number(process.env.DAILY_CAPACITY) || 480;

// Minutes considered "a meaningful free slot" when deciding availability.
const AVAILABLE_THRESHOLD = 120;

// Workday start time (24h "HH:MM"). Derived from the first working window.
const WORKDAY_START = process.env.WORKDAY_START || WORK_WINDOWS[0].start;

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
  WORK_WINDOWS,
  DAILY_CAPACITY,
  AVAILABLE_THRESHOLD,
  WORKDAY_START,
  PLAN_STATUS,
  ROLES,
};