import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import Loader from "../../components/Loader";
import SubtaskList from "../../components/SubtaskList";
import {
  humanDate,
  statusLabel,
  STATUS_OPTIONS,
  groupByProject,
} from "../../utils/format";

export default function MyPlans() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({});

  async function load() {
    try {
      const res = await api.get("/plans/my");
      setData(res.data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(plan) {
    setEditing(plan._id);
    setDraft({
      projectName: plan.projectName,
      milestoneName: plan.milestoneName,
      taskDetails: plan.taskDetails,
      userEstimatedTime: plan.userEstimatedTime,
      status: plan.status,
    });
  }

  async function saveEdit(id, hasSubtasks) {
    try {
      const payload = {
        projectName: draft.projectName,
        milestoneName: draft.milestoneName,
        taskDetails: draft.taskDetails,
        status: draft.status,
      };
      // Time is only editable when the task has no subtasks (else auto-summed).
      if (!hasSubtasks) payload.userEstimatedTime = Number(draft.userEstimatedTime);
      await api.put(`/plans/${id}`, payload);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function quickStatus(plan, status) {
    try {
      await api.put(`/plans/${plan._id}`, { status });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    if (!window.confirm("Delete this task?")) return;
    try {
      await api.delete(`/plans/${id}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!data) return <Loader />;

  const { plans, date } = data;
  const adminPlans = plans.filter((p) => p.assignedByAdmin);
  const ownPlans = plans.filter((p) => !p.assignedByAdmin);
  const groups = groupByProject(ownPlans);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Plans</h1>
          <p className="muted">{humanDate(date)}</p>
        </div>
        <Link to="/plans/new" className="btn btn-primary">
          + Create Plan
        </Link>
      </div>

      {plans.length === 0 && <p className="muted">No tasks yet.</p>}

      {/* Tasks assigned by the admin — read-only, can't be deleted. */}
      {adminPlans.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="project-group-head">
              <span className="project-group-icon" />
              Assigned by Admin
              <span className="badge-count">{adminPlans.length}</span>
            </h2>
            <span className="muted small">
              You can update status, but these can&apos;t be deleted.
            </span>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Milestone</th>
                <th>Zoho Task</th>
                <th>Time</th>
                <th className="col-admin">Admin Expected</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {adminPlans.map((p) => (
                <tr key={p._id}>
                  <td>{p.projectName}</td>
                  <td className="muted">{p.milestoneName || "—"}</td>
                  <td>
                    {p.taskDetails}
                    <SubtaskList subtasks={p.subtasks} />
                  </td>
                  <td>{p.userEstimatedTime} min</td>
                  <td className="col-admin">
                    {p.adminExpectedTime == null ? (
                      <span className="muted small">Not set</span>
                    ) : (
                      <span className="time-emp">{p.adminExpectedTime} min</span>
                    )}
                  </td>
                  <td>
                    <select
                      className="inline-input"
                      style={{ width: "auto" }}
                      value={p.status}
                      onChange={(e) => quickStatus(p, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {statusLabel(s)}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* The employee's own tasks, grouped by project. */}
      {groups.map((group) => (
          <div className="card" key={group.projectName}>
            <div className="card-header">
              <h2 className="project-group-head">
                <span className="project-group-icon" />
                {group.projectName}
                <span className="badge-count">{group.items.length}</span>
              </h2>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Milestone</th>
                  <th>Zoho Task</th>
                  <th>Time</th>
                  <th className="col-admin">Admin Expected</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((p) => {
                  const hasSubtasks = p.subtasks && p.subtasks.length > 0;
                  return editing === p._id ? (
                    <tr key={p._id}>
                      <td>
                        <input
                          value={draft.milestoneName}
                          onChange={(e) =>
                            setDraft({ ...draft, milestoneName: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <input
                          value={draft.taskDetails}
                          onChange={(e) =>
                            setDraft({ ...draft, taskDetails: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="inline-input"
                          value={
                            hasSubtasks
                              ? p.userEstimatedTime
                              : draft.userEstimatedTime
                          }
                          disabled={hasSubtasks}
                          title={hasSubtasks ? "Auto-summed from subtasks" : undefined}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              userEstimatedTime: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td className="col-admin">
                        {p.adminExpectedTime == null ? (
                          <span className="muted small">Not set</span>
                        ) : (
                          `${p.adminExpectedTime} min`
                        )}
                      </td>
                      <td>
                        <select
                          value={draft.status}
                          onChange={(e) =>
                            setDraft({ ...draft, status: e.target.value })
                          }
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {statusLabel(s)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="row-actions">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => saveEdit(p._id, hasSubtasks)}
                        >
                          Save
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setEditing(null)}
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={p._id}>
                      <td className="muted">{p.milestoneName || "—"}</td>
                      <td>
                        {p.taskDetails}
                        <SubtaskList subtasks={p.subtasks} />
                      </td>
                      <td>{p.userEstimatedTime} min</td>
                      <td className="col-admin">
                        {p.adminExpectedTime == null ? (
                          <span className="muted small">Not set</span>
                        ) : (
                          <span className="time-emp">
                            {p.adminExpectedTime} min
                          </span>
                        )}
                      </td>
                      <td>
                        <select
                          className="inline-input"
                          style={{ width: "auto" }}
                          value={p.status}
                          onChange={(e) => quickStatus(p, e.target.value)}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {statusLabel(s)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="row-actions">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => startEdit(p)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => remove(p._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
      ))}
    </div>
  );
}
