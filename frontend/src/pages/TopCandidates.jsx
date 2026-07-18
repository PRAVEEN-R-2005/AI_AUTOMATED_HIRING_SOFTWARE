import { useEffect, useState } from "react";
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
import {
  FaTrophy,
  FaSearch,
  FaFileDownload,
  FaRobot,
  FaUserCircle,
  FaExclamationTriangle,
  FaCheckCircle,
  FaExchangeAlt
} from "react-icons/fa";

function TopCandidates() {
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Job selection
  const [selectedJobId, setSelectedJobId] = useState("All");

  // Selection for comparison (up to 3 candidates)
  const [selectedIds, setSelectedIds] = useState([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [comparedCandidates, setComparedCandidates] = useState([]);

  // Pipeline update status
  const [updatingId, setUpdatingId] = useState(null);

  // Rejection modal states
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReasonText, setRejectionReasonText] = useState("");
  const [rejectingCandidateId, setRejectingCandidateId] = useState(null);

  // Load jobs and candidate rankings
  const loadData = async () => {
    try {
      const [jobsRes, hrCandidatesRes] = await Promise.all([
        api.get("/api/job-descriptions"),
        api.get("/api/hr/all-candidates")
      ]);
      setJobs(jobsRes.data || []);
      setCandidates(hrCandidatesRes.data || []);
      
      // Auto-select first job if present
      if (jobsRes.data?.length > 0) {
        setSelectedJobId(jobsRes.data[0].jdId);
      }
    } catch (err) {
      console.warn("Failed to load ranking dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter candidates based on selected job requisition and search query
  const getFilteredCandidates = () => {
    let list = [...candidates];

    // 1. Job Requisition Filter
    if (selectedJobId !== "All") {
      list = list.filter(c => {
        // Since we joined applications with job_descriptions to fetch candidates,
        // we can filter candidates by comparing their applied job requisitions or match keys
        // If there's an explicit match, filter it, otherwise check job title
        const jobObj = jobs.find(j => Number(j.jdId) === Number(selectedJobId));
        return jobObj ? c.job_title === jobObj.title : true;
      });
    }

    // 2. Search Query
    if (search.trim()) {
      const query = search.toLowerCase();
      list = list.filter(
        c =>
          c.name?.toLowerCase().includes(query) ||
          c.email?.toLowerCase().includes(query) ||
          c.job_title?.toLowerCase().includes(query)
      );
    }

    // 3. Deterministic AI Ranking Sort:
    // 1. match_score DESC
    // 2. skills_score DESC
    // 3. experience_score DESC
    // 4. education_score DESC
    // 5. stable tie-breaker (candidate ID DESC)
    list.sort((a, b) => {
      const scoreA = a.match_score !== null ? a.match_score : -1;
      const scoreB = b.match_score !== null ? b.match_score : -1;
      
      if (scoreB !== scoreA) return scoreB - scoreA;
      
      const skillsA = a.skills_score || 0;
      const skillsB = b.skills_score || 0;
      if (skillsB !== skillsA) return skillsB - skillsA;

      const expA = a.experience_score || 0;
      const expB = b.experience_score || 0;
      if (expB !== expA) return expB - expA;

      const eduA = a.education_score || 0;
      const eduB = b.education_score || 0;
      if (eduB !== eduA) return eduB - eduA;

      return b.id - a.id; // stable ID tie-breaker
    });

    return list;
  };

  const sortedCandidates = getFilteredCandidates();

  // Statistics counters
  const totalApplicants = sortedCandidates.length;
  const screenedCount = sortedCandidates.filter(c => c.match_score !== null).length;
  const unscreenedCount = totalApplicants - screenedCount;
  const strongMatches = sortedCandidates.filter(c => (c.match_score || 0) >= 75).length;
  
  const averageMatchScore = screenedCount > 0 
    ? Math.round(sortedCandidates.reduce((sum, c) => sum + (c.match_score || 0), 0) / screenedCount) 
    : 0;

  // Handle Checkbox Selection
  const handleCheckboxChange = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      }
      if (prev.length >= 3) {
        alert("You can select up to 3 candidates maximum for side-by-side comparison.");
        return prev;
      }
      return [...prev, id];
    });
  };

  // Launch Candidate Comparison Sheet
  const handleOpenComparison = () => {
    if (selectedIds.length < 2) {
      alert("Please select at least 2 candidates to compare.");
      return;
    }
    const compared = candidates.filter(c => selectedIds.includes(c.id));
    setComparedCandidates(compared);
    setComparisonOpen(true);
  };

  // Inline assessment actions
  const handleShortlist = async (id) => {
    setUpdatingId(id);
    try {
      await api.put(`/api/applications/shortlist/${id}`);
      alert("Candidate Shortlisted");
      loadData();
      
      // Update compared candidate records if comparison sheet is open
      setComparedCandidates(prev => prev.map(c => c.id === id ? { ...c, status: "Shortlisted" } : c));
    } catch (err) {
      alert("Shortlist action failed");
    } finally {
      setUpdatingId(null);
    }
  };

  const triggerReject = (id) => {
    setRejectingCandidateId(id);
    setRejectionReasonText("");
    setRejectOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectingCandidateId) return;
    setUpdatingId(rejectingCandidateId);
    try {
      await api.put(`/api/applications/reject/${rejectingCandidateId}`, { reason: rejectionReasonText.trim() });
      alert("Candidate Rejected");
      setRejectOpen(false);
      loadData();

      // Update compared candidate records if comparison sheet is open
      setComparedCandidates(prev => prev.map(c => c.id === rejectingCandidateId ? { ...c, status: "Rejected" } : c));
    } catch (err) {
      alert("Rejection action failed");
    } finally {
      setUpdatingId(null);
    }
  };

  // Score badge helper
  const getScoreBadgeClass = (score) => {
    if (score >= 75) return "success";
    if (score >= 50) return "info";
    return "danger";
  };

  // Pipeline Badge helper
  const getStatusBadge = (status) => {
    if (status === "Shortlisted") return <Badge variant="success">Shortlisted</Badge>;
    if (status === "Rejected") return <Badge variant="danger">Rejected</Badge>;
    return <Badge variant="warning">Pending Review</Badge>;
  };

  const selectedJob = jobs.find(j => Number(j.jdId) === Number(selectedJobId));

  return (
    <AppLayout>
      <div className="container-fluid px-0 text-white text-start">
        
        {/* HEADER */}
        <div className="mb-4">
          <h2 className="fw-bold mb-1" style={{ color: "var(--text-primary)" }}>AI Candidate Ranking</h2>
          <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
            Rank and evaluate candidate applications side-by-side using multi-component suitability metrics.
          </p>
          <div className="alert border border-warning border-opacity-15 bg-warning bg-opacity-5 p-2.5 mt-2 mb-0 d-flex align-items-center gap-2" style={{ fontSize: "0.85rem" }}>
            <FaExclamationTriangle className="text-warning-light" />
            <span className="text-muted">
              AI-assisted rankings summarize job-related candidate analysis and are intended to support, not replace, recruiter judgment.
            </span>
          </div>
        </div>

        {/* WORKFLOW AND REQUISITION SELECTION */}
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <Card className="surface-custom border-custom h-100">
              <CardContent className="p-3.5">
                <label className="form-label-custom mb-1">Target Job Requisition</label>
                <Select
                  value={selectedJobId}
                  onChange={(e) => { setSelectedJobId(e.target.value); setSelectedIds([]); }}
                  options={[
                    { value: "All", label: "All Job Requisitions" },
                    ...jobs.map(j => ({ value: j.jdId, label: j.title }))
                  ]}
                  className="mb-0"
                />
              </CardContent>
            </Card>
          </div>
          
          <div className="col-md-8">
            {/* RANKING METRICS */}
            <div className="row g-3">
              <div className="col-6 col-md-3">
                <StatCard title="Total Applicants" value={totalApplicants} icon={<FaUserCircle />} loading={loading} description="Job-specific applications" />
              </div>
              <div className="col-6 col-md-3">
                <StatCard title="AI Screened" value={screenedCount} icon={<FaRobot />} loading={loading} description="Processed profiles" />
              </div>
              <div className="col-6 col-md-3">
                <StatCard title="Strong Matches" value={strongMatches} icon={<FaTrophy />} loading={loading} description="Fit score >= 75%" />
              </div>
              <div className="col-6 col-md-3">
                <StatCard title="Average Fit" value={`${averageMatchScore}%`} icon={<FaCheckCircle />} loading={loading} description="Average compatibility" />
              </div>
            </div>
          </div>
        </div>

        {/* FLOATING ACTION TOOLBAR */}
        {selectedIds.length >= 2 && (
          <div className="alert bg-primary bg-opacity-15 border border-primary border-opacity-25 p-3 mb-4 d-flex justify-content-between align-items-center rounded">
            <div className="d-flex align-items-center gap-2">
              <FaExchangeAlt className="text-primary-light" />
              <span><strong>{selectedIds.length}</strong> candidate profiles selected for side-by-side analysis.</span>
            </div>
            <div className="d-flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>Clear</Button>
              <Button variant="primary" size="sm" onClick={handleOpenComparison}>Compare Candidates</Button>
            </div>
          </div>
        )}

        {/* SEARCH AND FILTERS */}
        <Card className="surface-custom border-custom mb-4">
          <CardContent className="p-3.5 d-flex gap-3 align-items-center justify-content-between">
            <div className="position-relative w-100" style={{ maxWidth: "350px" }}>
              <FaSearch className="position-absolute text-muted" style={{ left: "12px", top: "14px" }} />
              <input
                type="text"
                className="form-control ps-5"
                placeholder="Search candidate name, email, role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="text-muted" style={{ fontSize: "0.85rem" }}>
              * Rankings are calculated deterministically across skills, experience, and education vectors.
            </div>
          </CardContent>
        </Card>

        {/* RANKING LIST TABLE */}
        {loading ? (
          <Card className="surface-custom border-custom">
            <CardContent className="p-4">
              <Skeleton variant="rect" width="100%" height={30} className="mb-2" />
              <Skeleton variant="rect" width="100%" height={50} className="mb-2" />
              <Skeleton variant="rect" width="100%" height={50} />
            </CardContent>
          </Card>
        ) : sortedCandidates.length === 0 ? (
          <EmptyState title="No Candidates Found" description="Try selecting another requisition or adjust search queries." />
        ) : (
          <Card className="surface-custom border-custom">
            <CardContent className="p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: "50px" }}>Select</th>
                      <th style={{ width: "70px" }}>Rank</th>
                      <th>Candidate Details</th>
                      <th>Applied Role</th>
                      <th>Overall Fit</th>
                      <th style={{ width: "100px" }}>Skills</th>
                      <th style={{ width: "100px" }}>Exp</th>
                      <th style={{ width: "100px" }}>Edu</th>
                      <th>Status</th>
                      <th className="text-end">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCandidates.map((candidate, index) => {
                      const isChecked = comparedCandidates.some(c => c.id === candidate.id);
                      return (
                        <tr key={candidate.id || `candidate-fallback-${index}`} className={isChecked ? "table-active" : ""}>
                          <td>
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={isChecked}
                              disabled={!isChecked && selectedIds.length >= 3 && candidate.match_score !== null}
                              onChange={() => handleCheckboxChange(candidate.id)}
                            />
                          </td>
                          <td>
                            <span className="fw-bold text-secondary-custom">#{index + 1}</span>
                          </td>
                          <td>
                            <div className="fw-bold text-white">{candidate.name}</div>
                            <small className="text-muted">{candidate.email}</small>
                          </td>
                          <td>{candidate.job_title || "Unspecified"}</td>
                          <td>
                            {candidate.match_score !== null ? (
                              <div className="d-flex align-items-center gap-2">
                                <div className="progress flex-grow-1" style={{ height: "6px", minWidth: "80px" }}>
                                  <div className={`progress-bar bg-${getScoreBadgeClass(candidate.match_score)}`} style={{ width: `${candidate.match_score}%` }}></div>
                                </div>
                                <span className="fw-semibold text-white" style={{ fontSize: "0.85rem" }}>{candidate.match_score}%</span>
                              </div>
                            ) : (
                              <span className="text-muted small">Not Analyzed</span>
                            )}
                          </td>
                          <td>{candidate.skills_score !== null ? `${candidate.skills_score}%` : "—"}</td>
                          <td>{candidate.experience_score !== null ? `${candidate.experience_score}%` : "—"}</td>
                          <td>{candidate.education_score !== null ? `${candidate.education_score}%` : "—"}</td>
                          <td>{getStatusBadge(candidate.status)}</td>
                          <td className="text-end">
                            {candidate.recommendation ? (
                              <Badge variant={getScoreBadgeClass(candidate.match_score)}>{candidate.recommendation.split(" - ")[0]}</Badge>
                            ) : (
                              <span className="text-muted small">Awaiting Screening</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CANDIDATE SIDE-BY-SIDE COMPARISON MODAL */}
        {comparisonOpen && comparedCandidates.length >= 2 && (
          <Modal
            isOpen={comparisonOpen}
            onClose={() => setComparisonOpen(false)}
            title="Candidate Side-by-Side Comparison"
            size="xl"
            footer={
              <div className="w-100 d-flex justify-content-between">
                <Button variant="ghost" onClick={() => setComparisonOpen(false)}>Close Wizard</Button>
                <span className="text-muted small align-self-center">* Verify certifications and references manually prior to offer bookings.</span>
              </div>
            }
          >
            <div className="table-responsive text-white">
              <table className="table table-bordered align-middle text-start mb-0">
                <thead>
                  <tr className="bg-dark bg-opacity-30">
                    <th style={{ width: "180px", color: "var(--primary-light)", fontWeight: "bold" }}>Metrics Criteria</th>
                    {comparedCandidates.map((c, index) => (
                      <th key={c.id || `c-fallback-${index}`} style={{ minWidth: "220px" }}>
                        <div className="d-flex align-items-center gap-2">
                          <FaUserCircle size={32} className="text-secondary" />
                          <div>
                            <div className="fw-bold text-white" style={{ fontSize: "0.95rem" }}>{c.name}</div>
                            <small className="text-muted d-block">{c.email}</small>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Pipeline Action Row */}
                  <tr>
                    <td><strong>Decisions</strong></td>
                    {comparedCandidates.map((c, index) => (
                      <td key={c.id || `c-fallback-${index}`}>
                        <div className="d-flex gap-1.5 flex-wrap">
                          <Button
                            variant="primary"
                            size="sm"
                            className="py-1"
                            disabled={c.status === "Shortlisted" || updatingId === c.id}
                            onClick={() => handleShortlist(c.id)}
                          >
                            Shortlist
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="py-1"
                            disabled={c.status === "Rejected" || updatingId === c.id}
                            onClick={() => triggerReject(c.id)}
                          >
                            Reject
                          </Button>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Recommendation status */}
                  <tr>
                    <td><strong>Recommendation</strong></td>
                    {comparedCandidates.map((c, index) => (
                      <td key={c.id || `c-fallback-${index}`}>
                        <Badge variant={getScoreBadgeClass(c.match_score)}>
                          {c.recommendation || "Pending Review"}
                        </Badge>
                      </td>
                    ))}
                  </tr>

                  {/* Overall Fit */}
                  <tr>
                    <td><strong>Overall Match Score</strong></td>
                    {comparedCandidates.map((c, index) => (
                      <td key={c.id || `c-fallback-${index}`}>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className={`d-flex align-items-center justify-content-center rounded-circle border border-3 border-${getScoreBadgeClass(c.match_score)}`}
                            style={{ width: "48px", height: "48px", fontWeight: "bold", fontSize: "0.95rem" }}
                          >
                            {c.match_score}%
                          </div>
                          <span className="text-muted small">Suitability Fit</span>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Component breakdowns */}
                  <tr>
                    <td><strong>Skills Match</strong></td>
                    {comparedCandidates.map((c, index) => (
                      <td key={c.id || `c-fallback-${index}`}>
                        <strong className="text-white">{c.skills_score || 0}%</strong>
                        <div className="progress mt-1" style={{ height: "4px" }}>
                          <div className="progress-bar bg-info" style={{ width: `${c.skills_score || 0}%` }}></div>
                        </div>
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td><strong>Experience Match</strong></td>
                    {comparedCandidates.map((c, index) => (
                      <td key={c.id || `c-fallback-${index}`}>
                        <strong className="text-white">{c.experience_score || 0}%</strong>
                        <div className="progress mt-1" style={{ height: "4px" }}>
                          <div className="progress-bar bg-success" style={{ width: `${c.experience_score || 0}%` }}></div>
                        </div>
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td><strong>Education Match</strong></td>
                    {comparedCandidates.map((c, index) => (
                      <td key={c.id || `c-fallback-${index}`}>
                        <strong className="text-white">{c.education_score || 0}%</strong>
                        <div className="progress mt-1" style={{ height: "4px" }}>
                          <div className="progress-bar bg-primary" style={{ width: `${c.education_score || 0}%` }}></div>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Matched Skills */}
                  <tr>
                    <td><strong>Matched Skills</strong></td>
                    {comparedCandidates.map((c, index) => (
                      <td key={c.id || `c-fallback-${index}`}>
                        <div className="d-flex flex-wrap gap-1">
                          {c.matched_skills ? (
                            c.matched_skills.split(",").map((s, idx) => (
                              <Badge key={idx} variant="success" style={{ fontSize: "0.68rem" }}>{s.trim()}</Badge>
                            ))
                          ) : (
                            <span className="text-muted small">None parsed</span>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Missing Skills */}
                  <tr>
                    <td><strong>Missing Skill Gaps</strong></td>
                    {comparedCandidates.map((c, index) => (
                      <td key={c.id || `c-fallback-${index}`}>
                        <div className="d-flex flex-wrap gap-1">
                          {c.missing_skills ? (
                            c.missing_skills.split(",").map((s, idx) => (
                              <Badge key={idx} variant="danger" style={{ fontSize: "0.68rem" }}>{s.trim()}</Badge>
                            ))
                          ) : (
                            <span className="text-muted small">None missing</span>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Key Strengths */}
                  <tr>
                    <td><strong>Key Strengths</strong></td>
                    {comparedCandidates.map((c, index) => (
                      <td key={c.id || `c-fallback-${index}`}>
                        <ul className="ps-3 mb-0 text-muted" style={{ fontSize: "0.8rem", lineHeight: 1.4 }}>
                          {c.candidate_strengths?.split(" | ").map((s, idx) => (
                            <li key={idx} className="mb-0.5">{s}</li>
                          ))}
                        </ul>
                      </td>
                    ))}
                  </tr>

                  {/* Considerations */}
                  <tr>
                    <td><strong>Review Considerations</strong></td>
                    {comparedCandidates.map((c, index) => (
                      <td key={c.id || `c-fallback-${index}`}>
                        <ul className="ps-3 mb-0 text-muted" style={{ fontSize: "0.8rem", lineHeight: 1.4 }}>
                          {c.review_considerations?.split(" | ").map((con, idx) => (
                            <li key={idx} className="mb-0.5">{con}</li>
                          ))}
                        </ul>
                      </td>
                    ))}
                  </tr>

                  {/* Resume Download */}
                  <tr>
                    <td><strong>Document</strong></td>
                    {comparedCandidates.map((c, index) => (
                      <td key={c.id || `c-fallback-${index}`}>
                        {c.resume_file ? (
                          <a
                            href={`${api.defaults.baseURL || ""}/uploads/${c.resume_file}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-outline-danger btn-sm py-1 d-inline-flex align-items-center gap-1.5"
                            style={{ textDecoration: "none" }}
                          >
                            <FaFileDownload /> Resume PDF
                          </a>
                        ) : (
                          <span className="text-muted small">No file</span>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
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
                <Button variant="destructive" onClick={handleConfirmReject}>
                  Confirm Rejection
                </Button>
              </>
            }
          >
            <div className="text-start">
              <p className="text-muted mb-3" style={{ fontSize: "0.9rem" }}>
                Enter the reason for rejecting this candidate. (Rejection reasons are logged for recruitment tracking).
              </p>
              <label htmlFor="rejectionReasonRank" className="form-label-custom mb-1">Rejection Reason</label>
              <textarea
                id="rejectionReasonRank"
                className="form-control"
                rows="3"
                placeholder="e.g. Technical assessment criteria not met"
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

export default TopCandidates;
