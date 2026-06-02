const express = require("express");
const router = express.Router();
const {
  createUser,
  updateUser,
  getUsers,
  getUserPlans,
  updatePlanAsAdmin,
  assignTask,
  resourceDashboard,
  overview,
} = require("../controllers/admin.controller");
const { protect, adminOnly } = require("../middleware/auth.middleware");

// Every admin route requires a logged-in admin.
router.use(protect, adminOnly);

router.post("/users", createUser);
router.get("/users", getUsers);
router.patch("/users/:id", updateUser);
router.get("/users/:id/plans", getUserPlans);
router.post("/users/:id/plans", assignTask);
router.patch("/plans/:id", updatePlanAsAdmin);
router.get("/resource-dashboard", resourceDashboard);
router.get("/overview", overview);

module.exports = router;