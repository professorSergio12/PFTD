const mongoose = require("mongoose");

/**
 * A Project that the admin manages. Employees are assigned to projects
 * through the `members` array, so:
 *  - one project can have many employees, and
 *  - one employee can belong to many projects (many-to-many).
 *
 * Assigning  = add a userId to members.
 * Removing   = pull a userId from members.
 * Moving     = remove from one project, assign to another.
 */
const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
