import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import Loader from "../../components/Loader";
import StatusBadge from "../../components/StatusBadge";
import CapacityBar from "../../components/CapacityBar";
import SubtaskList from "../../components/SubtaskList";
import {
  minutesToHuman,
  humanDate,
  statusLabel,
  groupByProject,
} from "../../utils/format";

export default function UserDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/plans/my")
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!data) return <Loader />;

  const { plans, summary, date } = data;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Dashboard</h1>
          <p className="muted">{humanDate(date)}</p>
        </div>
        <Link to="/plans/new" className="btn btn-primary">
          + Create Plan
        </Link>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Planned</span>
          <span className="stat-value">
            {minutesToHuman(summary.assignedMinutes)}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Remaining</span>
          <span className="stat-value">
            {minutesToHuman(summary.remainingMinutes)}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Utilization</span>
          <span className="stat-value">{summary.utilization}%</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Status</span>
          <span className="stat-value">
            <StatusBadge status={summary.status} />
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Free After</span>
          <span className="stat-value">{summary.freeAt}</span>
        </div>
      </div>

      <div className="card">
        <h2>Today&apos;s capacity</h2>
        <CapacityBar utilization={summary.utilization} />
        <p className="muted small" style={{ marginTop: "0.75rem" }}>
          Capacity {summary.capacity} mins · Planned {summary.assignedMinutes} ·
          Remaining {summary.remainingMinutes}
        </p>
      </div>

      {plans.length === 0 ? (
        <div className="card">
          <h2>My Tasks</h2>
          <p className="muted">No tasks yet. Create your daily plan.</p>
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
                      <span className={`pill pill-${p.status}`}>
                        {statusLabel(p.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}
