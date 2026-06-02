/**
 * Seed an initial admin account so you can log in and start creating users.
 * Run with:  npm run seed
 *
 * Default credentials (override with env vars):
 *   ADMIN_EMAIL    (default admin@pftd.com)
 *   ADMIN_PASSWORD (default admin123)
 *   ADMIN_NAME     (default Admin)
 */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/user.model");
const { ROLES } = require("./config/constants");

async function seed() {
  await connectDB();

  const email = (process.env.ADMIN_EMAIL || "admin@pftd.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const name = process.env.ADMIN_NAME || "Admin";

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
  } else {
    await User.create({ name, email, password, role: ROLES.ADMIN });
    console.log(`Created admin: ${email} / ${password}`);
  }

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});