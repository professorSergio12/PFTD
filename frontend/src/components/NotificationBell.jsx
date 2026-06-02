import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api/axios";

/** Relative "2m ago" style time. */
function timeAgo(iso) {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/notifications");
      setItems(data.notifications);
      setUnread(data.unread);
    } catch {
      // ignore polling errors silently
    }
  }, []);

  // Poll every 60s.
  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [load]);

  // Close the dropdown when clicking outside.
  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) await load();
  }

  async function markAll() {
    try {
      await api.post("/notifications/read-all");
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch {
      /* ignore */
    }
  }

  async function openOne(n) {
    if (!n.read) {
      try {
        await api.patch(`/notifications/${n._id}/read`);
        setItems((prev) =>
          prev.map((x) => (x._id === n._id ? { ...x, read: true } : x))
        );
        setUnread((u) => Math.max(0, u - 1));
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <div className="notif" ref={ref}>
      <button
        className="notif-btn"
        onClick={toggle}
        title="Notifications"
        aria-label="Notifications"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="notif-badge">{unread > 9 ? "9+" : unread}</span>
        )}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-head">
            <strong>Notifications</strong>
            {unread > 0 && (
              <button className="link" onClick={markAll}>
                Mark all read
              </button>
            )}
          </div>
          <div className="notif-list">
            {items.length === 0 ? (
              <p className="notif-empty muted small">No notifications yet.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n._id}
                  className={`notif-item${n.read ? "" : " unread"}`}
                  onClick={() => openOne(n)}
                >
                  <span className="notif-dot" />
                  <span className="notif-body">
                    <span className="notif-msg">{n.message}</span>
                    <span className="notif-time muted small">
                      {timeAgo(n.createdAt)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
