const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markRead,
  markAllRead,
} = require("../controllers/notification.controller");
const { protect } = require("../middleware/auth.middleware");

// All notification routes require a logged-in user (employee or admin).
router.use(protect);

router.get("/", getNotifications);
router.post("/read-all", markAllRead);
router.patch("/:id/read", markRead);

module.exports = router;
