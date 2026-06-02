const cron = require("node-cron");
const Plan = require("../models/plan.model");

/**
 * Weekly cleanup. Runs every Sunday at midnight.
 * We archive instead of delete so historical data is preserved.
 */
function startWeeklyCleanup() {
  cron.schedule("0 0 * * 0", async () => {
    try {
      const result = await Plan.updateMany(
        { isArchived: false },
        { $set: { isArchived: true } }
      );
      console.log(
        `[cron] Weekly cleanup archived ${result.modifiedCount} plans`
      );
    } catch (err) {
      console.error("[cron] Weekly cleanup failed:", err.message);
    }
  });

  console.log("[cron] Weekly cleanup scheduled (Sundays 00:00)");
}

module.exports = startWeeklyCleanup;