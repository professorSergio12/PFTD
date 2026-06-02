import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import CapacityBar from "../../components/CapacityBar";
import {
  currentDateString,
  humanDate,
  DAILY_CAPACITY,
} from "../../utils/format";

/* ---------- factory helpers for the nested builder state ---------- */
const emptySubtask = () => ({ title: "", time: "" });
const emptyTask = () => ({
  milestoneName: "",
  taskDetails: "",
  userEstimatedTime: "",
  subtasks: [],
});
const emptyProject = () => ({ projectName: "", tasks: [emptyTask()] });

/** A task's effective time = sum of subtask times, else the typed time. */
function taskTime(task) {
  if (task.subtasks.length > 0) {
    return task.subtasks.reduce((s, st) => s + (Number(st.time) || 0), 0);
  }
  return Number(task.userEstimatedTime) || 0;
}

/**
 * Nested project builder.
 *  Project → Zoho Tasks → (optional) subtasks, each with its own time.
 *  A Zoho Task's total time auto-sums from its subtasks when present.
 */
export default function CreatePlan() {
  const navigate = useNavigate();
  const [date, setDate] = useState(currentDateString());
  const [projects, setProjects] = useState([emptyProject()]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* --- immutable updates by index path --- */
  function updateProject(pi, patch) {
    setProjects((prev) =>
      prev.map((p, i) => (i === pi ? { ...p, ...patch } : p))
    );
  }
  function updateTask(pi, ti, patch) {
    setProjects((prev) =>
      prev.map((p, i) =>
        i !== pi
          ? p
          : {
              ...p,
              tasks: p.tasks.map((t, j) =>
                j === ti ? { ...t, ...patch } : t
              ),
            }
      )
    );
  }
  function updateSubtask(pi, ti, si, patch) {
    setProjects((prev) =>
      prev.map((p, i) =>
        i !== pi
          ? p
          : {
              ...p,
              tasks: p.tasks.map((t, j) =>
                j !== ti
                  ? t
                  : {
                      ...t,
                      subtasks: t.subtasks.map((s, k) =>
                        k === si ? { ...s, ...patch } : s
                      ),
                    }
              ),
            }
      )
    );
  }

  const addProject = () =>
    setProjects((prev) => [...prev, emptyProject()]);
  const removeProject = (pi) =>
    setProjects((prev) => prev.filter((_, i) => i !== pi));
  const addTask = (pi) =>
    updateProject(pi, { tasks: [...projects[pi].tasks, emptyTask()] });
  const removeTask = (pi, ti) =>
    updateProject(pi, {
      tasks: projects[pi].tasks.filter((_, j) => j !== ti),
    });
  const addSubtask = (pi, ti) =>
    updateTask(pi, ti, {
      subtasks: [...projects[pi].tasks[ti].subtasks, emptySubtask()],
    });
  const removeSubtask = (pi, ti, si) =>
    updateTask(pi, ti, {
      subtasks: projects[pi].tasks[ti].subtasks.filter((_, k) => k !== si),
    });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Build the batch payload: one request per project with valid tasks.
    const payloads = projects
      .map((p) => ({
        projectName: p.projectName.trim(),
        date,
        tasks: p.tasks
          .filter((t) => t.taskDetails.trim())
          .map((t) => ({
            milestoneName: t.milestoneName.trim(),
            taskDetails: t.taskDetails.trim(),
            userEstimatedTime: Number(t.userEstimatedTime) || 0,
            subtasks: t.subtasks
              .filter((s) => s.title.trim())
              .map((s) => ({
                title: s.title.trim(),
                time: Number(s.time) || 0,
              })),
          })),
      }))
      .filter((p) => p.projectName && p.tasks.length > 0);

    if (payloads.length === 0) {
      setError("Add at least one project with a Zoho Task.");
      return;
    }

    setSubmitting(true);
    try {
      await Promise.all(payloads.map((p) => api.post("/plans/batch", p)));
      navigate("/plans");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Live total across every task in every project.
  const totalMinutes = projects.reduce(
    (sum, p) => sum + p.tasks.reduce((s, t) => s + taskTime(t), 0),
    0
  );
  const remaining = DAILY_CAPACITY - totalMinutes;
  const over = totalMinutes > DAILY_CAPACITY;
  const utilization = Math.round((totalMinutes / DAILY_CAPACITY) * 100);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Create Daily Plan</h1>
          <p className="muted">
            Add a project, then its Zoho Tasks. Break a task into subtasks if
            you want — its time adds up automatically.
          </p>
        </div>
      </div>

      <div className="date-banner">📅 {humanDate(date)}</div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="card">
        <label className="form-narrow">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>

        {projects.map((project, pi) => (
          <div className="builder-project" key={pi}>
            <div className="builder-project-head">
              <label>
                Project name
                <input
                  value={project.projectName}
                  onChange={(e) =>
                    updateProject(pi, { projectName: e.target.value })
                  }
                  placeholder="Race2Cloud"
                />
              </label>
              {projects.length > 1 && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => removeProject(pi)}
                >
                  Remove project
                </button>
              )}
            </div>

            {project.tasks.map((task, ti) => {
              const hasSubs = task.subtasks.length > 0;
              return (
                <div className="builder-task" key={ti}>
                  <div className="builder-task-grid">
                    <label>
                      Milestone
                      <input
                        value={task.milestoneName}
                        onChange={(e) =>
                          updateTask(pi, ti, {
                            milestoneName: e.target.value,
                          })
                        }
                        placeholder="demerger"
                      />
                    </label>
                    <label>
                      Zoho Task
                      <input
                        value={task.taskDetails}
                        onChange={(e) =>
                          updateTask(pi, ti, { taskDetails: e.target.value })
                        }
                        placeholder="Need to work on demerger"
                      />
                    </label>
                    <label>
                      Time (min)
                      <input
                        type="number"
                        min="0"
                        value={hasSubs ? taskTime(task) : task.userEstimatedTime}
                        disabled={hasSubs}
                        title={
                          hasSubs ? "Auto-summed from subtasks" : undefined
                        }
                        onChange={(e) =>
                          updateTask(pi, ti, {
                            userEstimatedTime: e.target.value,
                          })
                        }
                        placeholder="120"
                      />
                    </label>
                    {project.tasks.length > 1 && (
                      <button
                        type="button"
                        className="icon-btn"
                        title="Remove task"
                        onClick={() => removeTask(pi, ti)}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Optional subtasks */}
                  {hasSubs && (
                    <div className="builder-subtasks">
                      <p className="builder-hint">
                        Subtasks (time auto-sums into the task total)
                      </p>
                      {task.subtasks.map((sub, si) => (
                        <div className="builder-subtask-row" key={si}>
                          <input
                            value={sub.title}
                            onChange={(e) =>
                              updateSubtask(pi, ti, si, {
                                title: e.target.value,
                              })
                            }
                            placeholder={`Subtask ${si + 1}`}
                          />
                          <input
                            type="number"
                            min="0"
                            value={sub.time}
                            onChange={(e) =>
                              updateSubtask(pi, ti, si, {
                                time: e.target.value,
                              })
                            }
                            placeholder="min"
                          />
                          <button
                            type="button"
                            className="icon-btn"
                            title="Remove subtask"
                            onClick={() => removeSubtask(pi, ti, si)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ marginTop: "0.5rem" }}
                    onClick={() => addSubtask(pi, ti)}
                  >
                    + Add subtask
                  </button>
                </div>
              );
            })}

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => addTask(pi)}
            >
              + Add Zoho Task
            </button>
          </div>
        ))}

        <div className="plan-total">
          <div className="plan-total-head">
            <span className="muted small">Daily capacity used</span>
            <strong className={over ? "negative" : undefined}>
              {totalMinutes} / {DAILY_CAPACITY} min
            </strong>
          </div>
          <CapacityBar utilization={utilization} />
          <span className={`small ${over ? "negative" : "muted"}`}>
            {over
              ? `Over capacity by ${totalMinutes - DAILY_CAPACITY} min`
              : `${remaining} min remaining today`}
          </span>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={addProject}>
            + Add project
          </button>
          <button className="btn btn-primary" disabled={submitting}>
            {submitting ? "Saving..." : "Save plan"}
          </button>
        </div>
      </form>
    </div>
  );
}
