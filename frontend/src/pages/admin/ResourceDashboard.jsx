import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import Loader from "../../components/Loader";
import StatusBadge from "../../components/StatusBadge";
import CapacityBar from "../../components/CapacityBar";

export default function ResourceDashboard() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/admin/resource-dashboard")
      .then((res) => setRows(res.data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!rows) return <Loader />;

  return (
    <div>
      <div className="page-header">
        <h1>Resource Dashboard</h1>
      </div>

      {rows.length === 0 ? (
        <p className="muted">No employees yet.</p>
      ) : (
        <table className="table card">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Assigned</th>
              <th>Remaining</th>
              <th>Utilization</th>
              <th>Status</th>
              <th>Free After</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.employeeId}>
                <td>{r.employee}</td>
                <td>{r.assignedMinutes} min</td>
                <td
                  className={r.remainingMinutes < 0 ? "negative" : undefined}
                >
                  {r.remainingMinutes} min
                </td>
                <td style={{ minWidth: 140 }}>
                  <CapacityBar utilization={r.utilization} />
                </td>
                <td>
                  <StatusBadge status={r.status} />
                </td>
                <td>{r.freeAt}</td>
                <td>
                  <Link to={`/admin/employees/${r.employeeId}`} className="link">
                    Manage
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