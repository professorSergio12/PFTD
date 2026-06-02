const User = require("../models/user.model");
const Plan = require("../models/plan.model");
const Project = require("../models/project.model");
const asyncHandler = require("../utils/asyncHandler");
const { publicUser } = require("./auth.controller");
const { summarizePlans } = require("../utils/capacity");
const {
  currentDateString,
  weekRangeOf,
  workingDaysBetween,
} = require("../utils/week");
const { DAILY_CAPACITY, ROLES } = require("../config/constants");

/**
 * Resolve the date window for an admin request.
 * Accepts ?from=&to= (explicit), or ?week=YYYY-MM-DD (any day in the week),
 * and defaults to the current Mon–Sun week.
 */
function resolveRange(query) {
  if (query.from && query.to) {
    return { from: query.from, to: query.to };
  }
  return weekRangeOf(query.week);
}

/**
 * POST /api/admin/users
 * Admin creates a new user (employee or another admin) with id & password.
 */
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, department } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "name, email and password are required" });
  }

  const chosenRole = role === ROLES.ADMIN ? ROLES.ADMIN : ROLES.USER;

  const user = await User.create({
    name,
    email,
    password,
    role: chosenRole,
    department: (department || "").trim(),
  });

  res.status(201).json(publicUser(user));
});

/**
 * PATCH /api/admin/users/:id
 * Admin updates a user's details (e.g. their department or name).
 */
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const { name, department } = req.body;
  if (name !== undefined) user.name = name.trim();
  if (department !== undefined) user.department = department.trim();

  await user.save();
  res.json(publicUser(user));
});

/**
 * GET /api/admin/users
 * List all users with a quick availability status for each.
 */
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: ROLES.USER }).sort({ name: 1 });

  // Build a map of userId -> [{ _id, name }] for the projects they're on.
  const projects = await Project.find().select("name members");
  const projectsByUser = new Map();
  projects.forEach((p) => {
    p.members.forEach((memberId) => {
      const key = String(memberId);
      if (!projectsByUser.has(key)) projectsByUser.set(key, []);
      projectsByUser.get(key).push({ _id: p._id, name: p.name });
    });
  });

  const result = await Promise.all(
    users.map(async (u) => {
      const plans = await Plan.find({ userId: u._id, isArchived: false });
      const summary = summarizePlans(plans);
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        department: u.department || "",
        status: summary.status,
        projects: projectsByUser.get(String(u._id)) || [],
      };
    })
  );

  res.json(result);
});

/**
 * GET /api/admin/users/:id/plans
 * View a specific employee's plans for a week (or ?from=&to=) plus their
 * capacity summary. Defaults to the current week.
 */
const getUserPlans = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const { from, to } = resolveRange(req.query);

  const plans = await Plan.find({
    userId: user._id,
    isArchived: false,
    date: { $gte: from, $lte: to },
  }).sort({ date: 1, createdAt: 1 });

  res.json({
    user: publicUser(user),
    range: { from, to },
    plans,
    summary: summarizePlans(plans),
  });
});

/**
 * GET /api/admin/overview?week=YYYY-MM-DD  (or ?from=&to=)
 * One call powering the admin dashboard: every employee with availability,
 * their full "plan for the week/day" (both employee + admin times), and a
 * weekly capacity summary. Defaults to the current Mon–Sun week.
 */
const overview = asyncHandler(async (req, res) => {
  const { from, to } = resolveRange(req.query);
  const workingDays = workingDaysBetween(from, to) || 1;
  const weeklyCapacity = DAILY_CAPACITY * workingDays;

  const users = await User.find({ role: ROLES.USER }).sort({ name: 1 });

  const employees = await Promise.all(
    users.map(async (u) => {
      const plans = await Plan.find({
        userId: u._id,
        isArchived: false,
        date: { $gte: from, $lte: to },
      }).sort({ date: 1, createdAt: 1 });

      // Totals across the range, comparing both times.
      const userMinutes = plans.reduce(
        (s, p) => s + (p.userEstimatedTime || 0),
        0
      );
      const adminMinutes = plans.reduce(
        (s, p) =>
          s +
          (p.adminExpectedTime != null
            ? p.adminExpectedTime
            : p.userEstimatedTime || 0),
        0
      );

      const summary = summarizePlans(plans, weeklyCapacity);

      return {
        employeeId: u._id,
        name: u.name,
        email: u.email,
        plans,
        userMinutes,
        adminMinutes,
        assignedMinutes: summary.assignedMinutes,
        remainingMinutes: summary.remainingMinutes,
        utilization: summary.utilization,
        status: summary.status,
        freeAt: summary.freeAt,
      };
    })
  );

  res.json({
    range: { from, to },
    workingDays,
    dailyCapacity: DAILY_CAPACITY,
    weeklyCapacity,
    employees,
  });
});

/**
 * PATCH /api/admin/plans/:id
 * Admin sets the expected time and/or approves/rejects a plan.
 */
const updatePlanAsAdmin = asyncHandler(async (req, res) => {
  const plan = await Plan.findById(req.params.id);
  if (!plan) {
    return res.status(404).json({ message: "Plan not found" });
  }

  const { adminExpectedTime, status } = req.body;
  if (adminExpectedTime !== undefined) plan.adminExpectedTime = adminExpectedTime;
  if (status !== undefined) plan.status = status;

  await plan.save();
  res.json(plan);
});

/**
 * POST /api/admin/users/:id/plans
 * Admin assigns an additional task directly to an employee. The admin
 * expected time is set immediately.
 */
const assignTask = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const { projectName, milestoneName, taskDetails, adminExpectedTime, date, subtasks } =
    req.body;

  // Optional subtask breakdown; when present its sum drives the time.
  const cleanSubtasks = Array.isArray(subtasks)
    ? subtasks
        .filter((s) => s && String(s.title || "").trim())
        .map((s) => ({
          title: String(s.title).trim(),
          time: Math.max(0, Number(s.time) || 0),
        }))
    : [];
  const subtaskTotal = cleanSubtasks.reduce((sum, s) => sum + s.time, 0);
  const expected =
    cleanSubtasks.length > 0 ? subtaskTotal : Number(adminExpectedTime);

  if (!projectName || !taskDetails || Number.isNaN(expected)) {
    return res.status(400).json({
      message: "projectName, taskDetails and adminExpectedTime are required",
    });
  }

  const plan = await Plan.create({
    userId: user._id,
    projectName,
    milestoneName: milestoneName || "",
    taskDetails,
    subtasks: cleanSubtasks,
    userEstimatedTime: expected,
    adminExpectedTime: expected,
    assignedByAdmin: true,
    date: date || currentDateString(),
  });

  res.status(201).json(plan);
});

/**
 * GET /api/admin/resource-dashboard
 * Capacity board across all employees.
 */
const resourceDashboard = asyncHandler(async (req, res) => {
  const users = await User.find({ role: ROLES.USER }).sort({ name: 1 });

  const rows = await Promise.all(
    users.map(async (u) => {
      const plans = await Plan.find({ userId: u._id, isArchived: false });
      const summary = summarizePlans(plans);
      return {
        employeeId: u._id,
        employee: u.name,
        email: u.email,
        assignedMinutes: summary.assignedMinutes,
        remainingMinutes: summary.remainingMinutes,
        utilization: summary.utilization,
        status: summary.status,
        freeAt: summary.freeAt,
      };
    })
  );

  res.json(rows);
});

module.exports = {
  createUser,
  updateUser,
  getUsers,
  getUserPlans,
  updatePlanAsAdmin,
  assignTask,
  resourceDashboard,
  overview,
};