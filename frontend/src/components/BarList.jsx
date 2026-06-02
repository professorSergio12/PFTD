/**
 * Dependency-free horizontal bar chart.
 * props:
 *  - items: [{ label, value, display?, over? }]
 *  - max: value mapped to a full-width bar (defaults to the largest value)
 *  - unit: appended to value when `display` is not provided
 *  - emptyText: shown when there are no items
 */
export default function BarList({ items = [], max, unit = "", emptyText }) {
  if (items.length === 0) {
    return <p className="chart-empty">{emptyText || "No data yet."}</p>;
  }
  const top = max || Math.max(1, ...items.map((i) => i.value));

  return (
    <ul className="bar-list">
      {items.map((it, i) => {
        const pct = Math.max(2, Math.min(100, Math.round((it.value / top) * 100)));
        return (
          <li key={i} className="bar-row">
            <span className="bar-label" title={it.label}>
              {it.label}
            </span>
            <span className="bar-track">
              <span
                className={`bar-fill${it.over ? " over" : ""}`}
                style={{ width: `${pct}%` }}
              />
            </span>
            <span className="bar-value">
              {it.display ?? `${it.value}${unit}`}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
