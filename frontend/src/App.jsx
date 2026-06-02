import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

// Auth
import Login from "./pages/Login";
import Register from "./pages/Register";

// Employee
import UserDashboard from "./pages/user/UserDashboard";
import CreatePlan from "./pages/user/CreatePlan";
import MyPlans from "./pages/user/MyPlans";
import Profile from "./pages/user/Profile";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import Employees from "./pages/admin/Employees";
import EmployeePlans from "./pages/admin/EmployeePlans";
import ResourceDashboard from "./pages/admin/ResourceDashboard";
import CreateUser from "./pages/admin/CreateUser";
import Projects from "./pages/admin/Projects";

import NotFound from "./pages/NotFound";

/** Sends a logged-in user to the right home, or to login. */
function HomeRedirect() {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return null; // wait for the session check before redirecting
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
}

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<HomeRedirect />} />

          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Employee */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/plans/new"
            element={
              <ProtectedRoute>
                <CreatePlan />
              </ProtectedRoute>
            }
          />
          <Route
            path="/plans"
            element={
              <ProtectedRoute>
                <MyPlans />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/employees"
            element={
              <ProtectedRoute adminOnly>
                <Employees />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/employees/:id"
            element={
              <ProtectedRoute adminOnly>
                <EmployeePlans />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/resource-dashboard"
            element={
              <ProtectedRoute adminOnly>
                <ResourceDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users/new"
            element={
              <ProtectedRoute adminOnly>
                <CreateUser />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/projects"
            element={
              <ProtectedRoute adminOnly>
                <Projects />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}