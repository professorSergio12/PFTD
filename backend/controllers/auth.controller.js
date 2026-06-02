const User = require("../models/user.model");
const asyncHandler = require("../utils/asyncHandler");
const { generateToken, cookieOptions } = require("../utils/generateToken");
const { ROLES } = require("../config/constants");

function publicUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department || "",
  };
}

/**
 * POST /api/auth/register
 * Public self-registration. Always creates a normal "user" (admins are
 * created by other admins through the admin endpoint).
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "name, email and password are required" });
  }

  const user = await User.create({
    name,
    email,
    password,
    role: ROLES.USER,
  });

  const token = generateToken(user._id);
  res.cookie("token", token, cookieOptions());
  res.status(201).json({ token, user: publicUser(user) });
});

/**
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  // password has select:false, so explicitly request it
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password"
  );

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = generateToken(user._id);
  res.cookie("token", token, cookieOptions());
  res.json({ token, user: publicUser(user) });
});

/**
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

/**
 * GET /api/auth/me
 * Returns the currently authenticated user.
 */
const me = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

module.exports = { register, login, logout, me, publicUser };