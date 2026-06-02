import { useCallback, useEffect, useState } from "react";
import api from "../../api/axios";
import Loader from "../../components/Loader";

/**
 * Admin Projects module.
 * - Create projects.
 * - Assign employees to a project (an employee can belong to many projects).
 * - Remove an employee from a project (to move someone, remove them here and
 *   assign them to another project).
 */
export default function Projects() {
  const [projects, setProjects] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState("");

  // New-project form
  const [form, setForm] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);

  // Per-project "assign" dropdown selection + busy state
  const [assignSel, setAssignSel] = useState({}); // projectId -> userId
  const [busy, setBusy] = useState(null); // `${projectId}:${userId}` or projectId

  const load = useCallback(async () => {
    try {
      const [projRes, empRes] = await Promise.all([
        api.get("/admin/projects"),
        api.get("/admin/users"),
      ]);
      setProjects(projRes.data);
      setEmployees(empRes.data);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    setError("");
    try {
      await api.post("/admin/projects", form);
      setForm({ name: "", description: "" });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteProject(project) {
    if (!window.confirm(`Delete project "${project.name}"?`)) return;
    setBusy(project._id);
    try {
      await api.delete(`/admin/projects/${project._id}`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function handleAssign(projectId) {
    const userId = assignSel[projectId];
    if (!userId) return;
    setBusy(`${projectId}:assign`);
    try {
      const { data } = await api.post(`/admin/projects/${projectId}/members`, {
        userId,
      });
      setProjects((ps) => ps.map((p) => (p._id === projectId ? data : p)));
      setAssignSel((s) => ({ ...s, [projectId]: "" }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function handleRemove(projectId, userId) {
    setBusy(`${projectId}:${userId}`);
    try {
      const { data } = await api.delete(
        `/admin/projects/${projectId}/members/${userId}`
      );
      setProjects((ps) => ps.map((p) => (p._id === projectId ? data : p)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  if (!projects) return <Loader label="Loading projects..." />;

  const totalMembers = projects.reduce(
    (sum, p) => sum + p.members.length,
    0
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <p className="muted">
            Create projects and assign employees. An employee can be on more
            than one project.
          </p>
        </div>
        <div className="project-stats">
          <div className="project-stat">
            <span className="project-stat-value">{projects.length}</span>
            <span className="project-stat-label">Projects</span>
          </div>
          <div className="project-stat">
            <span className="project-stat-value">{totalMembers}</span>
            <span className="project-stat-label">Assignments</span>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Create project */}
      <div className="card new-project-card">
        <div className="new-project-head">
          <span className="new-project-icon" aria-hidden="true">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <line x1="12" y1="11" x2="12" y2="17" />
              <line x1="9" y1="14" x2="15" y2="14" />
            </svg>
          </span>
          <div>
            <h2>New project</h2>
            <p className="muted small">Give it a name to start assigning people.</p>
          </div>
        </div>
        <form className="inline-form" onSubmit={handleCreate}>
          <input
            placeholder="Project name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />
          <button className="btn btn-primary" disabled={creating}>
            {creating ? "Adding..." : "+ Add project"}
          </button>
        </form>
      </div>

      {/* Project list */}
      {projects.length === 0 ? (
        <div className="card empty-projects">
          <span className="empty-projects-icon" aria-hidden="true">
            📁
          </span>
          <h2>No projects yet</h2>
          <p className="muted">Create your first project using the form above.</p>
        </div>
      ) : (
        <div className="project-grid">
          {projects.map((p) => {
            const memberIds = new Set(p.members.map((m) => m._id));
            const unassigned = employees.filter((e) => !memberIds.has(e._id));
            return (
              <div className="card project-card" key={p._id}>
                <div className="project-card-top">
                  <span className="project-monogram">
                    {p.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="project-card-titles">
                    <h2>{p.name}</h2>
                    <p className="muted small">
                      {p.description || "No description"}
                    </p>
                  </div>
                  <button
                    className="icon-btn"
                    title="Delete project"
                    disabled={busy === p._id}
                    onClick={() => handleDeleteProject(p)}
                  >
                    🗑
                  </button>
                </div>

                <div className="project-members">
                  <span className="stat-label">
                    Members
                    <span className="badge-count">{p.members.length}</span>
                  </span>
                  {p.members.length === 0 ? (
                    <div className="project-members-empty">
                      No one assigned yet
                    </div>
                  ) : (
                    <div className="member-chips">
                      {p.members.map((m) => (
                        <span className="member-chip" key={m._id}>
                          <span className="member-chip-avatar">
                            {m.name?.charAt(0).toUpperCase()}
                          </span>
                          <span className="member-chip-name">{m.name}</span>
                          <button
                            className="member-chip-remove"
                            title={`Remove ${m.name}`}
                            disabled={busy === `${p._id}:${m._id}`}
                            onClick={() => handleRemove(p._id, m._id)}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="project-assign inline-form">
                  <select
                    value={assignSel[p._id] || ""}
                    onChange={(e) =>
                      setAssignSel((s) => ({ ...s, [p._id]: e.target.value }))
                    }
                    disabled={unassigned.length === 0}
                  >
                    <option value="">
                      {unassigned.length === 0
                        ? "Everyone assigned"
                        : "Assign employee…"}
                    </option>
                    {unassigned.map((e) => (
                      <option key={e._id} value={e._id}>
                        {e.name} ({e.email})
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={
                      !assignSel[p._id] || busy === `${p._id}:assign`
                    }
                    onClick={() => handleAssign(p._id)}
                  >
                    {busy === `${p._id}:assign` ? "…" : "Assign"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
