/**
 * Horizontal utilization bar. Turns red once over 100%.
 */
export default function CapacityBar({ utilization }) {
  const width = Math.min(utilization, 100);
  const over = utilization > 100;
  return (
    <div className="capacity-bar" title={`${utilization}% utilized`}>
      <div
        className={`capacity-bar-fill ${over ? "over" : ""}`}
        style={{ width: `${width}%` }}
      />
      <span className="capacity-bar-label">{utilization}%</span>
    </div>
  );
}