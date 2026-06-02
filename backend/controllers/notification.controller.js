const Notification = require("../models/notification.model");
const asyncHandler = require("../utils/asyncHandler");

/**
 * GET /api/notifications
 * Recent notifications for the logged-in user, plus the unread count.
 */
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(30);

  const unread = await Notification.countDocuments({
    userId: req.user._id,
    read: false,
  });

  res.json({ notifications, unread });
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read.
 */
const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { $set: { read: true } },
    { new: true }
  );
  if (!notification) {
    return res.status(404).json({ message: "Notification not found" });
  }
  res.json(notification);
});

/**
 * POST /api/notifications/read-all
 * Mark every notification for the user as read.
 */
const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user._id, read: false },
    { $set: { read: true } }
  );
  res.json({ message: "All marked read" });
});

module.exports = { getNotifications, markRead, markAllRead };
