import { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import AppLayout from "../components/layout/AppLayout";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { FaBell, FaCheck, FaCheckDouble, FaFilter, FaTrash, FaExclamationTriangle, FaInfoCircle, FaCalendarAlt } from "react-icons/fa";

function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState("all"); // all, unread, read
    const [categoryFilter, setCategoryFilter] = useState("");

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get("/api/notifications");
            setNotifications(res.data || []);
        } catch {
            // Demo notifications
            setNotifications([
                { id: 1, type: "INTERVIEW_SCHEDULED", priority: "HIGH", title: "New Interview Scheduled", message: "Technical Interview for John Smith with Sarah Wilson on 2026-07-10", is_read: false, created_at: new Date(Date.now() - 3600000).toISOString() },
                { id: 2, type: "PIPELINE_STAGE_CHANGED", priority: "NORMAL", title: "Pipeline Stage Transition", message: "Candidate Jane Doe moved from Screening to Shortlisted", is_read: false, created_at: new Date(Date.now() - 7200000).toISOString() },
                { id: 3, type: "CANDIDATE_REJECTED", priority: "NORMAL", title: "Candidate Rejected", message: "Candidate Mike Johnson marked Rejected. Reason: Insufficient experience", is_read: true, created_at: new Date(Date.now() - 86400000).toISOString() },
                { id: 4, type: "FEEDBACK_SUBMITTED", priority: "NORMAL", title: "Feedback Evaluation Logged", message: "Scorecard evaluation logged for Emily Brown (Rating: 4/5)", is_read: true, created_at: new Date(Date.now() - 172800000).toISOString() },
                { id: 5, type: "INTERVIEW_RESCHEDULED", priority: "HIGH", title: "Interview Booking Updated", message: "Interview status updated to Rescheduled for candidate Alex Wilson", is_read: false, created_at: new Date(Date.now() - 5400000).toISOString() }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try { await api.put(`/api/notifications/read/${id}`); } catch { /* OK */ }
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    };

    const markAllRead = async () => {
        try { await api.put("/api/notifications/read-all"); } catch { /* OK */ }
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    };

    const categories = useMemo(() => [...new Set(notifications.map(n => n.type))], [notifications]);
    const unreadCount = notifications.filter(n => !n.is_read).length;

    const filtered = useMemo(() => {
        return notifications.filter(n => {
            if (filterType === "unread" && n.is_read) return false;
            if (filterType === "read" && !n.is_read) return false;
            if (categoryFilter && n.type !== categoryFilter) return false;
            return true;
        });
    }, [notifications, filterType, categoryFilter]);

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

    const getTypeIcon = (type) => {
        const map = {
            INTERVIEW_SCHEDULED: <FaCalendarAlt />,
            INTERVIEW_RESCHEDULED: <FaCalendarAlt />,
            PIPELINE_STAGE_CHANGED: <FaInfoCircle />,
            CANDIDATE_REJECTED: <FaExclamationTriangle />,
            FEEDBACK_SUBMITTED: <FaCheck />
        };
        return map[type] || <FaBell />;
    };

    const getTypeColor = (type) => {
        const map = {
            INTERVIEW_SCHEDULED: "#06b6d4",
            INTERVIEW_RESCHEDULED: "#f59e0b",
            PIPELINE_STAGE_CHANGED: "#6366f1",
            CANDIDATE_REJECTED: "#ef4444",
            FEEDBACK_SUBMITTED: "#10b981"
        };
        return map[type] || "var(--primary)";
    };

    const formatCategory = (type) => {
        return type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()).toLowerCase().replace(/^\w/, c => c.toUpperCase());
    };

    return (
        <AppLayout>
            <div className="container-fluid px-0">
                {/* Header */}
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
                    <div>
                        <h2 className="fw-bold mb-1" style={{ fontFamily: "var(--font-sans)", color: "var(--text-primary)" }}>
                            <FaBell className="me-2" style={{ color: "var(--primary)" }} />
                            Notification Center
                        </h2>
                        <p className="mb-0" style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                            {unreadCount} unread · {notifications.length} total
                        </p>
                    </div>
                    <div className="d-flex gap-2">
                        {unreadCount > 0 && (
                            <Button variant="outline" onClick={markAllRead}>
                                <FaCheckDouble className="me-1" /> Mark All Read
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="card-custom surface-custom border-custom p-3 mb-4" style={{ borderRadius: "var(--radius-md)" }}>
                    <div className="d-flex flex-wrap gap-3 align-items-center">
                        <div className="d-flex gap-1">
                            {[
                                { key: "all", label: "All" },
                                { key: "unread", label: `Unread (${unreadCount})` },
                                { key: "read", label: "Read" }
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setFilterType(tab.key)}
                                    style={{
                                        border: "none",
                                        background: filterType === tab.key ? "var(--primary)" : "transparent",
                                        color: filterType === tab.key ? "#fff" : "var(--text-secondary)",
                                        padding: "6px 14px",
                                        borderRadius: "var(--radius-sm)",
                                        fontSize: "0.82rem",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        transition: "all 0.15s ease"
                                    }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <select
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value)}
                            style={{
                                background: "var(--background)", color: "var(--text-primary)",
                                border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
                                padding: "6px 12px", fontSize: "0.85rem"
                            }}
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{formatCategory(cat)}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Notification List */}
                {loading ? (
                    <div className="text-center py-5" style={{ color: "var(--text-secondary)" }}>Loading notifications…</div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-5">
                        <FaBell size={48} style={{ color: "var(--text-secondary)", opacity: 0.3, marginBottom: 16 }} />
                        <h5 style={{ color: "var(--text-secondary)" }}>No notifications</h5>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                            {filterType === "unread" ? "All caught up! No unread notifications." : "Notifications will appear here as recruitment events occur."}
                        </p>
                    </div>
                ) : (
                    <div className="d-flex flex-column gap-2">
                        {filtered.map(notif => (
                            <div
                                key={notif.id}
                                className="card-custom surface-custom border-custom p-3 d-flex align-items-start gap-3"
                                style={{
                                    borderRadius: "var(--radius-sm)",
                                    borderLeft: `4px solid ${getTypeColor(notif.type)}`,
                                    background: notif.is_read ? "var(--surface)" : "var(--primary-bg, rgba(99,102,241,0.04))",
                                    transition: "transform 0.15s ease"
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = "translateX(3px)"}
                                onMouseLeave={e => e.currentTarget.style.transform = "translateX(0)"}
                            >
                                {/* Type Icon */}
                                <div style={{
                                    width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                                    background: getTypeColor(notif.type) + "18",
                                    color: getTypeColor(notif.type),
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: "0.95rem"
                                }}>
                                    {getTypeIcon(notif.type)}
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                                        <div className="fw-semibold" style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>
                                            {notif.title}
                                        </div>
                                        <div className="d-flex align-items-center gap-2 flex-shrink-0">
                                            {notif.priority === "HIGH" && <Badge variant="danger">High</Badge>}
                                            <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                                                {getTimeAgo(notif.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="mb-1" style={{ fontSize: "0.84rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                                        {notif.message}
                                    </p>
                                    <div className="d-flex align-items-center gap-2">
                                        <Badge variant="info">{formatCategory(notif.type)}</Badge>
                                        {!notif.is_read && (
                                            <button
                                                onClick={() => markAsRead(notif.id)}
                                                style={{
                                                    border: "none", background: "transparent", color: "var(--primary)",
                                                    fontSize: "0.75rem", cursor: "pointer", padding: "2px 6px"
                                                }}
                                            >
                                                <FaCheck className="me-1" /> Mark read
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

export default Notifications;
