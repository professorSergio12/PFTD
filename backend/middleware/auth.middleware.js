const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { ROLES } = require("../config/constants");

/**
 * Verify the JWT from either the Authorization header ("Bearer <token>")
 * or an httpOnly "token" cookie, and attach the user to req.user.
 */
async function protect(req, res, next) {
  try {
    let token;
    const header = req.headers.authorization;
    if (header && header.startsWith("Bearer ")) {
      token = header.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
}

/** Allow only admins past this point. Use after `protect`. */
function adminOnly(req, res, next) {
  if (req.user && req.user.role === ROLES.ADMIN) {
    return next();
  }
  return res.status(403).json({ message: "Admin access required" });
}

module.exports = { protect, adminOnly };