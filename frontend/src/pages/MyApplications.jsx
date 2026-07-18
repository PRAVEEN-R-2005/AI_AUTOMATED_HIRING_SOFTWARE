import { useEffect, useState } from "react";
import api from "../services/api";
import AppLayout from "../components/layout/AppLayout";
import Badge from "../components/ui/Badge";
import { FaFileAlt, FaCheckCircle, FaSearch, FaEye } from "react-icons/fa";

const PIPELINE_STAGES = ["Pending", "Screening", "Shortlisted", "Interview", "Hired"];

function MyApplications() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const email = localStorage.getItem("email") || "";

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const response = await api.get(`/api/applications/email/${email}`);
                setTimeout(() => { setApplications(response.data || []); setLoading(false); }, 0);
            } catch {
                const demoData = [
                    { id: 1, candidate_name: "Candidate User", job_id: 1, resume_file: "demo.pdf", status: "Shortlisted", match_score: 82, created_at: "2026-07-01T10:00:00Z" },
                    { id: 2, candidate_name: "Candidate User", job_id: 2, resume_file: "demo2.pdf", status: "Pending", match_score: null, created_at: "2026-07-05T14:30:00Z" },
                    { id: 3, candidate_name: "Candidate User", job_id: 3, resume_file: "demo3.pdf", status: "Interview", match_score: 91, created_at: "2026-06-28T09:00:00Z" }
                ];
                setTimeout(() => { setApplications(demoData); setLoading(false); }, 0);
            }
        };
        fetchApplications();
    }, [email]);

    const getStatusVariant = (status) => {
        const map = { Pending: "warning", Screening: "info", Shortlisted: "primary", Interview: "info", Hired: "success", Rejected: "danger" };
        return map[status] || "secondary";
    };

    const getStatusColor = (status) => {
        const map = {
            Pending: "#f59e0b", Screening: "#3b82f6", Shortlisted: "#6366f1",
            Interview: "#06b6d4", Hired: "#10b981", Rejected: "#ef4444"
        };
        return map[status] || "#64748b";
    };

    const getStageIndex = (status) => {
        if (status === "Rejected") return -1;
        return PIPELINE_STAGES.indexOf(status);
    };

    const filtered = applications.filter(app => {
        const q = searchQuery.toLowerCase();
        const matchSearch = !q || app.candidate_name?.toLowerCase().includes(q) || String(app.job_id).includes(q);
        const matchStatus = !statusFilter || app.status === statusFilter;
        return matchSearch && matchStatus;
    });

    return (
        <AppLayout>
            <div className="container-fluid px-0">
                {/* Header */}
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
                    <div>
                        <h2 className="fw-bold mb-1" style={{ fontFamily: "var(--font-sans)", color: "var(--text-primary)" }}>
                            My Applications
                        </h2>
                        <p className="mb-0" style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                            {applications.length} total application{applications.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="card-custom surface-custom border-custom p-3 mb-4" style={{ borderRadius: "var(--radius-md)" }}>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <div className="position-relative">
                                <FaSearch style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)", fontSize: "0.85rem" }} />
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search applications…"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{
                                        background: "var(--background)", color: "var(--text-primary)",
                                        border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
                                        padding: "10px 14px 10px 36px", fontSize: "0.9rem"
                                    }}
                                />
                            </div>
                        </div>
                        <div className="col-md-3">
                            <select
                                className="form-select"
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                style={{
                                    background: "var(--background)", color: "var(--text-primary)",
                                    border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
                                    padding: "10px 14px", fontSize: "0.9rem"
                                }}
                            >
                                <option value="">All Statuses</option>
                                {[...PIPELINE_STAGES, "Rejected"].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Application Cards */}
                {loading ? (
                    <div className="text-center py-5" style={{ color: "var(--text-secondary)" }}>Loading applications…</div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-5">
                        <FaFileAlt size={48} style={{ color: "var(--text-secondary)", opacity: 0.3, marginBottom: 16 }} />
                        <h5 style={{ color: "var(--text-secondary)" }}>No applications found</h5>
                        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                            {applications.length === 0 ? "Start applying to open positions!" : "Try adjusting your filters."}
                        </p>
                    </div>
                ) : (
                    <div className="d-flex flex-column gap-3">
                        {filtered.map((app, index) => {
                            const stageIdx = getStageIndex(app.status);
                            const isRejected = app.status === "Rejected";

                            return (
                                <div
                                    key={app.id || `app-fallback-${index}`}
                                    className="card-custom surface-custom border-custom p-4"
                                    style={{
                                        borderRadius: "var(--radius-md)",
                                        borderLeft: `4px solid ${getStatusColor(app.status)}`,
                                        transition: "transform 0.2s ease"
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = "translateX(4px)"}
                                    onMouseLeave={e => e.currentTarget.style.transform = "translateX(0)"}
                                >
                                    {/* Top Row: Info + Badge */}
                                    <div className="d-flex flex-wrap justify-content-between align-items-start mb-3 gap-2">
                                        <div>
                                            <h6 className="fw-bold mb-1" style={{ color: "var(--text-primary)", fontSize: "1rem" }}>
                                                Application #{app.id}
                                            </h6>
                                            <div className="d-flex flex-wrap gap-3" style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                                <span>Job ID: #{app.job_id}</span>
                                                {app.match_score && <span>AI Score: <strong style={{ color: app.match_score >= 70 ? "#10b981" : "#f59e0b" }}>{app.match_score}%</strong></span>}
                                                {app.created_at && <span>Applied: {new Date(app.created_at).toLocaleDateString()}</span>}
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            <Badge variant={getStatusVariant(app.status)}>{app.status}</Badge>
                                            {app.resume_file && (
                                                <a
                                                    href={`${api.defaults.baseURL}/uploads/resumes/${app.resume_file}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="btn-custom btn-custom-ghost p-1"
                                                    style={{ border: "none", background: "transparent", color: "var(--primary)", fontSize: "0.9rem" }}
                                                    title="View Resume"
                                                >
                                                    <FaEye />
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Pipeline Timeline */}
                                    <div className="d-flex align-items-center gap-0" style={{ overflowX: "auto", paddingBottom: 4 }}>
                                        {PIPELINE_STAGES.map((stage, i) => {
                                            const isCompleted = !isRejected && i <= stageIdx;
                                            const isCurrent = !isRejected && i === stageIdx;
                                            const dotColor = isCompleted ? getStatusColor(stage) : "var(--border)";

                                            return (
                                                <div key={stage} className="d-flex align-items-center" style={{ flexShrink: 0 }}>
                                                    <div className="d-flex flex-column align-items-center" style={{ minWidth: 70 }}>
                                                        <div style={{
                                                            width: isCurrent ? 30 : 22, height: isCurrent ? 30 : 22,
                                                            borderRadius: "50%",
                                                            background: isCompleted ? dotColor : "transparent",
                                                            border: isCompleted ? "none" : `2px solid var(--border)`,
                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                            transition: "all 0.3s ease",
                                                            boxShadow: isCurrent ? `0 0 0 4px ${dotColor}33` : "none"
                                                        }}>
                                                            {isCompleted && <FaCheckCircle style={{ color: "#fff", fontSize: isCurrent ? "0.75rem" : "0.6rem" }} />}
                                                        </div>
                                                        <span style={{
                                                            fontSize: "0.65rem", marginTop: 4,
                                                            color: isCompleted ? "var(--text-primary)" : "var(--text-secondary)",
                                                            fontWeight: isCurrent ? 700 : 400
                                                        }}>
                                                            {stage}
                                                        </span>
                                                    </div>
                                                    {i < PIPELINE_STAGES.length - 1 && (
                                                        <div style={{
                                                            width: 30, height: 2,
                                                            background: (!isRejected && i < stageIdx) ? getStatusColor(PIPELINE_STAGES[i + 1]) : "var(--border)",
                                                            marginBottom: 16
                                                        }} />
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {isRejected && (
                                            <div className="d-flex flex-column align-items-center ms-3" style={{ minWidth: 70 }}>
                                                <div style={{
                                                    width: 30, height: 30, borderRadius: "50%",
                                                    background: "#ef4444",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    boxShadow: "0 0 0 4px rgba(239,68,68,0.2)"
                                                }}>
                                                    <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.8rem" }}>✕</span>
                                                </div>
                                                <span style={{ fontSize: "0.65rem", marginTop: 4, color: "#ef4444", fontWeight: 700 }}>
                                                    Rejected
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

export default MyApplications;