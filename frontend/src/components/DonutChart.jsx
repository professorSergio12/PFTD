/**
 * Dependency-free SVG donut chart.
 * props:
 *  - data: [{ label, value, color }]
 *  - size, thickness: pixels
 *  - centerValue / centerLabel: text shown in the middle (defaults to total)
 */
export default function DonutChart({
  data = [],
  size = 184,
  thickness = 28,
  centerValue,
  centerLabel = "Total",
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const cx = size / 2;
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;

  let offset = 0;

  return (
    <div className="donut">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${cx} ${cx})`}>
          {total === 0 ? (
            <circle
              cx={cx}
              cy={cx}
              r={r}
              fill="none"
              stroke="var(--border)"
              strokeWidth={thickness}
            />
          ) : (
            data
              .filter((d) => d.value > 0)
              .map((d, i) => {
                const len = (d.value / total) * circ;
                const seg = (
                  <circle
                    key={i}
                    cx={cx}
                    cy={cx}
                    r={r}
                    fill="none"
                    stroke={d.color}
                    strokeWidth={thickness}
                    strokeDasharray={`${len} ${circ - len}`}
                    strokeDashoffset={-offset}
                  />
                );
                offset += len;
                return seg;
              })
          )}
        </g>
        <text
          x={cx}
          y={cx - 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="donut-value"
        >
          {centerValue ?? total}
        </text>
        <text
          x={cx}
          y={cx + 20}
          textAnchor="middle"
          dominantBaseline="middle"
          className="donut-label"
        >
          {centerLabel}
        </text>
      </svg>

      <ul className="donut-legend">
        {data.map((d, i) => {
          const pct = total ? Math.round((d.value / total) * 100) : 0;
          return (
            <li key={i}>
              <span className="legend-dot" style={{ background: d.color }} />
              <span className="legend-name">{d.label}</span>
              <strong>{d.value}</strong>
              <span className="legend-pct">{pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
