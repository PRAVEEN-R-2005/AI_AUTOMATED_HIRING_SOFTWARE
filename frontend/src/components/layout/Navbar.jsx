import React, { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { FaBars, FaBell, FaSignOutAlt, FaSun, FaMoon, FaCheck, FaCheckDouble } from "react-icons/fa";
import Avatar from "../ui/Avatar";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const Navbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const role = localStorage.getItem("role") || "Guest";
  const email = localStorage.getItem("email") || "";
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [theme, setTheme] = useState(() => {
    return document.documentElement.getAttribute("data-theme") || "light";
  });
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    navigate("/");
  };

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", nextTheme);
    setTheme(nextTheme);
  };

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        api.get("/api/notifications"),
        api.get("/api/notifications/unread-count")
      ]);
      setNotifications((notifRes.data || []).slice(0, 10));
      setUnreadCount(countRes.data?.count || 0);
    } catch {
      // Silently fail if backend unavailable
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/api/notifications/read/${id}`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  const markAllRead = async () => {
    try {
      await api.put("/api/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const getPriorityColor = (priority) => {
    if (priority === "HIGH" || priority === "URGENT") return "#ef4444";
    return "var(--primary)";
  };

  return (
    <nav
      className="navbar-custom d-flex align-items-center justify-content-between px-4"
      style={{
        height: "70px",
        backgroundColor: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 1010,
      }}
    >
      {/* Left side: Hamburger + Context */}
      <div className="d-flex align-items-center gap-3">
        <button
          type="button"
          onClick={() => toggleSidebar && toggleSidebar()}
          className="btn-custom btn-custom-ghost p-2"
          style={{ border: "none", background: "transparent", padding: 0 }}
          aria-label="Toggle navigation menu"
        >
          <FaBars size={18} style={{ color: "var(--text-primary)" }} />
        </button>
        <div className="d-none d-sm-block">
          <span className="fw-semibold" style={{ color: "var(--text-primary)", fontSize: "0.95rem" }}>
            Recruitment Suite
          </span>
        </div>
      </div>

      {/* Right side: Actions + User Profile */}
      <div className="d-flex align-items-center gap-3">
        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="btn-custom btn-custom-ghost p-2"
          style={{ border: "none", background: "transparent", color: "var(--text-secondary)", padding: 0 }}
          title={theme === "light" ? "Dark Mode" : "Light Mode"}
        >
          {theme === "light" ? <FaMoon size={18} /> : <FaSun size={18} />}
        </button>

        {/* Notifications Bell + Dropdown */}
        <div ref={notifRef} className="position-relative">
          <button
            type="button"
            onClick={() => { setNotifOpen(prev => !prev); setDropdownOpen(false); }}
            className="btn-custom btn-custom-ghost p-2 position-relative"
            style={{ border: "none", background: "transparent", color: "var(--text-secondary)", padding: 0 }}
            aria-label="Notifications"
          >
            <FaBell size={18} />
            {unreadCount > 0 && (
              <span
                className="position-absolute badge rounded-pill bg-danger"
                style={{
                  fontSize: "0.6rem", padding: "3px 5px",
                  top: 0, right: -4,
                  lineHeight: 1,
                  animation: "pulse 2s infinite"
                }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Panel */}
          {notifOpen && (
            <div
              className="position-absolute end-0 shadow-lg"
              style={{
                top: "45px",
                width: 360,
                maxHeight: 420,
                zIndex: 1030,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column"
              }}
            >
              {/* Header */}
              <div className="d-flex justify-content-between align-items-center p-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <span className="fw-bold" style={{ fontSize: "0.95rem", color: "var(--text-primary)" }}>
                  Notifications
                </span>
                <div className="d-flex gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="btn-custom btn-custom-ghost"
                      style={{ border: "none", background: "transparent", color: "var(--primary)", fontSize: "0.75rem", padding: "2px 6px" }}
                      title="Mark all read"
                    >
                      <FaCheckDouble className="me-1" /> Mark all read
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              <div style={{ overflowY: "auto", flex: 1, maxHeight: 320 }}>
                {notifications.length === 0 ? (
                  <div className="text-center py-4" style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                    No notifications yet
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      className="d-flex gap-3 p-3"
                      style={{
                        borderBottom: "1px solid var(--border)",
                        background: notif.is_read ? "transparent" : "var(--primary-bg, rgba(99,102,241,0.05))",
                        cursor: "pointer",
                        transition: "background 0.15s ease"
                      }}
                      onClick={() => !notif.is_read && markAsRead(notif.id)}
                    >
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%", flexShrink: 0, marginTop: 6,
                        background: notif.is_read ? "transparent" : getPriorityColor(notif.priority)
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="fw-semibold" style={{
                          fontSize: "0.82rem", color: "var(--text-primary)",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                        }}>
                          {notif.title}
                        </div>
                        <div style={{
                          fontSize: "0.78rem", color: "var(--text-secondary)",
                          overflow: "hidden", textOverflow: "ellipsis",
                          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical"
                        }}>
                          {notif.message}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: 2, opacity: 0.7 }}>
                          {getTimeAgo(notif.created_at)}
                        </div>
                      </div>
                      {!notif.is_read && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                          style={{ border: "none", background: "transparent", color: "var(--primary)", padding: 2, flexShrink: 0 }}
                          title="Mark as read"
                        >
                          <FaCheck size={10} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div
                className="p-2 text-center"
                style={{ borderTop: "1px solid var(--border)", cursor: "pointer" }}
                onClick={() => { setNotifOpen(false); navigate("/notifications"); }}
              >
                <span style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 600 }}>
                  View All Notifications
                </span>
              </div>
            </div>
          )}
        </div>

        {/* User Info & Dropdown */}
        <div
          ref={dropdownRef}
          className="position-relative d-flex align-items-center gap-2"
          style={{ cursor: "pointer" }}
          onClick={() => { setDropdownOpen((prev) => !prev); setNotifOpen(false); }}
        >
          <div className="d-none d-md-flex flex-column align-items-end">
            <span className="fw-semibold" style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>
              {email || role}
            </span>
            <span className="badge-custom badge-custom-primary" style={{ fontSize: "0.65rem", padding: "2px 6px" }}>
              {role}
            </span>
          </div>
          <Avatar name={email || role} size="sm" />

          {/* Custom profile menu dropdown */}
          {dropdownOpen && (
            <div
              className="dropdown-menu-custom position-absolute end-0 p-2 shadow-lg"
              style={{
                top: "45px",
                minWidth: "180px",
                zIndex: 1030,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); setDropdownOpen(false); navigate("/settings"); }}
                className="btn-custom btn-custom-ghost w-100 d-flex align-items-center gap-2 p-2"
                style={{
                  fontSize: "0.875rem",
                  border: "none",
                  background: "transparent",
                  justifyContent: "flex-start",
                  padding: "6px 12px",
                  color: "var(--text-primary)"
                }}
              >
                ⚙️ Settings
              </button>
              <button
                onClick={handleLogout}
                className="btn-custom btn-custom-ghost w-100 text-danger d-flex align-items-center gap-2 p-2"
                style={{
                  fontSize: "0.875rem",
                  border: "none",
                  background: "transparent",
                  justifyContent: "flex-start",
                  padding: "6px 12px",
                }}
              >
                <FaSignOutAlt />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

Navbar.propTypes = {
  toggleSidebar: PropTypes.func.isRequired,
};

export default Navbar;
