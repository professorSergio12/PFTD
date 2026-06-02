require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/db");
const startWeeklyCleanup = require("./cron/cleanup");
const startOverdueWatcher = require("./cron/overdue");

const authRoutes = require("./routers/auth.routes");
const planRoutes = require("./routers/plan.routes");
const adminRoutes = require("./routers/admin.routes");
const projectRoutes = require("./routers/project.routes");
const notificationRoutes = require("./routers/notification.routes");
const { notFound, errorHandler } = require("./middleware/error.middleware");

const app = express();

// --- Middleware ---
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://pftd-1.onrender.com",
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// --- Health check ---
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/admin/projects", projectRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);

// --- Errors --
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect to DB, then start the server and the cron jobs.
connectDB();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startWeeklyCleanup();
  startOverdueWatcher();
});

module.exports = app;
