const mongoose = require("mongoose");
const { PLAN_STATUS } = require("../config/constants");

/**
 * A subtask is an optional breakdown of a Zoho Task. Each subtask has its own
 * time; when a task has subtasks, its total time is the sum of these.
 */
const subtaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Subtask title is required"],
      trim: true,
    },
    time: {
      type: Number,
      default: 0,
      min: [0, "Time cannot be negative"],
    },
  },
  { _id: true }
);

/**
 * A Plan is a single "Zoho Task" an employee plans for a given day.
 * Columns shown to everyone: project / milestone / Zoho task / time / status.
 * - userEstimatedTime: minutes the employee plans for the task ("Time").
 *   When subtasks exist, this equals the sum of the subtasks' times.
 * - adminExpectedTime: minutes the manager expects ("Expected Time").
 * - subtasks: optional breakdown, each with its own time.
 */
const planSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // The day this task is planned for, stored as "YYYY-MM-DD".
    date: {
      type: String,
      required: true,
      index: true,
    },
    projectName: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
    },
    milestoneName: {
      type: String,
      default: "",
      trim: true,
    },
    taskDetails: {
      type: String,
      required: [true, "Task details are required"],
      trim: true,
    },
    userEstimatedTime: {
      type: Number,
      required: [true, "Time (minutes) is required"],
      min: [0, "Time cannot be negative"],
    },
    // Admin-only field.
    adminExpectedTime: {
      type: Number,
      default: null,
      min: [0, "Time cannot be negative"],
    },
    // True when the task was assigned by an admin (employees cannot delete it).
    assignedByAdmin: {
      type: Boolean,
      default: false,
    },
    // Optional breakdown of the Zoho Task into smaller subtasks.
    subtasks: {
      type: [subtaskSchema],
      default: [],
    },
    status: {
      type: String,
      enum: Object.values(PLAN_STATUS),
      default: PLAN_STATUS.PENDING,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Set once the overdue cron has notified about this task, so the
    // employee + admins are reminded only once per task.
    overdueNotified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Plan", planSchema);
