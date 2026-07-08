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
import {
  FaRobot,
  FaUpload,
  FaFilePdf,
  FaCheckCircle,
  FaExclamationCircle,
  FaLightbulb,
  FaClock,
  FaSearch,
  FaFileAlt,
  FaArrowRight,
  FaTimesCircle,
  FaCheck,
  FaTimes,
  FaRegCircle
} from "react-icons/fa";

function AICandidates() {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form selections
  const [selectedJobId, setSelectedJobId] = useState("");
  const [sourceMode, setSourceMode] = useState("existing"); // existing or upload
  const [selectedAppId, setSelectedAppId] = useState("");
  
  // File upload state
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Analysis status
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [failedStep, setFailedStep] = useState(0);

  // Load requisitions & applications
  const loadData = async () => {
    setLoading(true);
    try {
      const [jobsRes, appsRes] = await Promise.all([
        api.get("/api/job-descriptions"),
        api.get("/api/applications/all")
      ]);
      setJobs(jobsRes.data || []);
      setApplications(appsRes.data || []);
      
      // Auto-select first job if present
      if (jobsRes.data?.length > 0) {
        setSelectedJobId(jobsRes.data[0].jd_id);
      }
    } catch (err) {
      console.warn("Failed to load AI page data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter candidates who applied for the selected job
  const jobApplicants = applications.filter(
    app => Number(app.job_id) === Number(selectedJobId)
  );

  // Auto-select first applicant when job changes
  useEffect(() => {
    if (jobApplicants.length > 0) {
      setSelectedAppId(jobApplicants[0].id);
    } else {
      setSelectedAppId("");
    }
  }, [selectedJobId, applications]);

  // Drag & drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
      } else {
        alert("Only PDF resume files are supported by the parser.");
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
      } else {
        alert("Only PDF resume files are supported by the parser.");
      }
    }
  };

  // Helper step status indicator
  const renderStepStatus = (stepIndex) => {
    if (analyzing) {
      if (analysisStep > stepIndex) return <FaCheck className="text-success" size={13} />;
      if (analysisStep === stepIndex) return <span className="spinner-border spinner-border-sm text-primary-light" role="status" style={{ width: "12px", height: "12px", borderRightColor: "transparent" }}></span>;
      return <FaRegCircle className="text-muted opacity-40" size={13} />;
    }
    if (error) {
      if (failedStep === stepIndex) return <FaTimes className="text-danger" size={13} />;
      if (failedStep > stepIndex) return <FaCheck className="text-success" size={13} />;
      return <FaRegCircle className="text-muted opacity-40" size={13} />;
    }
    return <FaRegCircle className="text-muted opacity-40" size={13} />;
  };

  // Run AI analysis workflow
  const handleRunAnalysis = async () => {
    setError(null);
    setFailedStep(0);

    if (!selectedJobId) {
      setError("Please select a target job opening.");
      return;
    }

    if (sourceMode === "upload" && !file) {
      setError("Please upload a PDF resume file to screen.");
      return;
    }

    if (sourceMode === "existing") {
      if (!selectedAppId) {
        setError("Please select an applicant profile to evaluate.");
        return;
      }
      const selectedApp = applications.find(app => Number(app.id) === Number(selectedAppId));
      if (!selectedApp || !selectedApp.resume_file || !selectedApp.resume_file.trim()) {
        setError("Selected candidate has no uploaded resume file. Please upload a resume before screening.");
        setFailedStep(0);
        return;
      }
    }

    setAnalyzing(true);
    setAnalysisResult(null);
    setAnalysisStep(0);

    // Simulation steps logic
    const interval = setInterval(() => {
      setAnalysisStep(prev => {
        if (prev < 3) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 800);

    try {
      let response;
      if (sourceMode === "upload") {
        const formData = new FormData();
        formData.append("jobId", selectedJobId);
        formData.append("resume_file", file);

        response = await api.post("/api/ai/upload-run", formData, { timeout: 30000 });
      } else {
        response = await api.put(`/api/ai/run/${selectedAppId}`, {}, { timeout: 30000 });
      }

      setAnalysisResult(response.data);
      loadData(); // refresh list
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.message || err.message || "AI resume screening failed. Verify that PDF is text-readable and database is running.";
      setError(errorMessage);
      setFailedStep(analysisStep);
    } finally {
      clearInterval(interval);
      setAnalyzing(false);
    }
  };

  // Status interpreters
  const getScoreBadgeClass = (score) => {
    if (score >= 75) return "success";
    if (score >= 50) return "info";
    return "danger";
  };

  const getScoreBadge = (score) => {
    if (!score && score !== 0) return <Badge variant="secondary">N/A</Badge>;
    if (score >= 80) return <Badge variant="success">{score}% Match</Badge>;
    if (score >= 60) return <Badge variant="info">{score}% Match</Badge>;
    return <Badge variant="danger">{score}% Match</Badge>;
  };

  // History list: applications with non-null match scores
  const recentAnalyses = applications
    .filter(app => app.match_score !== null)
    .sort((a, b) => b.id - a.id);

  const selectedJob = jobs.find(j => Number(j.jd_id) === Number(selectedJobId));

  return (
    <AppLayout>
      <div className="container-fluid px-0 text-white text-start">
        
        {/* HEADER */}
        <div className="mb-4">
          <h2 className="fw-bold mb-1" style={{ color: "var(--text-primary)" }}>AI Resume Screening</h2>
          <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
            Screen candidate resumes against job requisitions using localized natural language processing.
          </p>
          <div className="alert border border-warning border-opacity-15 bg-warning bg-opacity-5 p-2.5 mt-2 mb-0 d-flex align-items-center gap-2" style={{ fontSize: "0.85rem" }}>
            <FaExclamationCircle className="text-warning-light" />
            <span className="text-muted">
              Responsible AI Note: Match metrics serve as recruiting support tools. Final candidate selections remain with hiring professionals.
            </span>
          </div>
        </div>

        {loading ? (
          <div className="row g-4">
            <div className="col-md-6"><Skeleton variant="rect" width="100%" height={350} /></div>
            <div className="col-md-6"><Skeleton variant="rect" width="100%" height={350} /></div>
          </div>
        ) : (
          <div className="row g-4">
            
            {/* WORKFLOW SETUP */}
            <div className="col-lg-5">
              <Card className="surface-custom border-custom h-100">
                <CardContent className="p-4 d-flex flex-column gap-3">
                  <h5 className="fw-bold mb-0 text-primary">1. Select Requisition</h5>
                  
                  <div>
                    <label className="form-label-custom mb-1">Target Job Posting</label>
                    <Select
                      value={selectedJobId}
                      onChange={(e) => setSelectedJobId(e.target.value)}
                      options={jobs.map(j => ({ value: j.jd_id, label: `${j.title} (${j.location})` }))}
                    />
                  </div>

                  {selectedJob && (
                    <div className="p-3 rounded bg-dark bg-opacity-25 border border-secondary border-opacity-10" style={{ fontSize: "0.88rem" }}>
                      <div className="fw-bold text-secondary-custom mb-1">Target Requirements:</div>
                      <div className="text-muted">Skills: {selectedJob.skills || "None parsed"}</div>
                      <div className="text-muted">Experience: {selectedJob.experience || "Not specified"}</div>
                    </div>
                  )}

                  <h5 className="fw-bold mb-0 text-primary pt-2">2. Choose Resume Source</h5>
                  
                  {/* Mode tabs */}
                  <div className="btn-group border border-secondary border-opacity-10 rounded mb-2 w-100">
                    <button
                      type="button"
                      className={`btn py-2 ${sourceMode === "existing" ? "bg-primary text-white" : "text-muted bg-transparent"}`}
                      onClick={() => setSourceMode("existing")}
                      style={{ border: "none" }}
                    >
                      Assess Candidate Application
                    </button>
                    <button
                      type="button"
                      className={`btn py-2 ${sourceMode === "upload" ? "bg-primary text-white" : "text-muted bg-transparent"}`}
                      onClick={() => setSourceMode("upload")}
                      style={{ border: "none" }}
                    >
                      Upload PDF Resume
                    </button>
                  </div>

                  {sourceMode === "existing" ? (
                    <div>
                      <label className="form-label-custom mb-1">Select Applicant Profile</label>
                      {jobApplicants.length === 0 ? (
                        <div className="alert alert-secondary p-2.5 mb-0 text-center" style={{ fontSize: "0.85rem" }}>
                          No pending applications for this job.
                        </div>
                      ) : (
                        <Select
                          value={selectedAppId}
                          onChange={(e) => setSelectedAppId(e.target.value)}
                          options={jobApplicants.map(app => ({
                            value: app.id,
                            label: `${app.candidate_name} (${app.email})`
                          }))}
                        />
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="form-label-custom mb-1">Upload PDF Document</label>
                      <div
                        className={`drag-drop-zone p-4 rounded text-center border-dashed d-flex flex-column align-items-center justify-content-center gap-2 ${dragActive ? "drag-active border-primary" : "border-secondary border-opacity-25 bg-dark bg-opacity-20"}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        style={{ borderStyle: "dashed", borderWidth: "2px", minHeight: "150px", cursor: "pointer" }}
                        onClick={() => document.getElementById("resume-upload").click()}
                      >
                        <FaUpload size={28} className="text-muted mb-1" />
                        {file ? (
                          <div className="d-flex align-items-center gap-1.5 text-primary-light">
                            <FaFilePdf size={18} />
                            <span className="fw-semibold text-wrap" style={{ fontSize: "0.9rem" }}>{file.name}</span>
                          </div>
                        ) : (
                          <>
                            <div className="fw-semibold" style={{ fontSize: "0.9rem" }}>Drag & Drop Resume PDF here</div>
                            <small className="text-muted">or click to browse local files (PDF only)</small>
                          </>
                        )}
                        <input
                          id="resume-upload"
                          type="file"
                          className="d-none"
                          accept="application/pdf"
                          onChange={handleFileChange}
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    variant="primary"
                    className="w-100 d-flex align-items-center justify-content-center gap-2 py-2.5 mt-3"
                    disabled={analyzing || (sourceMode === "existing" && !selectedAppId) || (sourceMode === "upload" && !file)}
                    onClick={handleRunAnalysis}
                  >
                    <FaRobot /> {analyzing ? "Screening..." : "Run AI Resume Analysis"}
                  </Button>

                </CardContent>
              </Card>
            </div>

            {/* PIPELINE PROGRESS & ASSESSMENT SUMMARY */}
            <div className="col-lg-7">
              <Card className="surface-custom border-custom h-100">
                <CardContent className="p-4 d-flex flex-column justify-content-center min-vh-50 text-center">
                  
                  {/* Step Loader during screening */}
                  {(analyzing || error) && (
                    <div className="d-flex flex-column align-items-center gap-3 py-4">
                      {analyzing ? (
                        <div className="spinner-border text-primary-light" role="status" style={{ width: "3rem", height: "3rem" }}>
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center justify-content-center bg-danger bg-opacity-10 text-danger rounded-circle" style={{ width: "3rem", height: "3rem" }}>
                          <FaTimesCircle size={28} />
                        </div>
                      )}
                      
                      <h5 className={`fw-bold mt-2 ${analyzing ? "text-primary-light" : "text-danger"}`}>
                        {analyzing ? "Screening in progress..." : "Screening failed"}
                      </h5>
                      
                      <div className="d-flex flex-column gap-2 text-muted align-items-start mt-2 p-3 bg-dark bg-opacity-20 rounded border border-secondary border-opacity-10" style={{ fontSize: "0.9rem", width: "280px" }}>
                        <div className="d-flex align-items-center gap-2.5 w-100">
                          <span className="d-flex align-items-center justify-content-center" style={{ width: "16px" }}>
                            {renderStepStatus(0)}
                          </span>
                          <span>Reading PDF Buffer</span>
                        </div>
                        <div className="d-flex align-items-center gap-2.5 w-100">
                          <span className="d-flex align-items-center justify-content-center" style={{ width: "16px" }}>
                            {renderStepStatus(1)}
                          </span>
                          <span>Normalizing extracted text</span>
                        </div>
                        <div className="d-flex align-items-center gap-2.5 w-100">
                          <span className="d-flex align-items-center justify-content-center" style={{ width: "16px" }}>
                            {renderStepStatus(2)}
                          </span>
                          <span>Running cosine similarity matches</span>
                        </div>
                        <div className="d-flex align-items-center gap-2.5 w-100">
                          <span className="d-flex align-items-center justify-content-center" style={{ width: "16px" }}>
                            {renderStepStatus(3)}
                          </span>
                          <span>Compiling strengths list</span>
                        </div>
                      </div>

                      {error && (
                        <div className="d-flex flex-column align-items-center gap-2 mt-3 w-100" style={{ maxWidth: "340px" }}>
                          <div className="alert alert-danger p-3 mb-0 text-start w-100" style={{ fontSize: "0.85rem", borderLeftWidth: "4px" }}>
                            <div className="fw-semibold mb-1 text-danger">Error Details:</div>
                            <div className="text-white opacity-85">{error}</div>
                          </div>
                          <div className="d-flex gap-2 w-100 justify-content-center mt-2">
                            <button
                              type="button"
                              className="btn-custom btn-custom-destructive px-3 py-2"
                              onClick={handleRunAnalysis}
                            >
                              Retry Screening
                            </button>
                            <button
                              type="button"
                              className="btn-custom btn-custom-outline px-3 py-2"
                              onClick={() => { setError(null); setFailedStep(0); }}
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Empty State before start */}
                  {!analyzing && !analysisResult && !error && (
                    <div className="py-5">
                      <EmptyState
                        title="Candidate Intelligence Portal"
                        description="Select a job requisition and candidate source on the left panel, then trigger the AI parse engine to screen suitability metrics."
                      />
                    </div>
                  )}

                  {/* Structured Analysis Results UI */}
                  {!analyzing && analysisResult && (
                    <div className="text-start text-white d-flex flex-column gap-4">
                      
                      {/* Top Metrics Row */}
                      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 border-bottom pb-3" style={{ borderColor: "var(--border)" }}>
                        <div>
                          <h4 className="fw-bold mb-1 text-primary">Screening Analysis Results</h4>
                          <span className="text-muted" style={{ fontSize: "0.85rem" }}>
                            Recommendation: <Badge variant={getScoreBadgeClass(analysisResult.overallScore)}>{analysisResult.recommendation}</Badge>
                          </span>
                        </div>
                        
                        {/* Overall Gauge Dial */}
                        <div className="d-flex align-items-center gap-2.5">
                          <div
                            className={`d-flex align-items-center justify-content-center rounded-circle border border-4 border-${getScoreBadgeClass(analysisResult.overallScore)}`}
                            style={{ width: "76px", height: "76px", fontSize: "1.35rem", fontWeight: "bold", backgroundColor: "rgba(0,0,0,0.15)" }}
                          >
                            {analysisResult.overallScore}%
                          </div>
                          <div>
                            <div className="fw-bold" style={{ fontSize: "0.95rem" }}>Overall Fit</div>
                            <small className="text-muted">Weighted compatibility</small>
                          </div>
                        </div>
                      </div>

                      {/* Component breakdown */}
                      <div>
                        <h6 className="fw-semibold text-secondary-custom mb-2">Requirement Match Breakdowns</h6>
                        <div className="d-flex flex-column gap-2.5">
                          <div>
                            <div className="d-flex justify-content-between text-muted mb-1" style={{ fontSize: "0.85rem" }}>
                              <span>Technical Skills Fit</span>
                              <span>{analysisResult.skillsScore}%</span>
                            </div>
                            <div className="progress" style={{ height: "8px" }}>
                              <div className="progress-bar bg-info" style={{ width: `${analysisResult.skillsScore}%` }}></div>
                            </div>
                          </div>

                          <div>
                            <div className="d-flex justify-content-between text-muted mb-1" style={{ fontSize: "0.85rem" }}>
                              <span>Experience Duration Alignment</span>
                              <span>{analysisResult.experienceScore}%</span>
                            </div>
                            <div className="progress" style={{ height: "8px" }}>
                              <div className="progress-bar bg-success" style={{ width: `${analysisResult.experienceScore}%` }}></div>
                            </div>
                          </div>

                          <div>
                            <div className="d-flex justify-content-between text-muted mb-1" style={{ fontSize: "0.85rem" }}>
                              <span>Academic Qualification Fit</span>
                              <span>{analysisResult.educationScore}%</span>
                            </div>
                            <div className="progress" style={{ height: "8px" }}>
                              <div className="progress-bar bg-primary" style={{ width: `${analysisResult.educationScore}%` }}></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Skills Tags Columns */}
                      <div className="row g-3">
                        <div className="col-md-6">
                          <h6 className="fw-semibold text-success mb-1.5">Matched Required Skills</h6>
                          <div className="d-flex flex-wrap gap-1">
                            {analysisResult.matchedSkills ? (
                              analysisResult.matchedSkills.split(",").map((s, idx) => (
                                <Badge key={idx} variant="success" style={{ fontSize: "0.75rem" }}>{s.trim()}</Badge>
                              ))
                            ) : (
                              <span className="text-muted" style={{ fontSize: "0.85rem" }}>No matches parsed</span>
                            )}
                          </div>
                        </div>

                        <div className="col-md-6">
                          <h6 className="fw-semibold text-danger mb-1.5">Missing Required Skills</h6>
                          <div className="d-flex flex-wrap gap-1">
                            {analysisResult.missingSkills ? (
                              analysisResult.missingSkills.split(",").map((s, idx) => (
                                <Badge key={idx} variant="danger" style={{ fontSize: "0.75rem" }}>{s.trim()}</Badge>
                              ))
                            ) : (
                              <span className="text-muted" style={{ fontSize: "0.85rem" }}>None missing</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {analysisResult.additionalSkills && (
                        <div>
                          <h6 className="fw-semibold text-info mb-1.5">Additional Candidate Skills parsed</h6>
                          <div className="d-flex flex-wrap gap-1">
                            {analysisResult.additionalSkills.split(",").map((s, idx) => (
                              <Badge key={idx} variant="info" style={{ fontSize: "0.75rem" }}>{s.trim()}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Strengths & Considerations */}
                      <div className="row g-3">
                        <div className="col-md-6">
                          <h6 className="fw-semibold text-secondary-custom mb-1.5 d-flex align-items-center gap-1.5">
                            <FaCheckCircle className="text-success" /> Key Profile Strengths
                          </h6>
                          <ul className="ps-3 text-muted mb-0" style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
                            {analysisResult.strengths?.split(" | ").map((str, idx) => (
                              <li key={idx} className="mb-1">{str}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="col-md-6">
                          <h6 className="fw-semibold text-secondary-custom mb-1.5 d-flex align-items-center gap-1.5">
                            <FaExclamationCircle className="text-warning-light" /> Review Considerations
                          </h6>
                          <ul className="ps-3 text-muted mb-0" style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
                            {analysisResult.considerations?.split(" | ").map((con, idx) => (
                              <li key={idx} className="mb-1">{con}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Text Summary */}
                      <div className="p-3 bg-dark bg-opacity-25 rounded border border-secondary border-opacity-10">
                        <h6 className="fw-semibold text-primary-light mb-1 d-flex align-items-center gap-1.5">
                          <FaLightbulb /> AI-Generated Summary
                        </h6>
                        <p className="text-muted mb-0" style={{ fontSize: "0.88rem", lineHeight: 1.6 }}>
                          {analysisResult.aiSummary}
                        </p>
                      </div>

                    </div>
                  )}

                </CardContent>
              </Card>
            </div>

          </div>
        )}

        {/* RECENT ANALYSES VIEW */}
        <div className="mt-5">
          <h4 className="fw-bold mb-3" style={{ color: "var(--text-primary)" }}>Recent Screening Runs</h4>
          {recentAnalyses.length === 0 ? (
            <div className="alert alert-secondary text-center" style={{ fontSize: "0.9rem" }}>
              No candidates screened yet. Choose parameters above to run analyses.
            </div>
          ) : (
            <Card className="surface-custom border-custom">
              <CardContent className="p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Candidate</th>
                        <th>Job Requisition</th>
                        <th>Overall Fit</th>
                        <th>Recommendation</th>
                        <th>Screening Date</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentAnalyses.slice(0, 5).map((app) => (
                        <tr key={app.id}>
                          <td>
                            <div className="fw-bold text-white">{app.candidate_name}</div>
                            <small className="text-muted">{app.email}</small>
                          </td>
                          <td>{app.job_title}</td>
                          <td>{getScoreBadge(app.match_score)}</td>
                          <td>
                            <Badge variant={getScoreBadgeClass(app.match_score)}>{app.recommendation || "Under Review"}</Badge>
                          </td>
                          <td>{new Date(app.created_at).toLocaleDateString()}</td>
                          <td className="text-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="d-inline-flex align-items-center gap-1.5"
                              onClick={() => {
                                setAnalysisResult(app);
                                window.scrollTo({ top: 120, behavior: "smooth" });
                              }}
                            >
                              Load Analysis <FaArrowRight size={10} />
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
        </div>

      </div>
    </AppLayout>
  );
}

export default AICandidates;
