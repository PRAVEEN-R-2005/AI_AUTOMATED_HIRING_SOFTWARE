import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import AppLayout from "../components/layout/AppLayout";
import StatCard from "../components/ui/StatCard";
import { Card, CardContent } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";
import Skeleton from "../components/ui/Skeleton";
import TeamComments from "../components/ui/TeamComments";
import EmptyState from "../components/feedback/EmptyState";
import ErrorState from "../components/feedback/ErrorState";
import {
  FaBriefcase,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaUsers,
  FaSearch,
  FaFileDownload,
  FaUserCircle,
  FaCheck,
  FaTimes,
  FaRobot,
  FaCalendarAlt,
  FaRegClipboard,
  FaFileAlt,
  FaExchangeAlt,
  FaArrowRight,
  FaArrowLeft,
  FaEllipsisV,
  FaFolderOpen
} from "react-icons/fa";

// Canonical stages mapping: Database status -> UI labels
const ATS_STAGES = [
  { id: "Pending", label: "Applied" },
  { id: "Screening", label: "Screening" },
  { id: "Shortlisted", label: "Shortlisted" },
  { id: "Interview", label: "Interview" },
  { id: "Hired", label: "Hired" },
  { id: "Rejected", label: "Rejected" }
];

function Applications() {
  const location = useLocation();
  const navigate = useNavigate();

  // Selected job from router redirect (e.g. from Jobs screen)
  const initialJob = location.state?.job || null;
  const initialJobId = initialJob?.id || initialJob?.jd_id || "All";

  // State
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [filterJobId, setFilterJobId] = useState(initialJobId);
  const [sortBy, setSortBy] = useState("newest"); // newest, oldest, score-desc
  const [viewMode, setViewMode] = useState("kanban"); // kanban or list

  // Selected candidate profile modal state
  const [selectedApp, setSelectedApp] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // overview, resume, notes, ai, timeline

  // Recruiter notes update state
  const [notesText, setNotesText] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);

  // Rejection Reason modal state
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReasonText, setRejectionReasonText] = useState("");
  const [rejectingAppId, setRejectingAppId] = useState(null);
  const [rejectingAction, setRejectingAction] = useState(false);

  // AI Score generation state
  const [runningAI, setRunningAI] = useState(false);
  const [updatingStageId, setUpdatingStageId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      const [jobsRes, appsRes, actRes] = await Promise.all([
        api.get("/api/job-descriptions"),
        api.get("/api/applications/all"),
        api.get("/api/hr/activities")
      ]);
      setJobs(jobsRes.data || []);
      setApplications(appsRes.data || []);
      setActivities(actRes.data || []);

      // If initial job was passed, sync selector
      if (initialJobId !== "All") {
        setFilterJobId(initialJobId);
      }
    } catch (err) {
      console.warn("Failed to fetch applications:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update selected candidate details if list updates locally
  useEffect(() => {
    if (selectedApp) {
      const updated = applications.find(a => a.id === selectedApp.id);
      if (updated) {
        setSelectedApp(updated);
        setNotesText(updated.recruiter_notes || "");
      }
    }
  }, [applications]);

  // Recruiter stage movement action
  const handleMoveStage = async (id, targetStatus) => {
    setUpdatingStageId(id);
    try {
      const res = await api.put(`/api/applications/status/${id}`, { status: targetStatus });
      alert(`Application updated: status set to ${targetStatus}`);

      // Refresh lists
      const [appsRes, actRes] = await Promise.all([
        api.get("/api/applications/all"),
        api.get("/api/hr/activities")
      ]);
      setApplications(appsRes.data || []);
      setActivities(actRes.data || []);
    } catch (err) {
      alert("Failed to update status stage. Validate transition criteria.");
    } finally {
      setUpdatingStageId(null);
    }
  };

  const triggerReject = (id) => {
    setRejectingAppId(id);
    setRejectionReasonText("");
    setRejectOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectingAppId) return;
    setRejectingAction(true);
    try {
      await api.put(`/api/applications/reject/${rejectingAppId}`, { reason: rejectionReasonText.trim() });
      alert("Candidate Rejected");
      setRejectOpen(false);
      loadData();
    } catch (err) {
      alert("Rejection failed");
    } finally {
      setRejectingAction(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedApp) return;
    setNotesSaving(true);
    try {
      await api.put(`/api/applications/notes/${selectedApp.id}`, { notes: notesText.trim() });
      alert("Recruiter Notes Updated");
      loadData();
    } catch (err) {
      alert("Failed to update notes");
    } finally {
      setNotesSaving(false);
    }
  };

  const handleRunAI = async (id) => {
    setRunningAI(true);
    try {
      await api.put(`/api/ai/run/${id}`);
      alert("AI Screening Complete! Compatibility score generated.");
      loadData();
    } catch (err) {
      alert("AI screening execution failed");
    } finally {
      setRunningAI(false);
    }
  };

  // Helper Stats Calculation
  const getStats = () => {
    const total = applications.length;
    const pending = applications.filter(a => a.status === "Pending").length;
    const screening = applications.filter(a => a.status === "Screening").length;
    const shortlisted = applications.filter(a => a.status === "Shortlisted").length;
    const interview = applications.filter(a => a.status === "Interview").length;
    const hired = applications.filter(a => a.status === "Hired").length;
    return { total, pending, screening, shortlisted, interview, hired };
  };

  const statsObj = getStats();

  // Search & Filters Logic
  const getFilteredApps = () => {
    let result = [...applications];

    // Search query
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        a =>
          a.candidate_name?.toLowerCase().includes(query) ||
          a.email?.toLowerCase().includes(query) ||
          a.job_title?.toLowerCase().includes(query)
      );
    }

    // Job filter
    if (filterJobId !== "All") {
      result = result.filter(a => Number(a.job_id) === Number(filterJobId));
    }

    // Sorting within stages/lists
    result.sort((a, b) => {
      if (sortBy === "newest") return b.id - a.id;
      if (sortBy === "oldest") return a.id - b.id;
      if (sortBy === "score-desc") return (b.match_score || 0) - (a.match_score || 0);
      return 0;
    });

    return result;
  };

  const filteredApps = getFilteredApps();

  // Status Badge Mapper
  const getStatusBadge = (status) => {
    if (status === "Shortlisted") return <Badge variant="success">Shortlisted</Badge>;
    if (status === "Rejected") return <Badge variant="danger">Rejected</Badge>;
    if (status === "Interview") return <Badge variant="info">Interview Scheduled</Badge>;
    if (status === "Hired") return <Badge variant="success">Hired</Badge>;
    if (status === "Screening") return <Badge variant="info">Screening</Badge>;
    return <Badge variant="warning">Applied</Badge>;
  };

  // Score Badge Mapper
  const getScoreBadge = (score) => {
    if (!score && score !== 0) return <Badge variant="secondary">N/A</Badge>;
    if (score >= 80) return <Badge variant="success">{score}% Match</Badge>;
    if (score >= 60) return <Badge variant="info">{score}% Match</Badge>;
    return <Badge variant="danger">{score}% Match</Badge>;
  };

  const handleViewDetails = (app) => {
    setSelectedApp(app);
    setNotesText(app.recruiter_notes || "");
    setActiveTab("overview");
    setProfileOpen(true);
  };

  // Get activities related to the selected candidate
  const getCandidateActivities = (id) => {
    return activities.filter(act => Number(act.application_id) === Number(id));
  };

  const selectedJob = jobs.find(j => Number(j.jd_id) === Number(filterJobId));

  return (
    <AppLayout>
      <div className="container-fluid px-0 text-white text-start">

        {/* HEADER */}
        <div className="mb-4">
          <h2 className="fw-bold mb-1" style={{ color: "var(--text-primary)" }}>Recruitment Pipeline</h2>
          <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
            Monitor and manage candidate applications through sequential Kanban stages.
          </p>
          <div className="alert border border-warning border-opacity-15 bg-warning bg-opacity-5 p-2.5 mt-2 mb-0 d-flex align-items-center gap-2" style={{ fontSize: "0.85rem" }}>
            <FaRobot className="text-warning-light" />
            <span className="text-muted">
              Explainable AI Screening Notice: AI suitability fits act as decision support tools. Stage movements are driven by human recruiter reviews.
            </span>
          </div>
        </div>

        {/* STATISTICS SUMMARY */}
        <div className="row g-3 mb-4">
          <div className="col-4 col-md-2">
            <StatCard title="Applied" value={statsObj.pending} loading={loading} style={{ padding: "0.75rem" }} />
          </div>
          <div className="col-4 col-md-2">
            <StatCard title="Screening" value={statsObj.screening} loading={loading} />
          </div>
          <div className="col-4 col-md-2">
            <StatCard title="Shortlisted" value={statsObj.shortlisted} loading={loading} />
          </div>
          <div className="col-4 col-md-2">
            <StatCard title="Interviews" value={statsObj.interview} loading={loading} />
          </div>
          <div className="col-4 col-md-2">
            <StatCard title="Hired" value={statsObj.hired} loading={loading} />
          </div>
          <div className="col-4 col-md-2">
            <StatCard title="Total Files" value={statsObj.total} loading={loading} />
          </div>
        </div>

        {/* MANAGEMENT TOOLBAR */}
        <Card className="surface-custom border-custom mb-4">
          <CardContent className="p-3 d-flex flex-column flex-md-row gap-3 align-items-center justify-content-between">
            <div className="d-flex flex-wrap gap-2 align-items-center w-100" style={{ maxWidth: "550px" }}>
              <div className="position-relative flex-grow-1" style={{ minWidth: "220px" }}>
                <FaSearch className="position-absolute text-muted" style={{ left: "12px", top: "14px" }} />
                <input
                  type="text"
                  className="form-control ps-5"
                  placeholder="Search candidates, positions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div style={{ minWidth: "180px" }}>
                <Select
                  value={filterJobId}
                  onChange={(e) => setFilterJobId(e.target.value)}
                  options={[
                    { value: "All", label: "All Job Requisitions" },
                    ...jobs.map(j => ({ value: j.jd_id, label: j.title }))
                  ]}
                  className="mb-0"
                />
              </div>
            </div>

            <div className="d-flex align-items-center gap-3">
              <div style={{ minWidth: "135px" }}>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  options={[
                    { value: "newest", label: "Newest Applied" },
                    { value: "oldest", label: "Oldest Applied" },
                    { value: "score-desc", label: "AI Score High" }
                  ]}
                  className="mb-0"
                />
              </div>

              {/* View toggle tabs */}
              <div className="btn-group border border-secondary border-opacity-10 rounded">
                <button
                  type="button"
                  className={`btn btn-sm px-3 ${viewMode === "kanban" ? "bg-primary text-white" : "text-muted bg-transparent"}`}
                  onClick={() => setViewMode("kanban")}
                  style={{ border: "none" }}
                >
                  Kanban Board
                </button>
                <button
                  type="button"
                  className={`btn btn-sm px-3 ${viewMode === "list" ? "bg-primary text-white" : "text-muted bg-transparent"}`}
                  onClick={() => setViewMode("list")}
                  style={{ border: "none" }}
                >
                  Tabular Index
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* LOADING & DATA DISPLAYS */}
        {loading ? (
          <div className="row g-3">
            {[...Array(4).keys()].map(i => (
              <div className="col" key={i}><Skeleton variant="rect" width="100%" height={300} /></div>
            ))}
          </div>
        ) : error ? (
          <ErrorState title="Failed to load pipeline datasets" onRetry={loadData} />
        ) : viewMode === "kanban" ? (

          /* KANBAN HORIZONTAL COLS */
          <div className="d-flex gap-3 overflow-x-auto pb-4" style={{ minHeight: "500px", scrollbarWidth: "thin" }}>
            {ATS_STAGES.map(stage => {
              const stageApps = filteredApps.filter(app => app.status === stage.id);
              return (
                <div
                  key={stage.id}
                  className="kanban-column p-3 rounded d-flex flex-column gap-3"
                  style={{
                    minWidth: "280px",
                    maxWidth: "280px",
                    backgroundColor: "rgba(15, 23, 42, 0.4)",
                    border: "1px solid var(--border)"
                  }}
                >
                  {/* Column Header */}
                  <div className="d-flex justify-content-between align-items-center border-bottom pb-2" style={{ borderColor: "var(--border)" }}>
                    <div className="fw-bold text-white d-flex align-items-center gap-2">
                      <span style={{ fontSize: "0.95rem" }}>{stage.label}</span>
                      <Badge variant="secondary">{stageApps.length}</Badge>
                    </div>
                  </div>

                  {/* Stage Cards scroll box */}
                  <div className="d-flex flex-column gap-2.5 overflow-y-auto flex-grow-1" style={{ maxHeight: "400px", scrollbarWidth: "none" }}>
                    {stageApps.length === 0 ? (
                      <div className="py-5 text-center text-muted small d-flex flex-column align-items-center gap-2">
                        <FaFolderOpen size={24} className="text-secondary opacity-30" />
                        <span>No candidates in stage</span>
                      </div>
                    ) : (
                      stageApps.map(app => (
                        <Card
                          key={app.id}
                          className={`border-custom shadow-sm transition-all ${updatingStageId === app.id ? "opacity-50" : ""}`}
                          style={{ backgroundColor: "rgba(30, 41, 59, 0.4)" }}
                        >
                          <CardContent className="p-3 d-flex flex-column gap-2 text-start">
                            <div className="d-flex justify-content-between align-items-start gap-1">
                              <div>
                                <div className="fw-bold text-white" style={{ fontSize: "0.88rem" }}>{app.candidate_name}</div>
                                <small className="text-muted" style={{ fontSize: "0.75rem" }}>{app.email}</small>
                              </div>
                              {getScoreBadge(app.match_score)}
                            </div>

                            <small className="text-muted d-block" style={{ fontSize: "0.75rem" }}>
                              Posting: {app.job_title}
                            </small>

                            {/* Card stage navigation footer */}
                            <div className="d-flex justify-content-between align-items-center mt-1 border-top pt-2" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                              <Button variant="ghost" size="sm" className="p-0 text-muted" onClick={() => handleViewDetails(app)}>
                                Quick View
                              </Button>

                              <div className="d-inline-flex gap-1 align-items-center">
                                {/* Back/Forward buttons based on stage index */}
                                {stage.id !== "Pending" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="p-1"
                                    title="Move Stage Backward"
                                    onClick={() => {
                                      const prevIdx = ATS_STAGES.findIndex(s => s.id === stage.id) - 1;
                                      if (prevIdx >= 0) handleMoveStage(app.id, ATS_STAGES[prevIdx].id);
                                    }}
                                  >
                                    <FaArrowLeft size={10} />
                                  </Button>
                                )}

                                {stage.id !== "Hired" && stage.id !== "Rejected" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="p-1"
                                    title="Move Stage Forward"
                                    onClick={() => {
                                      const nextIdx = ATS_STAGES.findIndex(s => s.id === stage.id) + 1;
                                      if (nextIdx < ATS_STAGES.length) handleMoveStage(app.id, ATS_STAGES[nextIdx].id);
                                    }}
                                  >
                                    <FaArrowRight size={10} />
                                  </Button>
                                )}

                                {stage.id !== "Rejected" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="p-1 text-danger"
                                    title="Reject Application"
                                    onClick={() => triggerReject(app.id)}
                                  >
                                    <FaTimes size={10} />
                                  </Button>
                                )}
                              </div>
                            </div>

                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        ) : (

          /* TABULAR INDEX VIEW */
          <Card className="surface-custom border-custom">
            <CardContent className="p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Applied Position</th>
                      <th>Applied Date</th>
                      <th>AI Score</th>
                      <th>Status Stage</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApps.map((app) => (
                      <tr key={app.id}>
                        <td>
                          <div className="fw-bold text-white">{app.candidate_name}</div>
                          <small className="text-muted">{app.email}</small>
                        </td>
                        <td>{app.job_title}</td>
                        <td>{new Date(app.created_at).toLocaleDateString()}</td>
                        <td>{getScoreBadge(app.match_score)}</td>
                        <td>{getStatusBadge(app.status)}</td>
                        <td className="text-end">
                          <Button variant="ghost" size="sm" onClick={() => handleViewDetails(app)}>
                            Evaluate Profile
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CANDIDATE PIPELINE QUICK-VIEW MODAL */}
        {profileOpen && selectedApp && (
          <Modal
            isOpen={profileOpen}
            onClose={() => setProfileOpen(false)}
            title="Candidate Requisition Summary"
            size="lg"
            footer={
              <div className="d-flex justify-content-between w-100">
                <div className="d-flex gap-2">
                  <Button variant="ghost" onClick={() => setProfileOpen(false)}>Close Drawer</Button>
                  <Button variant="ghost" className="d-flex align-items-center gap-1.5 text-info" onClick={() => navigate("/interviews", { state: { candidate: selectedApp } })}>
                    <FaCalendarAlt /> Schedule Interview
                  </Button>
                </div>
                <div className="d-flex gap-2">
                  {selectedApp.status !== "Rejected" && (
                    <Button variant="destructive" className="d-flex align-items-center gap-1.5" onClick={() => triggerReject(selectedApp.id)}>
                      <FaTimes size={12} /> Reject Application
                    </Button>
                  )}
                  {selectedApp.status !== "Hired" && (
                    <Button variant="primary" className="d-flex align-items-center gap-1.5" onClick={() => handleMoveStage(selectedApp.id, "Hired")}>
                      <FaCheck size={12} /> Confirm Hiring
                    </Button>
                  )}
                </div>
              </div>
            }
          >
            <div className="d-flex flex-column gap-3 text-white text-start">

              {/* Header profile info */}
              <div className="d-flex align-items-center gap-3">
                <FaUserCircle size={56} className="text-secondary" />
                <div>
                  <h4 className="fw-bold mb-1 text-primary">{selectedApp.candidate_name}</h4>
                  <div className="d-flex flex-wrap gap-2 text-muted" style={{ fontSize: "0.85rem" }}>
                    <span>Email: {selectedApp.email}</span>
                    <span>•</span>
                    <span>Phone: {selectedApp.phone || "No phone added"}</span>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="d-flex border-bottom mb-2" style={{ borderColor: "var(--border)" }}>
                {[
                  { id: "overview", label: "Overview" },
                  { id: "resume", label: "Resume File" },
                  { id: "ai", label: "AI Screen insights" },
                  { id: "notes", label: "Internal Notes" },
                  { id: "timeline", label: "Activity Timeline" }
                ].map(tab => (
                  <button
                    key={tab.id}
                    className={`btn py-2 px-3 border-0 rounded-0 fw-semibold`}
                    style={{
                      color: activeTab === tab.id ? "var(--primary-light)" : "var(--text-secondary)",
                      borderBottom: activeTab === tab.id ? "2px solid var(--primary-light)" : "none",
                      backgroundColor: "transparent"
                    }}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB CONTEXT PANEL */}
              {activeTab === "overview" && (
                <div className="d-flex flex-column gap-3 py-1">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <span className="text-muted d-block mb-1" style={{ fontSize: "0.8rem" }}>Applied Opening</span>
                      <strong>{selectedApp.job_title || "Not specified"}</strong>
                    </div>
                    <div className="col-md-6">
                      <span className="text-muted d-block mb-1" style={{ fontSize: "0.8rem" }}>Application Status</span>
                      <div>{getStatusBadge(selectedApp.status)}</div>
                    </div>
                  </div>

                  {selectedApp.rejection_reason && (
                    <Card className="border border-danger border-opacity-20 bg-danger bg-opacity-5">
                      <CardContent className="p-3">
                        <span className="text-danger fw-semibold d-block mb-1" style={{ fontSize: "0.8rem" }}>Rejection Reason Logged:</span>
                        <p className="text-muted mb-0" style={{ fontSize: "0.88rem" }}>{selectedApp.rejection_reason}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {activeTab === "resume" && (
                <div className="py-2 d-flex flex-column align-items-start gap-2">
                  <span className="text-muted" style={{ fontSize: "0.88rem" }}>Associated Resume File:</span>
                  <div className="d-flex align-items-center gap-2 bg-dark bg-opacity-25 border p-3 rounded w-100" style={{ borderColor: "var(--border)" }}>
                    <FaFileAlt size={24} className="text-primary-light" />
                    <div className="flex-grow-1">
                      <div className="fw-bold" style={{ fontSize: "0.9rem" }}>{selectedApp.resume_file || "resume.pdf"}</div>
                      <small className="text-muted">Uploaded on: {new Date(selectedApp.created_at).toLocaleDateString()}</small>
                    </div>
                    {selectedApp.resume_file && (
                      <a
                        href={`${api.defaults.baseURL || ""}/uploads/${selectedApp.resume_file}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary d-flex align-items-center gap-2"
                        style={{ textDecoration: "none" }}
                      >
                        <FaFileDownload /> View PDF
                      </a>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "ai" && (
                <div className="py-1 d-flex flex-column gap-3 text-start">
                  <div className="d-flex align-items-center gap-2">
                    <FaRobot className="text-primary-light" size={20} />
                    <h6 className="fw-semibold mb-0">AI Screen Assessment fit</h6>
                  </div>

                  {selectedApp.match_score === null ? (
                    <div className="text-center py-4 text-muted bg-dark bg-opacity-25 rounded border border-secondary border-opacity-10">
                      No AI analysis results available for this applicant. Run screening from the AI Screening tab to generate metrics.
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {/* Overall Fit */}
                      <div className="d-flex align-items-center justify-content-between p-3 bg-dark bg-opacity-25 border rounded border-secondary border-opacity-10">
                        <div>
                          <div className="fw-bold text-primary" style={{ fontSize: "1.1rem" }}>Compatibility: {selectedApp.match_score}% Fit</div>
                          <small className="text-muted">Recommendation: {selectedApp.recommendation || "Under Review"}</small>
                        </div>
                        <div className={`h5 mb-0 fw-bold text-${selectedApp.match_score >= 75 ? "success" : "warning"}`}>
                          {selectedApp.match_score >= 75 ? "Strong Match" : "Potential Match"}
                        </div>
                      </div>

                      {/* Component breakdowns */}
                      <div className="row g-3">
                        <div className="col-4">
                          <small className="text-muted d-block" style={{ fontSize: "0.75rem" }}>Skills Fit</small>
                          <strong className="text-white">{selectedApp.skills_score || 0}%</strong>
                          <div className="progress mt-1" style={{ height: "4px" }}>
                            <div className="progress-bar bg-info" style={{ width: `${selectedApp.skills_score || 0}%` }}></div>
                          </div>
                        </div>
                        <div className="col-4">
                          <small className="text-muted d-block" style={{ fontSize: "0.75rem" }}>Exp Alignment</small>
                          <strong className="text-white">{selectedApp.experience_score || 0}%</strong>
                          <div className="progress mt-1" style={{ height: "4px" }}>
                            <div className="progress-bar bg-success" style={{ width: `${selectedApp.experience_score || 0}%` }}></div>
                          </div>
                        </div>
                        <div className="col-4">
                          <small className="text-muted d-block" style={{ fontSize: "0.75rem" }}>Education Fit</small>
                          <strong className="text-white">{selectedApp.education_score || 0}%</strong>
                          <div className="progress mt-1" style={{ height: "4px" }}>
                            <div className="progress-bar bg-primary" style={{ width: `${selectedApp.education_score || 0}%` }}></div>
                          </div>
                        </div>
                      </div>

                      {/* Skills lists */}
                      <div className="row g-2 mt-1">
                        <div className="col-md-6">
                          <small className="text-muted d-block mb-1">Matched Skills</small>
                          <div className="d-flex flex-wrap gap-1">
                            {selectedApp.matched_skills ? (
                              selectedApp.matched_skills.split(",").map((s, i) => (
                                <Badge key={i} variant="success" style={{ fontSize: "0.7rem", padding: "3px 6px" }}>{s.trim()}</Badge>
                              ))
                            ) : (
                              <span className="text-muted small">None matched</span>
                            )}
                          </div>
                        </div>
                        <div className="col-md-6">
                          <small className="text-muted d-block mb-1">Missing Gaps</small>
                          <div className="d-flex flex-wrap gap-1">
                            {selectedApp.missing_skills ? (
                              selectedApp.missing_skills.split(",").map((s, i) => (
                                <Badge key={i} variant="danger" style={{ fontSize: "0.7rem", padding: "3px 6px" }}>{s.trim()}</Badge>
                              ))
                            ) : (
                              <span className="text-muted small">None missing</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* AI Assisted Summary */}
                      {selectedApp.ai_summary && (
                        <div className="p-3 bg-dark bg-opacity-25 rounded border border-secondary border-opacity-10" style={{ fontSize: "0.85rem" }}>
                          <div className="fw-semibold text-secondary-custom mb-1">AI Screening Summary:</div>
                          <p className="text-muted mb-0" style={{ lineHeight: 1.5 }}>{selectedApp.ai_summary}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "notes" && (
                <div className="py-1 d-flex flex-column gap-3">
                  <div>
                    <label htmlFor="notesTextAppK" className="form-label-custom mb-1">Recruiter Notes (Internal only)</label>
                    <textarea
                      id="notesTextAppK"
                      className="form-control"
                      rows="3"
                      placeholder="Add assessment updates, pipeline schedules, or interviewer comments here..."
                      value={notesText}
                      onChange={(e) => setNotesText(e.target.value)}
                    />
                    <div className="d-flex justify-content-end mt-2">
                      <Button variant="primary" loading={notesSaving} onClick={handleSaveNotes}>
                        Save Notes
                      </Button>
                    </div>
                  </div>
                  <hr style={{ borderColor: "var(--border)", opacity: 0.2 }} />
                  <TeamComments resourceType="application" resourceId={selectedApp.id} />
                </div>
              )}

              {activeTab === "timeline" && (
                <div className="py-1 d-flex flex-column gap-3">
                  <h6 className="fw-semibold text-secondary-custom mb-1">Application State History Log</h6>
                  {getCandidateActivities(selectedApp.id).length === 0 ? (
                    <div className="text-muted small py-3">No activity logs recorded yet. Move candidates between stages to generate timeline entries.</div>
                  ) : (
                    <div className="position-relative ps-4 border-start border-secondary border-opacity-25" style={{ minHeight: "100px" }}>
                      {getCandidateActivities(selectedApp.id).map((act, index) => (
                        <div key={act.id} className="position-relative mb-4">
                          <div className="position-absolute rounded-circle bg-primary-light" style={{ width: "10px", height: "10px", left: "-29px", top: "5px" }}></div>
                          <div className="fw-bold text-white" style={{ fontSize: "0.88rem" }}>{act.action}</div>
                          <p className="text-muted mb-1" style={{ fontSize: "0.85rem" }}>{act.details}</p>
                          <small className="text-muted" style={{ fontSize: "0.75rem" }}>{new Date(act.created_at).toLocaleString()}</small>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </Modal>
        )}

        {/* REJECTION CONFIRM DIALOG */}
        {rejectOpen && (
          <Modal
            isOpen={rejectOpen}
            onClose={() => setRejectOpen(false)}
            title="Log Rejection Reason"
            size="sm"
            footer={
              <>
                <Button variant="ghost" onClick={() => setRejectOpen(false)}>Cancel</Button>
                <Button variant="destructive" loading={rejectingAction} onClick={handleConfirmReject}>
                  Reject Candidate
                </Button>
              </>
            }
          >
            <div className="text-start">
              <p className="text-muted mb-3" style={{ fontSize: "0.9rem" }}>
                Enter the reason for rejecting this candidate. (Rejection reasons are logged for recruitment tracking).
              </p>
              <label htmlFor="rejectionReasonAppK" className="form-label-custom mb-1">Rejection Reason</label>
              <textarea
                id="rejectionReasonAppK"
                className="form-control"
                rows="3"
                placeholder="e.g. Lacks required technical skills"
                value={rejectionReasonText}
                onChange={(e) => setRejectionReasonText(e.target.value)}
              />
            </div>
          </Modal>
        )}

      </div>
    </AppLayout>
  );
}

export default Applications;
