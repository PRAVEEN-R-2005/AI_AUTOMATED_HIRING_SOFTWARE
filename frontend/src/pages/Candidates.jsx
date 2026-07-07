import React, { useEffect, useState } from "react";
import api from "../services/api";
import AppLayout from "../components/layout/AppLayout";
import StatCard from "../components/ui/StatCard";
import { Card, CardContent } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/feedback/EmptyState";
import ErrorState from "../components/feedback/ErrorState";
import {
  FaUsers,
  FaSearch,
  FaFileDownload,
  FaUserCircle,
  FaBriefcase,
  FaMapMarkerAlt,
  FaRegClipboard,
  FaRobot,
  FaTrophy,
  FaCheck,
  FaTimes,
  FaChevronRight,
  FaCheckCircle,
  FaTimesCircle
} from "react-icons/fa";

function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Search, Filters & Sorting
  const [search, setSearch] = useState("");
  const [filterJob, setFilterJob] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterScore, setFilterScore] = useState("All"); // All, High(>=80), Mid(60-79), Low(<60)
  const [sortBy, setSortBy] = useState("newest"); // newest, oldest, score-desc, score-asc

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected candidate for Profile Drawer
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // overview, resume, notes, ai

  // Recruiter notes update state
  const [notesText, setNotesText] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);

  // Rejection reason state
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReasonText, setRejectionReasonText] = useState("");
  const [rejectingAction, setRejectingAction] = useState(false);

  const fetchCandidates = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await api.get("/api/hr/all-candidates");
      setCandidates(response.data || []);
    } catch (err) {
      console.warn("Failed to fetch candidates:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  // Update selected candidate details if candidate changes locally
  useEffect(() => {
    if (selectedCandidate) {
      const updated = candidates.find(c => c.id === selectedCandidate.id);
      if (updated) {
        setSelectedCandidate(updated);
        setNotesText(updated.recruiter_notes || "");
      }
    }
  }, [candidates]);

  // Recruiter action handlers
  const handleSaveNotes = async () => {
    if (!selectedCandidate) return;
    setNotesSaving(true);
    try {
      await api.put(`/api/applications/notes/${selectedCandidate.id}`, { notes: notesText.trim() });
      alert("Recruiter Notes Updated successfully");
      fetchCandidates();
    } catch (err) {
      alert("Failed to update notes");
    } finally {
      setNotesSaving(false);
    }
  };

  const handleShortlist = async (id) => {
    try {
      await api.put(`/api/applications/shortlist/${id}`);
      alert("Candidate Shortlisted");
      fetchCandidates();
    } catch (err) {
      alert("Shortlisting failed");
    }
  };

  const triggerReject = () => {
    setRejectionReasonText("");
    setRejectOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedCandidate) return;
    setRejectingAction(true);
    try {
      await api.put(`/api/applications/reject/${selectedCandidate.id}`, { reason: rejectionReasonText.trim() });
      alert("Candidate Rejected");
      setRejectOpen(false);
      fetchCandidates();
    } catch (err) {
      alert("Rejection failed");
    } finally {
      setRejectingAction(false);
    }
  };

  // Helper Stats calculations
  const getStats = () => {
    const total = candidates.length;
    const shortlisted = candidates.filter(c => c.status === "Shortlisted").length;
    const review = candidates.filter(c => c.status === "Pending" || c.status === "Under Review").length;
    const rejected = candidates.filter(c => c.status === "Rejected").length;
    return { total, shortlisted, review, rejected };
  };

  const statsObj = getStats();

  // Search & Filter Pipeline
  const getFilteredCandidates = () => {
    let result = [...candidates];

    // Search
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        c =>
          c.name?.toLowerCase().includes(query) ||
          c.email?.toLowerCase().includes(query) ||
          c.job_title?.toLowerCase().includes(query)
      );
    }

    // Job Filter
    if (filterJob !== "All") {
      result = result.filter(c => c.job_title === filterJob);
    }

    // Status Filter
    if (filterStatus !== "All") {
      result = result.filter(c => c.status === filterStatus);
    }

    // Score Filter
    if (filterScore !== "All") {
      result = result.filter(c => {
        const score = c.match_score || 0;
        if (filterScore === "High") return score >= 80;
        if (filterScore === "Mid") return score >= 60 && score < 80;
        if (filterScore === "Low") return score < 60;
        return true;
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "newest") return b.id - a.id;
      if (sortBy === "oldest") return a.id - b.id;
      if (sortBy === "score-desc") return (b.match_score || 0) - (a.match_score || 0);
      if (sortBy === "score-asc") return (a.match_score || 0) - (b.match_score || 0);
      return 0;
    });

    return result;
  };

  const filtered = getFilteredCandidates();

  // Pagination limits
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const handlePageChange = (n) => {
    setCurrentPage(n);
  };

  // Status Badge Helper
  const getStatusBadge = (status) => {
    if (status === "Shortlisted") return <Badge variant="success">Shortlisted</Badge>;
    if (status === "Rejected") return <Badge variant="danger">Rejected</Badge>;
    if (status === "Interview") return <Badge variant="info">Interviewing</Badge>;
    return <Badge variant="warning">Under Review</Badge>;
  };

  // Fit score badge helper
  const getScoreBadge = (score) => {
    if (!score && score !== 0) return <Badge variant="secondary">N/A</Badge>;
    if (score >= 80) return <Badge variant="success">{score}% Match</Badge>;
    if (score >= 60) return <Badge variant="info">{score}% Match</Badge>;
    return <Badge variant="danger">{score}% Match</Badge>;
  };

  // Get unique jobs list for filter
  const uniqueJobs = ["All", ...new Set(candidates.map(c => c.job_title).filter(Boolean))];

  const handleViewProfile = (candidate) => {
    setSelectedCandidate(candidate);
    setNotesText(candidate.recruiter_notes || "");
    setActiveTab("overview");
    setProfileOpen(true);
  };

  return (
    <AppLayout>
      <div className="container-fluid px-0 text-white">
        
        {/* HEADER */}
        <div className="mb-4">
          <h2 className="fw-bold mb-1" style={{ color: "var(--text-primary)" }}>Candidates</h2>
          <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
            Review, search, and manage candidate suitability and pipeline status.
          </p>
        </div>

        {/* STATISTICS */}
        <div className="row g-4 mb-4">
          <div className="col-6 col-md-3">
            <StatCard title="Total Candidates" value={statsObj.total} icon={<FaUsers />} loading={loading} description="Total applications" />
          </div>
          <div className="col-6 col-md-3">
            <StatCard title="Shortlisted" value={statsObj.shortlisted} icon={<FaCheckCircle />} loading={loading} description="Selected for interviews" />
          </div>
          <div className="col-6 col-md-3">
            <StatCard title="In Review" value={statsObj.review} icon={<FaRegClipboard />} loading={loading} description="Awaiting assessment" />
          </div>
          <div className="col-6 col-md-3">
            <StatCard title="Rejected" value={statsObj.rejected} icon={<FaTimesCircle />} loading={loading} description="Disqualified profiles" />
          </div>
        </div>

        {/* TOOLBAR */}
        <Card className="surface-custom border-custom mb-4">
          <CardContent className="p-3 d-flex flex-column flex-md-row gap-3 align-items-center justify-content-between">
            <div className="position-relative w-100" style={{ maxWidth: "350px" }}>
              <FaSearch className="position-absolute text-muted" style={{ left: "12px", top: "14px" }} />
              <input
                type="text"
                className="form-control ps-5"
                placeholder="Search candidate name, email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>

            <div className="d-flex flex-wrap align-items-center gap-2 w-100 justify-content-md-end">
              <div style={{ minWidth: "130px" }}>
                <Select
                  value={filterJob}
                  onChange={(e) => { setFilterJob(e.target.value); setCurrentPage(1); }}
                  options={uniqueJobs.map(job => ({ value: job, label: job === "All" ? "All Jobs" : job }))}
                  className="mb-0"
                />
              </div>

              <div style={{ minWidth: "120px" }}>
                <Select
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                  options={[
                    { value: "All", label: "All Statuses" },
                    { value: "Pending", label: "Pending" },
                    { value: "Shortlisted", label: "Shortlisted" },
                    { value: "Rejected", label: "Rejected" }
                  ]}
                  className="mb-0"
                />
              </div>

              <div style={{ minWidth: "120px" }}>
                <Select
                  value={filterScore}
                  onChange={(e) => { setFilterScore(e.target.value); setCurrentPage(1); }}
                  options={[
                    { value: "All", label: "All Match Ratios" },
                    { value: "High", label: "High (>=80%)" },
                    { value: "Mid", label: "Mid (60-79%)" },
                    { value: "Low", label: "Low (<60%)" }
                  ]}
                  className="mb-0"
                />
              </div>

              <div style={{ minWidth: "130px" }}>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  options={[
                    { value: "newest", label: "Applied Newest" },
                    { value: "oldest", label: "Applied Oldest" },
                    { value: "score-desc", label: "Score: High to Low" },
                    { value: "score-asc", label: "Score: Low to High" }
                  ]}
                  className="mb-0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CANDIDATES GRID TABLE */}
        {loading ? (
          <Card className="surface-custom border-custom">
            <CardContent className="p-4">
              <Skeleton variant="rect" width="100%" height={30} className="mb-2" />
              <Skeleton variant="rect" width="100%" height={50} className="mb-2" />
              <Skeleton variant="rect" width="100%" height={50} className="mb-2" />
              <Skeleton variant="rect" width="100%" height={50} />
            </CardContent>
          </Card>
        ) : error ? (
          <ErrorState title="Failed to load recruiter profiles" onRetry={fetchCandidates} />
        ) : filtered.length === 0 ? (
          <EmptyState title="No Candidates Match" description="Adjust your filters or query text above to locate candidates." onActionClick={() => { setSearch(""); setFilterJob("All"); setFilterStatus("All"); setFilterScore("All"); }} actionText="Clear Filters" />
        ) : (
          <Card className="surface-custom border-custom">
            <CardContent className="p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Applied Position</th>
                      <th>Match Score</th>
                      <th>Applied Date</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((candidate) => (
                      <tr key={candidate.id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <FaUserCircle size={32} className="text-secondary" />
                            <div>
                              <div className="fw-bold text-white">{candidate.name}</div>
                              <small className="text-muted">{candidate.email}</small>
                            </div>
                          </div>
                        </td>
                        <td>{candidate.job_title || "Unspecified Requisition"}</td>
                        <td>{getScoreBadge(candidate.match_score)}</td>
                        <td>{new Date(candidate.created_at).toLocaleDateString()}</td>
                        <td>{getStatusBadge(candidate.status)}</td>
                        <td className="text-end">
                          <Button variant="ghost" size="sm" className="d-inline-flex align-items-center gap-1.5" onClick={() => handleViewProfile(candidate)}>
                            Review Details <FaChevronRight size={10} />
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

        {/* PAGINATION PANEL */}
        {!loading && totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-4">
            <span className="text-muted" style={{ fontSize: "0.85rem" }}>
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filtered.length)} of {filtered.length} candidate rows
            </span>
            <div className="d-flex gap-2">
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>
                Previous
              </Button>
              {[...Array(totalPages).keys()].map((p) => (
                <Button key={p + 1} variant={currentPage === p + 1 ? "primary" : "outline"} size="sm" onClick={() => handlePageChange(p + 1)}>
                  {p + 1}
                </Button>
              ))}
              <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}

        {/* CANDIDATE PROFILE DRAWER / MODAL */}
        {profileOpen && selectedCandidate && (
          <Modal
            isOpen={profileOpen}
            onClose={() => setProfileOpen(false)}
            title="Candidate Profile Suitability"
            size="lg"
            footer={
              <div className="d-flex justify-content-between w-100">
                <div className="d-flex gap-2">
                  <Button variant="ghost" onClick={() => setProfileOpen(false)}>Close Drawer</Button>
                </div>
                <div className="d-flex gap-2">
                  {selectedCandidate.status !== "Rejected" && (
                    <Button variant="destructive" className="d-flex align-items-center gap-1.5" onClick={triggerReject}>
                      <FaTimes size={12} /> Reject Application
                    </Button>
                  )}
                  {selectedCandidate.status !== "Shortlisted" && (
                    <Button variant="primary" className="d-flex align-items-center gap-1.5" onClick={() => handleShortlist(selectedCandidate.id)}>
                      <FaCheck size={12} /> Shortlist Candidate
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
                  <h4 className="fw-bold mb-1 text-primary">{selectedCandidate.name}</h4>
                  <div className="d-flex flex-wrap gap-2 text-muted" style={{ fontSize: "0.85rem" }}>
                    <span>Email: {selectedCandidate.email}</span>
                    <span>•</span>
                    <span>Phone: {selectedCandidate.phone || "No phone added"}</span>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="d-flex border-bottom mb-2" style={{ borderColor: "var(--border)" }}>
                {[
                  { id: "overview", label: "Overview" },
                  { id: "resume", label: "Resume File" },
                  { id: "ai", label: "AI Screen insights" },
                  { id: "notes", label: "Internal Notes" }
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
                      <strong>{selectedCandidate.job_title || "Not specified"}</strong>
                    </div>
                    <div className="col-md-6">
                      <span className="text-muted d-block mb-1" style={{ fontSize: "0.8rem" }}>Application Status</span>
                      <div>{getStatusBadge(selectedCandidate.status)}</div>
                    </div>
                  </div>

                  <div>
                    <h6 className="fw-semibold text-secondary-custom mb-1">Candidate Pipeline Event</h6>
                    <p className="text-muted mb-0" style={{ fontSize: "0.88rem" }}>
                      Registered on {new Date(selectedCandidate.created_at).toLocaleString()}.
                    </p>
                  </div>

                  {selectedCandidate.rejection_reason && (
                    <Card className="border border-danger border-opacity-20 bg-danger bg-opacity-5">
                      <CardContent className="p-3">
                        <span className="text-danger fw-semibold d-block mb-1" style={{ fontSize: "0.8rem" }}>Rejection Reason Logged:</span>
                        <p className="text-muted mb-0" style={{ fontSize: "0.88rem" }}>{selectedCandidate.rejection_reason}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {activeTab === "resume" && (
                <div className="py-2 d-flex flex-column align-items-start gap-2">
                  <span className="text-muted" style={{ fontSize: "0.88rem" }}>Associated Resume File:</span>
                  <div className="d-flex align-items-center gap-2 bg-dark bg-opacity-25 border p-3 rounded w-100" style={{ borderColor: "var(--border)" }}>
                    <FaRegClipboard size={24} className="text-primary-light" />
                    <div className="flex-grow-1">
                      <div className="fw-bold" style={{ fontSize: "0.9rem" }}>{selectedCandidate.resume_file || "resume.pdf"}</div>
                      <small className="text-muted">Uploaded on: {new Date(selectedCandidate.created_at).toLocaleDateString()}</small>
                    </div>
                    {selectedCandidate.resume_file && (
                      <a
                        href={`${api.defaults.baseURL || ""}/uploads/${selectedCandidate.resume_file}`}
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
              )}              {activeTab === "ai" && (
                <div className="py-1 d-flex flex-column gap-3 text-start">
                  <div className="d-flex align-items-center gap-2">
                    <FaRobot className="text-primary-light" size={20} />
                    <h6 className="fw-semibold mb-0">AI Screen Assessment fit</h6>
                  </div>

                  {selectedCandidate.match_score === null ? (
                    <div className="text-center py-4 text-muted bg-dark bg-opacity-25 rounded border border-secondary border-opacity-10">
                      No AI analysis results available for this applicant. Run screening from the AI Screening tab to generate metrics.
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {/* Overall Fit */}
                      <div className="d-flex align-items-center justify-content-between p-3 bg-dark bg-opacity-25 border rounded border-secondary border-opacity-10">
                        <div>
                          <div className="fw-bold text-primary" style={{ fontSize: "1.1rem" }}>Compatibility: {selectedCandidate.match_score}% Fit</div>
                          <small className="text-muted">Recommendation: {selectedCandidate.recommendation || "Under Review"}</small>
                        </div>
                        <div className={`h5 mb-0 fw-bold text-${selectedCandidate.match_score >= 75 ? "success" : "warning"}`}>
                          {selectedCandidate.match_score >= 75 ? "Strong Match" : "Potential Match"}
                        </div>
                      </div>

                      {/* Component breakdowns */}
                      <div className="row g-3">
                        <div className="col-4">
                          <small className="text-muted d-block" style={{ fontSize: "0.75rem" }}>Skills Fit</small>
                          <strong className="text-white">{selectedCandidate.skills_score || 0}%</strong>
                          <div className="progress mt-1" style={{ height: "4px" }}>
                            <div className="progress-bar bg-info" style={{ width: `${selectedCandidate.skills_score || 0}%` }}></div>
                          </div>
                        </div>
                        <div className="col-4">
                          <small className="text-muted d-block" style={{ fontSize: "0.75rem" }}>Exp Alignment</small>
                          <strong className="text-white">{selectedCandidate.experience_score || 0}%</strong>
                          <div className="progress mt-1" style={{ height: "4px" }}>
                            <div className="progress-bar bg-success" style={{ width: `${selectedCandidate.experience_score || 0}%` }}></div>
                          </div>
                        </div>
                        <div className="col-4">
                          <small className="text-muted d-block" style={{ fontSize: "0.75rem" }}>Education Fit</small>
                          <strong className="text-white">{selectedCandidate.education_score || 0}%</strong>
                          <div className="progress mt-1" style={{ height: "4px" }}>
                            <div className="progress-bar bg-primary" style={{ width: `${selectedCandidate.education_score || 0}%` }}></div>
                          </div>
                        </div>
                      </div>

                      {/* Skills lists */}
                      <div className="row g-2 mt-1">
                        <div className="col-md-6">
                          <small className="text-muted d-block mb-1">Matched Skills</small>
                          <div className="d-flex flex-wrap gap-1">
                            {selectedCandidate.matched_skills ? (
                              selectedCandidate.matched_skills.split(",").map((s, i) => (
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
                            {selectedCandidate.missing_skills ? (
                              selectedCandidate.missing_skills.split(",").map((s, i) => (
                                <Badge key={i} variant="danger" style={{ fontSize: "0.7rem", padding: "3px 6px" }}>{s.trim()}</Badge>
                              ))
                            ) : (
                              <span className="text-muted small">None missing</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* AI Assisted Summary */}
                      {selectedCandidate.ai_summary && (
                        <div className="p-3 bg-dark bg-opacity-25 rounded border border-secondary border-opacity-10" style={{ fontSize: "0.85rem" }}>
                          <div className="fw-semibold text-secondary-custom mb-1">AI Screening Summary:</div>
                          <p className="text-muted mb-0" style={{ lineHeight: 1.5 }}>{selectedCandidate.ai_summary}</p>
                        </div>
                      )}

                      <div className="text-center text-muted px-3 mt-2" style={{ fontSize: "0.75rem" }}>
                        * Suitability scoring values are decision support tools calculated via resume parsing similarity checks. Human recruiter checks must dictate all shortlisting steps.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "notes" && (
                <div className="py-1 d-flex flex-column gap-3">
                  <div>
                    <label htmlFor="notesText" className="form-label-custom mb-1">Recruiter Notes (Internal only)</label>
                    <textarea
                      id="notesText"
                      className="form-control"
                      rows="5"
                      placeholder="Add assessment updates, pipeline schedules, or interviewer comments here..."
                      value={notesText}
                      onChange={(e) => setNotesText(e.target.value)}
                    />
                  </div>
                  <Button variant="primary" loading={notesSaving} onClick={handleSaveNotes} className="align-self-end">
                    Save Notes
                  </Button>
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
            title="Confirm Rejection"
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
              <label htmlFor="rejectionReason" className="form-label-custom mb-1">Rejection Reason</label>
              <textarea
                id="rejectionReason"
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

export default Candidates;