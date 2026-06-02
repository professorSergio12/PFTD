/**
 * Renders a Zoho Task's optional subtask breakdown. Each subtask shows its
 * title and its own time. Returns null when there are no subtasks.
 */
export default function SubtaskList({ subtasks }) {
  if (!subtasks || subtasks.length === 0) return null;
  return (
    <ul className="subtask-list">
      {subtasks.map((s, i) => (
        <li className="subtask-item" key={s._id || `${s.title}-${i}`}>
          <span className="subtask-title">{s.title}</span>
          <span className="subtask-time">{s.time} min</span>
        </li>
      ))}
    </ul>
  );
}
