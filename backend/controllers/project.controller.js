const Project = require("../models/project.model");
const User = require("../models/user.model");
const asyncHandler = require("../utils/asyncHandler");
const { ROLES } = require("../config/constants");

// Shape a project for the client, with member name/email expanded.
function publicProject(project) {
  return {
    _id: project._id,
    name: project.name,
    description: project.description,
    members: (project.members || []).map((m) =>
      // populated -> object; otherwise just the id
      m && m._id
        ? { _id: m._id, name: m.name, email: m.email }
        : { _id: m }
    ),
    createdAt: project.createdAt,
  };
}

/**
 * POST /api/admin/projects
 * Create a new project.
 */
const createProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Project name is required" });
  }

  const exists = await Project.findOne({ name: name.trim() });
  if (exists) {
    return res.status(409).json({ message: "A project with that name already exists" });
  }

  const project = await Project.create({
    name: name.trim(),
    description: description || "",
  });

  res.status(201).json(publicProject(project));
});

/**
 * GET /api/admin/projects
 * List all projects with their assigned members.
 */
const getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find()
    .sort({ createdAt: -1 })
    .populate("members", "name email");

  res.json(projects.map(publicProject));
});

/**
 * PATCH /api/admin/projects/:id
 * Rename a project or update its description.
 */
const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  const { name, description } = req.body;

  if (name !== undefined) {
    if (!name.trim()) {
      return res.status(400).json({ message: "Project name cannot be empty" });
    }
    const clash = await Project.findOne({
      name: name.trim(),
      _id: { $ne: project._id },
    });
    if (clash) {
      return res
        .status(409)
        .json({ message: "A project with that name already exists" });
    }
    project.name = name.trim();
  }
  if (description !== undefined) project.description = description;

  await project.save();
  await project.populate("members", "name email");
  res.json(publicProject(project));
});

/**
 * DELETE /api/admin/projects/:id
 * Remove a project entirely.
 */
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findByIdAndDelete(req.params.id);
  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }
  res.json({ message: "Project deleted" });
});

/**
 * POST /api/admin/projects/:id/members
 * Assign an employee to the project. Body: { userId }.
 * Uses $addToSet so assigning twice is a no-op (a member can be in many
 * projects, but only once per project).
 */
const assignMember = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  const project = await Project.findById(req.params.id);
  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  const user = await User.findById(userId);
  if (!user || user.role !== ROLES.USER) {
    return res.status(404).json({ message: "Employee not found" });
  }

  await Project.updateOne(
    { _id: project._id },
    { $addToSet: { members: user._id } }
  );

  const updated = await Project.findById(project._id).populate(
    "members",
    "name email"
  );
  res.json(publicProject(updated));
});

/**
 * DELETE /api/admin/projects/:id/members/:userId
 * Remove an employee from the project. To move someone to another project,
 * the client removes them here and assigns them to the other project.
 */
const removeMember = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  await Project.updateOne(
    { _id: project._id },
    { $pull: { members: req.params.userId } }
  );

  const updated = await Project.findById(project._id).populate(
    "members",
    "name email"
  );
  res.json(publicProject(updated));
});

module.exports = {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
  assignMember,
  removeMember,
};
