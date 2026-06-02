const cron = require("node-cron");
const Plan = require("../models/plan.model");
const User = require("../models/user.model");
const Notification = require("../models/notification.model");
const { currentDateString } = require("../utils/week");
const { dueDateForWorkingMinutes } = require("../utils/schedule");
const { PLAN_STATUS, ROLES } = require("../config/constants");

/**
 * Scan today's tasks and notify when a task's scheduled window has passed.
 *
 * Tasks for a day run back-to-back across the working windows (the lunch break
 * is skipped). So the Nth task is "due" once the cumulative working time up to
 * and including it has elapsed on the clock — e.g. a task that ends at the
 * 300th working minute is due at 2:00 PM, and the next minute lands at 2:41 PM
 * (after lunch), not 2:01 PM.
 *
 * When `now` passes a task's due point and the task isn't completed, we notify
 * the employee (update status) and every admin (this person's task time is
 * over) — once per task (guarded by plan.overdueNotified).
 */
async function checkOverdueTasks() {
  const today = currentDateString();
  const now = new Date();

  // Today's live tasks, grouped per user in plan order.
  const plans = await Plan.find({ date: today, isArchived: false }).sort({
    userId: 1,
    createdAt: 1,
  });
  if (plans.length === 0) return;

  // Cumulative working minutes per user as we walk their tasks in order.
  const cumulativeByUser = new Map();
  const dueNow = [];

  for (const plan of plans) {
    const key = String(plan.userId);
    const soFar = cumulativeByUser.get(key) || 0;
    const end = soFar + (plan.userEstimatedTime || 0);
    cumulativeByUser.set(key, end);

    // Wall-clock due time for this much working time, skipping breaks.
    const dueTime = dueDateForWorkingMinutes(today, end);
    if (
      !plan.overdueNotified &&
      plan.status !== PLAN_STATUS.COMPLETED &&
      now >= dueTime
    ) {
      dueNow.push(plan);
    }
  }

  if (dueNow.length === 0) return;

  // Recipients: the owners + all admins.
  const admins = await User.find({ role: ROLES.ADMIN }).select("_id");
  const ownerIds = [...new Set(dueNow.map((p) => String(p.userId)))];
  const owners = await User.find({ _id: { $in: ownerIds } }).select("name");
  const ownerName = new Map(owners.map((u) => [String(u._id), u.name]));

  const docs = [];
  for (const plan of dueNow) {
    const label = `"${plan.taskDetails}"${
      plan.projectName ? ` (${plan.projectName})` : ""
    }`;

    // To the employee.
    docs.push({
      userId: plan.userId,
      type: "task-overdue",
      planId: plan._id,
      message: `Time's up for ${label}. Please update its status.`,
    });

    // To every admin.
    const who = ownerName.get(String(plan.userId)) || "An employee";
    admins.forEach((a) => {
      docs.push({
        userId: a._id,
        type: "task-overdue-admin",
        planId: plan._id,
        message: `${who}'s task ${label} has run over its planned time.`,
      });
    });
  }

  await Notification.insertMany(docs);
  await Plan.updateMany(
    { _id: { $in: dueNow.map((p) => p._id) } },
    { $set: { overdueNotified: true } }
  );

  console.log(
    `[cron] Overdue check: notified ${dueNow.length} task(s), ${docs.length} notification(s)`
  );
}

/** Run the overdue check every minute. */
function startOverdueWatcher() {
  cron.schedule("* * * * *", () => {
    checkOverdueTasks().catch((err) =>
      console.error("[cron] Overdue check failed:", err.message)
    );
  });
  console.log("[cron] Overdue task watcher scheduled (every minute)");
}

module.exports = startOverdueWatcher;
