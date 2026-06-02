const express = require("express");
const router = express.Router();
const {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
  assignMember,
  removeMember,
} = require("../controllers/project.controller");
const { protect, adminOnly } = require("../middleware/auth.middleware");

// Every project route requires a logged-in admin.
router.use(protect, adminOnly);

router.post("/", createProject);
router.get("/", getProjects);
router.patch("/:id", updateProject);
router.delete("/:id", deleteProject);

// Membership (assign / remove employees)
router.post("/:id/members", assignMember);
router.delete("/:id/members/:userId", removeMember);

module.exports = router;
