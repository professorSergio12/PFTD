import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api/axios";
import Loader from "../../components/Loader";
import StatusBadge from "../../components/StatusBadge";
import CapacityBar from "../../components/CapacityBar";
import SubtaskList from "../../components/SubtaskList";
import {
  currentDateString,
  humanDate,
  statusLabel,
  STATUS_OPTIONS,
  groupByProject,
} from "../../utils/format";

export default function EmployeePlans() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState({}); // planId -> adminExpectedTime
  const [editing, setEditing] = useState(null); // planId being edited
  const [edit, setEdit] = useState({}); // edit draft fields
  const [busy, setBusy] = useState(null); // planId being saved/deleted
  const [assign, setAssign] = useState({
    projectName: "",
    milestoneName: "",
    taskDetails: "",
    adminExpectedTime: "",
    date: currentDateString(),
  });

  async function load() {
    try {
      const res = await api.get(`/admin/users/${id}/plans`);
      setData(res.data);
      const seed = {};
      res.data.plans.forEach((p) => {
        seed[p._id] = p.adminExpectedTime ?? "";
      });
      setDrafts(seed);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function saveExpected(planId) {
    try {
      const raw = drafts[planId];
      await api.patch(`/admin/plans/${planId}`, {
        adminExpectedTime: raw === "" ? null : Number(raw),
      });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(p) {
    setEditing(p._id);
    setEdit({
      milestoneName: p.milestoneName || "",
      taskDetails: p.taskDetails || "",
      userEstimatedTime: p.userEstimatedTime,
      status: p.status,
    });
  }

  // Admin can fully edit an employee's plan (details, time, status, expected).
  async function saveEdit(p) {
    const hasSubtasks = p.subtasks && p.subtasks.length > 0;
    setBusy(p._id);
    try {
      const payload = {
        milestoneName: edit.milestoneName,
        taskDetails: edit.taskDetails,
        status: edit.status,
        adminExpectedTime: drafts[p._id] === "" ? null : Number(drafts[p._id]),
      };
      if (!hasSubtasks) payload.userEstimatedTime = Number(edit.userEstimatedTime);
      await api.patch(`/admin/plans/${p._id}`, payload);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function deletePlan(p) {
    if (!window.confirm(`Delete "${p.taskDetails}"? This can't be undone.`)) {
      return;
    }
    setBusy(p._id);
    try {
      await api.delete(`/admin/plans/${p._id}`);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function assignTask(e) {
    e.preventDefault();
    try {
      await api.post(`/admin/users/${id}/plans`, {
        projectName: assign.projectName.trim(),
        milestoneName: assign.milestoneName.trim(),
        taskDetails: assign.taskDetails.trim(),
        adminExpectedTime: Number(assign.adminExpectedTime),
        date: assign.date,
      });
      setAssign({
        projectName: "",
        milestoneName: "",
        taskDetails: "",
        adminExpectedTime: "",
        date: currentDateString(),
      });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!data) return <Loader />;

  const { user, plans, summary } = data;

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/admin/employees" className="link">
            ← Employees
          </Link>
          <h1>{user.name}</h1>
          <p className="muted">{user.email}</p>
        </div>
        <StatusBadge status={summary.status} />
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Assigned</span>
          <span className="stat-value">{summary.assignedMinutes} min</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Remaining</span>
          <span className="stat-value">{summary.remainingMinutes} min</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Utilization</span>
          <span className="stat-value">{summary.utilization}%</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Free After</span>
          <span className="stat-value">{summary.freeAt}</span>
        </div>
      </div>

      <div className="card">
        <CapacityBar utilization={summary.utilization} />
      </div>

      {plans.length === 0 ? (
        <div className="card">
          <h2>Tasks</h2>
          <p className="muted">No tasks for this employee.</p>
        </div>
      ) : (
        groupByProject(plans).map((group) => (
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
                  <th>Date</th>
                  <th>Milestone</th>
                  <th>Zoho Task</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th className="col-admin">Expected Time</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((p) => {
                  const hasSubtasks = p.subtasks && p.subtasks.length > 0;
                  return editing === p._id ? (
                    <tr key={p._id}>
                      <td className="muted small">{humanDate(p.date)}</td>
                      <td>
                        <input
                          className="inline-input"
                          style={{ width: "100%" }}
                          value={edit.milestoneName}
                          onChange={(e) =>
                            setEdit({ ...edit, milestoneName: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="inline-input"
                          style={{ width: "100%" }}
                          value={edit.taskDetails}
                          onChange={(e) =>
                            setEdit({ ...edit, taskDetails: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="inline-input"
                          type="number"
                          min="0"
                          value={
                            hasSubtasks
                              ? p.userEstimatedTime
                              : edit.userEstimatedTime
                          }
                          disabled={hasSubtasks}
                          title={
                            hasSubtasks ? "Auto-summed from subtasks" : undefined
                          }
                          onChange={(e) =>
                            setEdit({
                              ...edit,
                              userEstimatedTime: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <select
                          className="inline-input"
                          style={{ width: "auto" }}
                          value={edit.status}
                          onChange={(e) =>
                            setEdit({ ...edit, status: e.target.value })
                          }
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {statusLabel(s)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="col-admin">
                        <input
                          className="inline-input"
                          type="number"
                          min="0"
                          value={drafts[p._id]}
                          onChange={(e) =>
                            setDrafts({ ...drafts, [p._id]: e.target.value })
                          }
                        />
                      </td>
                      <td className="row-actions">
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={busy === p._id}
                          onClick={() => saveEdit(p)}
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
                      <td className="muted small">{humanDate(p.date)}</td>
                      <td className="muted">{p.milestoneName || "—"}</td>
                      <td>
                        {p.taskDetails}
                        <SubtaskList subtasks={p.subtasks} />
                      </td>
                      <td>{p.userEstimatedTime} min</td>
                      <td>
                        <span className={`pill pill-${p.status}`}>
                          {statusLabel(p.status)}
                        </span>
                      </td>
                      <td className="col-admin">
                        <input
                          className="inline-input"
                          type="number"
                          min="0"
                          value={drafts[p._id]}
                          onChange={(e) =>
                            setDrafts({ ...drafts, [p._id]: e.target.value })
                          }
                          placeholder="set min"
                        />
                      </td>
                      <td className="row-actions">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => saveExpected(p._id)}
                        >
                          Save
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => startEdit(p)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          disabled={busy === p._id}
                          onClick={() => deletePlan(p)}
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
        ))
      )}

      <div className="card">
        <h2>Assign additional task</h2>
        <form onSubmit={assignTask} className="inline-form">
          <input
            placeholder="Project name"
            value={assign.projectName}
            onChange={(e) =>
              setAssign({ ...assign, projectName: e.target.value })
            }
            required
          />
          <input
            placeholder="Milestone"
            value={assign.milestoneName}
            onChange={(e) =>
              setAssign({ ...assign, milestoneName: e.target.value })
            }
          />
          <input
            placeholder="Zoho task"
            value={assign.taskDetails}
            onChange={(e) =>
              setAssign({ ...assign, taskDetails: e.target.value })
            }
            required
          />
          <input
            type="number"
            min="0"
            placeholder="Expected min"
            value={assign.adminExpectedTime}
            onChange={(e) =>
              setAssign({ ...assign, adminExpectedTime: e.target.value })
            }
            required
          />
          <input
            type="date"
            value={assign.date}
            onChange={(e) => setAssign({ ...assign, date: e.target.value })}
            required
          />
          <button className="btn btn-primary">Assign</button>
        </form>
      </div>
    </div>
  );
}
