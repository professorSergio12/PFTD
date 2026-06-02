import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const { user, isAdmin, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  if (!isAuthenticated) return null;

  const userLinks = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/plans/new", label: "Create Plan" },
    { to: "/plans", label: "My Plans" },
    { to: "/profile", label: "Profile" },
  ];

  const adminLinks = [
    { to: "/admin", label: "Dashboard" },
    { to: "/admin/employees", label: "Employees" },
    { to: "/admin/projects", label: "Projects" },
    { to: "/admin/resource-dashboard", label: "Resource Board" },
    { to: "/admin/users/new", label: "Create User" },
  ];

  const links = isAdmin ? adminLinks : userLinks;

  return (
    <nav className="navbar">
      <Link to={isAdmin ? "/admin" : "/dashboard"} className="navbar-brand">
        <span className="brand-mark">P</span>
        PFTD
      </Link>

      <div className="navbar-links">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            {l.label}
          </NavLink>
        ))}
      </div>

      <div className="navbar-user">
        <NotificationBell />
        <span className="navbar-username">
          {user?.name}
          <small>{isAdmin ? "Admin" : "Employee"}</small>
        </span>
        <span className="navbar-avatar">
          {user?.name?.charAt(0).toUpperCase()}
        </span>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}