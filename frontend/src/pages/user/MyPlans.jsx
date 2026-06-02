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

  // Employees can only update the progress status of a task; editing the
  // details or deleting it is admin-only (done from the employee's page).
  async function quickStatus(plan, status) {
    try {
      await api.put(`/plans/${plan._id}`, { status });
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

  function StatusSelect({ plan }) {
    return (
      <select
        className="inline-input"
        style={{ width: "auto" }}
        value={plan.status}
        onChange={(e) => quickStatus(plan, e.target.value)}
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {statusLabel(s)}
          </option>
        ))}
      </select>
    );
  }

  function adminExpectedCell(p) {
    return p.adminExpectedTime == null ? (
      <span className="muted small">Not set</span>
    ) : (
      <span className="time-emp">{p.adminExpectedTime} min</span>
    );
  }

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

      {/* Tasks assigned by the admin */}
      {adminPlans.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="project-group-head">
              <span className="project-group-icon" />
              Assigned by Admin
              <span className="badge-count">{adminPlans.length}</span>
            </h2>
            <span className="muted small">You can update the status only.</span>
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
                  <td className="col-admin">{adminExpectedCell(p)}</td>
                  <td>
                    <StatusSelect plan={p} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* The employee's own tasks, grouped by project (read-only) */}
      {groups.map((group) => (
        <div className="card" key={group.projectName}>
          <div className="card-header">
            <h2 className="project-group-head">
              <span className="project-group-icon" />
              {group.projectName}
              <span className="badge-count">{group.items.length}</span>
            </h2>
            <span className="muted small">
              Once saved, only an admin can edit or delete these.
            </span>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Milestone</th>
                <th>Zoho Task</th>
                <th>Time</th>
                <th className="col-admin">Admin Expected</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {group.items.map((p) => (
                <tr key={p._id}>
                  <td className="muted">{p.milestoneName || "—"}</td>
                  <td>
                    {p.taskDetails}
                    <SubtaskList subtasks={p.subtasks} />
                  </td>
                  <td>{p.userEstimatedTime} min</td>
                  <td className="col-admin">{adminExpectedCell(p)}</td>
                  <td>
                    <StatusSelect plan={p} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
