const Plan = require("../models/plan.model");
const asyncHandler = require("../utils/asyncHandler");
const { summarizePlans } = require("../utils/capacity");
const { currentDateString } = require("../utils/week");

/**
 * Shape a plan for the employee. The admin's "Expected Time"
 * (adminExpectedTime) IS shared with the employee so they can see how much
 * time the manager has allotted for the task; it stays read-only for them.
 */
function forUser(plan) {
  return plan.toObject ? plan.toObject() : plan;
}

/**
 * Clean a subtasks payload into [{ title, time }] objects, dropping any
 * without a title.
 */
function normalizeSubtasks(subtasks) {
  if (!Array.isArray(subtasks)) return [];
  return subtasks
    .filter((s) => s && String(s.title || "").trim())
    .map((s) => ({
      title: String(s.title).trim(),
      time: Math.max(0, Number(s.time) || 0),
    }));
}

/**
 * The effective time for a task: when it has subtasks, the total is the sum
 * of their times; otherwise it's the time the user entered.
 */
function effectiveTime(subtasks, fallback) {
  if (subtasks.length > 0) {
    return subtasks.reduce((sum, s) => sum + s.time, 0);
  }
  return Math.max(0, Number(fallback) || 0);
}

/**
 * Build a single task document (without userId/date) from a raw input object.
 */
function buildTask(raw) {
  const subtasks = normalizeSubtasks(raw.subtasks);
  return {
    projectName: String(raw.projectName || "").trim(),
    milestoneName: String(raw.milestoneName || "").trim(),
    taskDetails: String(raw.taskDetails || "").trim(),
    subtasks,
    userEstimatedTime: effectiveTime(subtasks, raw.userEstimatedTime),
    status: raw.status || undefined,
  };
}

/**
 * POST /api/plans
 * Create one task for the logged-in employee for a given day (defaults today).
 */
const createPlan = asyncHandler(async (req, res) => {
  const task = buildTask(req.body);
  const hasSubtasks = task.subtasks.length > 0;

  if (!task.projectName || !task.taskDetails) {
    return res.status(400).json({
      message: "projectName and taskDetails are required",
    });
  }
  if (!hasSubtasks && req.body.userEstimatedTime === undefined) {
    return res.status(400).json({
      message: "userEstimatedTime (or at least one subtask) is required",
    });
  }

  const plan = await Plan.create({
    userId: req.user._id,
    date: req.body.date || currentDateString(),
    ...task,
  });

  res.status(201).json(forUser(plan));
});

/**
 * POST /api/plans/batch
 * Create several Zoho Tasks under a shared project + day in one request.
 * Body: { date?, projectName, tasks: [{ milestoneName?, taskDetails,
 *         userEstimatedTime?, subtasks? }] }
 */
const createPlans = asyncHandler(async (req, res) => {
  const { date, projectName, tasks } = req.body;

  if (!projectName || !projectName.trim()) {
    return res.status(400).json({ message: "projectName is required" });
  }
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({ message: "At least one task is required" });
  }

  const day = date || currentDateString();
  const docs = tasks
    .map((t) => buildTask({ ...t, projectName }))
    .filter((t) => t.taskDetails); // skip empty rows

  if (docs.length === 0) {
    return res.status(400).json({ message: "No valid tasks to create" });
  }

  const created = await Plan.insertMany(
    docs.map((t) => ({ userId: req.user._id, date: day, ...t }))
  );

  res.status(201).json(created.map(forUser));
});

/**
 * GET /api/plans/my
 * List the logged-in employee's plans (defaults to today, or ?date=YYYY-MM-DD).
 * Capacity summary uses the user's own planned time.
 */
const getMyPlans = asyncHandler(async (req, res) => {
  const date = req.query.date || currentDateString();
  const filter = { userId: req.user._id, isArchived: false, date };

  const plans = await Plan.find(filter).sort({ createdAt: -1 });
  res.json({
    date,
    plans: plans.map(forUser),
    // For the user's own view, capacity is based on their planned time.
    summary: summarizePlans(plans, undefined, { useUserTime: true }),
  });
});

/**
 * PUT /api/plans/:id
 * Once a plan is submitted, an employee may only update its progress status —
 * editing the task details/time is admin-only. Any other fields in the body
 * are ignored here.
 */
const updatePlan = asyncHandler(async (req, res) => {
  const plan = await Plan.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });
  if (!plan) {
    return res.status(404).json({ message: "Plan not found" });
  }

  const { status } = req.body;
  if (status !== undefined) plan.status = status;

  await plan.save();
  res.json(forUser(plan));
});

/**
 * DELETE /api/plans/:id
 * Employees can no longer delete their own plans once submitted — only an
 * admin can (via the admin plan routes).
 */
const deletePlan = asyncHandler(async (req, res) => {
  res.status(403).json({ message: "Only an admin can delete a plan." });
});

module.exports = { createPlan, createPlans, getMyPlans, updatePlan, deletePlan };
