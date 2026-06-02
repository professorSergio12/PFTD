import { statusClass } from "../utils/format";

export default function StatusBadge({ status }) {
  return <span className={`badge badge-${statusClass(status)}`}>{status}</span>;
}