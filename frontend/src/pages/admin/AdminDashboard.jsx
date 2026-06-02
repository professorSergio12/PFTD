import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import Loader from "../../components/Loader";
import StatusBadge from "../../components/StatusBadge";
import CapacityBar from "../../components/CapacityBar";
import SubtaskList from "../../components/SubtaskList";
import DonutChart from "../../components/DonutChart";
import BarList from "../../components/BarList";
import {
  weekRangeOf,
  shiftWeek,
  weekLabel,
  humanDate,
  statusLabel,
} from "../../utils/format";

export default function AdminDashboard() {
  // `monday` is any anchor inside the selected week; backend resolves Mon–Sun.
  const [monday, setMonday] = useState(weekRangeOf().from);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null); // expanded employeeId
  const [drafts, setDrafts] = useState({}); // planId -> admin expected time input
  const [saving, setSaving] = useState(null); // planId currently saving

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/overview", {
        params: { week: monday },
      });
      setData(data);
      // seed the admin-time inputs
      const seed = {};
      data.employees.forEach((e) =>
        e.plans.forEach((p) => {
          seed[p._id] = p.adminExpectedTime ?? "";
        })
      );
      setDrafts(seed);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [monday]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveAdminTime(planId) {
    setSaving(planId);
    try {
      await api.patch(`/admin/plans/${planId}`, {
        adminExpectedTime: Number(drafts[planId]),
      });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  }

  function thisWeek() {
    setMonday(weekRangeOf().from);
  }

  if (loading && !data) return <Loader label="Loading dashboard..." />;

  const range = data?.range;
  const employees = data?.employees || [];
  const total = employees.length;
  const available = employees.filter((e) => e.status === "Available").length;
  const occupied = employees.filter((e) => e.status === "Occupied").length;
  const partial = total - available - occupied;
  const avgUtil =
    total === 0
      ? 0
      : Math.round(employees.reduce((s, e) => s + e.utilization, 0) / total);
  const isCurrentWeek = monday === weekRangeOf().from;

  // --- Chart data (derived from the overview payload) ---
  const statusData = [
    { label: "Available", value: available, color: "#16a34a" },
    { label: "Partially Occupied", value: partial, color: "#d97706" },
    { label: "Occupied", value: occupied, color: "#dc2626" },
  ];

  const utilItems = [...employees]
    .sort((a, b) => b.utilization - a.utilization)
    .map((e) => ({
      label: e.name,
      value: e.utilization,
      over: e.utilization > 100,
      display: `${e.utilization}%`,
    }));

  // Aggregate assigned minutes per project across every employee.
  const projectTotals = new Map();
  employees.forEach((e) =>
    e.plans.forEach((p) => {
      const mins =
        p.adminExpectedTime != null
          ? p.adminExpectedTime
          : p.userEstimatedTime || 0;
      const key = (p.projectName || "—").trim() || "—";
      projectTotals.set(key, (projectTotals.get(key) || 0) + mins);
    })
  );
  const projectItems = Array.from(projectTotals, ([label, value]) => ({
    label,
    value,
    display: `${value} min`,
  })).sort((a, b) => b.value - a.value);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="muted">Team availability &amp; weekly plans</p>
        </div>
        <Link to="/admin/users/new" className="btn btn-primary">
          + Create User
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Week filter */}
      <div className="week-filter">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setMonday(shiftWeek(monday, -1))}
        >
          ← Prev
        </button>
        <div className="week-filter-label">
          <span className="muted small">Week of</span>
          <strong>{range ? weekLabel(range.from, range.to) : "…"}</strong>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setMonday(shiftWeek(monday, 1))}
        >
          Next →
        </button>
        {!isCurrentWeek && (
          <button className="btn btn-ghost btn-sm" onClick={thisWeek}>
            This week
          </button>
        )}
        <span className="week-filter-spacer" />
        <label className="week-jump">
          Jump to
          <input
            type="date"
            value={monday}
            onChange={(e) => setMonday(e.target.value)}
          />
        </label>
      </div>

      {/* Summary stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Employees</span>
          <span className="stat-value">{total}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Available</span>
          <span className="stat-value">{available}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Occupied</span>
          <span className="stat-value">{occupied}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Avg Utilization</span>
          <span className="stat-value">{avgUtil}%</span>
        </div>
      </div>

      {/* Charts overview */}
      <div className="chart-grid">
        <div className="card">
          <div className="card-header">
            <h2>Team Availability</h2>
            <span className="muted small">{total} employees</span>
          </div>
          <div className="chart-card-body">
            <DonutChart
              data={statusData}
              centerValue={total}
              centerLabel="Employees"
            />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Utilization by Employee</h2>
            <span className="muted small">Avg {avgUtil}%</span>
          </div>
          <div className="chart-card-body">
            <div className="chart-scroll">
              <BarList
                items={utilItems}
                max={100}
                emptyText="No employees yet."
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Workload by Project</h2>
            <span className="muted small">Assigned minutes</span>
          </div>
          <div className="chart-card-body">
            <div className="chart-scroll">
              <BarList
                items={projectItems}
                unit=" min"
                emptyText="No tasks planned this week."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Employee availability + plans */}
      <div className="card">
        <div className="card-header">
          <h2>Employees</h2>
          <span className="muted small">
            Weekly capacity {data?.weeklyCapacity} min ({data?.workingDays} days)
          </span>
        </div>

        {total === 0 ? (
          <p className="muted">
            No employees yet. <Link to="/admin/users/new">Create one</Link>.
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th></th>
                <th>Employee</th>
                <th>Tasks</th>
                <th>Utilization</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <EmployeeRow
                  key={e.employeeId}
                  emp={e}
                  open={open === e.employeeId}
                  onToggle={() =>
                    setOpen(open === e.employeeId ? null : e.employeeId)
                  }
                  drafts={drafts}
                  setDrafts={setDrafts}
                  onSave={saveAdminTime}
                  saving={saving}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function EmployeeRow({
  emp,
  open,
  onToggle,
  drafts,
  setDrafts,
  onSave,
  saving,
}) {
  return (
    <>
      <tr className="emp-row" onClick={onToggle}>
        <td className="expand-cell">{open ? "▾" : "▸"}</td>
        <td>
          <div className="emp-name">{emp.name}</div>
          <div className="muted small">{emp.email}</div>
        </td>
        <td>{emp.plans.length}</td>
        <td style={{ minWidth: 140 }}>
          <CapacityBar utilization={emp.utilization} />
        </td>
        <td>
          <StatusBadge status={emp.status} />
        </td>
        <td>
          <Link
            to={`/admin/employees/${emp.employeeId}`}
            className="link"
            onClick={(ev) => ev.stopPropagation()}
          >
            Open →
          </Link>
        </td>
      </tr>

      {open && (
        <tr className="emp-detail-row">
          <td colSpan={6}>
            {emp.plans.length === 0 ? (
              <p className="muted" style={{ margin: "0.5rem 0" }}>
                No plan submitted for this week.
              </p>
            ) : (
              <table className="table inner-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Project</th>
                    <th>Milestone</th>
                    <th>Zoho Task</th>
                    <th>Employee Time</th>
                    <th className="col-admin">Expected Time (admin)</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {emp.plans.map((p) => {
                    const draft = drafts[p._id] ?? "";
                    const changed =
                      String(draft) !== String(p.adminExpectedTime ?? "");
                    return (
                      <tr key={p._id}>
                        <td className="muted small">{humanDate(p.date)}</td>
                        <td>{p.projectName}</td>
                        <td className="muted">{p.milestoneName || "—"}</td>
                        <td>
                          {p.taskDetails}
                          <SubtaskList subtasks={p.subtasks} />
                        </td>
                        <td>
                          <span className="time-emp">
                            {p.userEstimatedTime} min
                          </span>
                        </td>
                        <td className="col-admin">
                          <input
                            className="inline-input"
                            type="number"
                            min="0"
                            value={draft}
                            placeholder={`${p.userEstimatedTime}`}
                            onChange={(ev) =>
                              setDrafts((d) => ({
                                ...d,
                                [p._id]: ev.target.value,
                              }))
                            }
                          />
                        </td>
                        <td>
                          <span className={`pill pill-${p.status}`}>
                            {statusLabel(p.status)}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={!changed || saving === p._id}
                            onClick={() => onSave(p._id)}
                          >
                            {saving === p._id ? "…" : "Save"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} style={{ textAlign: "right", fontWeight: 650 }}>
                      Week total
                    </td>
                    <td className="time-emp">{emp.userMinutes} min</td>
                    <td className="col-admin" style={{ fontWeight: 700 }}>
                      {emp.adminMinutes} min
                    </td>
                    <td colSpan={2} className="muted small">
                      {emp.remainingMinutes < 0
                        ? `Over by ${-emp.remainingMinutes} min`
                        : `${emp.remainingMinutes} min free`}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
