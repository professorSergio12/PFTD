const express = require("express");
const router = express.Router();
const {
  createPlan,
  createPlans,
  getMyPlans,
  updatePlan,
  deletePlan,
} = require("../controllers/plan.controller");
const { protect } = require("../middleware/auth.middleware");

// All plan routes require a logged-in user.
router.use(protect);

router.post("/", createPlan);
router.post("/batch", createPlans);
router.get("/my", getMyPlans);
router.put("/:id", updatePlan);
router.delete("/:id", deletePlan);

module.exports = router;