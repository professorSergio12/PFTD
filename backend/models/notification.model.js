const mongoose = require("mongoose");

/**
 * An in-app notification delivered to one recipient (employee or admin).
 * Created by the overdue cron when a task's scheduled time has passed.
 */
const notificationSchema = new mongoose.Schema(
  {
    // Recipient of the notification.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      default: "task-overdue",
    },
    message: {
      type: String,
      required: true,
    },
    // The plan this notification refers to (optional).
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
