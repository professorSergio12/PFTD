import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import Loader from "../../components/Loader";
import StatusBadge from "../../components/StatusBadge";
import { DEPARTMENTS } from "../../utils/departments";

export default function Employees() {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [savingDept, setSavingDept] = useState(null); // userId being saved

  useEffect(() => {
    api
      .get("/admin/users")
      .then((res) => setUsers(res.data))
      .catch((err) => setError(err.message));
  }, []);

  // Department options = the predefined list plus any already in use.
  const departments = useMemo(() => {
    const set = new Set(DEPARTMENTS);
    (users || []).forEach((u) => u.department && set.add(u.department));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [users]);

  async function changeDepartment(userId, department) {
    setSavingDept(userId);
    setError("");
    try {
      const { data } = await api.patch(`/admin/users/${userId}`, {
        department,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, department: data.department } : u
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingDept(null);
    }
  }

  if (error && !users) return <div className="alert alert-error">{error}</div>;
  if (!users) return <Loader />;

  function matchesFilter(u) {
    if (filter === "All") return true;
    if (filter === "Unassigned") return !u.department;
    return u.department === filter;
  }
  const visible = users.filter(matchesFilter);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Employees</h1>
          <p className="muted">
            {visible.length} of {users.length}{" "}
            {filter === "All" ? "employees" : `in ${filter}`}
          </p>
        </div>
        <Link to="/admin/users/new" className="btn btn-primary">
          + Create User
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Department filter */}
      <div className="filter-bar">
        <span className="filter-label">Department</span>
        <div className="filter-chips">
          <button
            className={`filter-chip${filter === "All" ? " active" : ""}`}
            onClick={() => setFilter("All")}
          >
            All
          </button>
          {departments.map((d) => (
            <button
              key={d}
              className={`filter-chip${filter === d ? " active" : ""}`}
              onClick={() => setFilter(d)}
            >
              {d}
            </button>
          ))}
          <button
            className={`filter-chip${filter === "Unassigned" ? " active" : ""}`}
            onClick={() => setFilter("Unassigned")}
          >
            Unassigned
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="muted">No employees in this department.</p>
      ) : (
        <table className="table card">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Projects</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td className="muted">{u.email}</td>
                <td>
                  <select
                    className="dept-select"
                    value={u.department || ""}
                    disabled={savingDept === u._id}
                    onChange={(e) => changeDepartment(u._id, e.target.value)}
                  >
                    <option value="">— None —</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  {u.projects && u.projects.length > 0 ? (
                    <div className="project-tags">
                      {u.projects.map((p) => (
                        <span className="project-tag" key={p._id}>
                          {p.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="muted small">—</span>
                  )}
                </td>
                <td>
                  <StatusBadge status={u.status} />
                </td>
                <td>
                  <Link to={`/admin/employees/${u._id}`} className="link">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
