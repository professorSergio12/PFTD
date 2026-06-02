import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { DEPARTMENTS } from "../../utils/departments";

/**
 * Admin creates a new user (employee or another admin) with their own
 * id (email) and password.
 */
export default function CreateUser() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    department: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const { data } = await api.post("/admin/users", form);
      setSuccess(`Created ${data.role}: ${data.name} (${data.email})`);
      setForm({
        name: "",
        email: "",
        password: "",
        role: "user",
        department: "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="form-center">
      <div className="form-card">
        <div className="form-card-head">
          <div className="form-card-icon" aria-hidden="true">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          <div>
            <h1>Create User</h1>
            <p className="muted small">
              Add a new employee or admin to the workspace.
            </p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && (
          <div className="alert alert-success">
            {success}{" "}
            <button
              className="link"
              onClick={() => navigate("/admin/employees")}
            >
              View employees
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label>
            Name
            <input
              value={form.name}
              onChange={update("name")}
              placeholder="Jane Doe"
              required
            />
          </label>
          <label>
            Email (login id)
            <input
              type="email"
              value={form.email}
              onChange={update("email")}
              placeholder="jane@company.com"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={update("password")}
              placeholder="At least 6 characters"
              minLength={6}
              required
            />
          </label>
          <label>
            Role
            <select value={form.role} onChange={update("role")}>
              <option value="user">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label>
            Department
            <select value={form.department} onChange={update("department")}>
              <option value="">— None —</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <button
            className="btn btn-primary btn-block"
            disabled={submitting}
          >
            {submitting ? "Creating..." : "Create user"}
          </button>
        </form>
      </div>
    </div>
  );
}