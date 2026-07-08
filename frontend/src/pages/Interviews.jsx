import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
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
  FaCalendarAlt,
  FaSearch,
  FaFileDownload,
  FaRobot,
  FaCheck,
  FaTimes,
  FaUserCircle,
  FaClock,
  FaExchangeAlt,
  FaMapMarkerAlt,
  FaVideo,
  FaStar,
  FaFolderOpen,
  FaUsers
} from "react-icons/fa";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

// Form round types
const ROUND_OPTIONS = [
  { value: "Screening Interview", label: "Screening Interview" },
  { value: "Technical Interview", label: "Technical Interview" },
  { value: "Behavioral Interview", label: "Behavioral Interview" },
  { value: "HR Interview", label: "HR Interview" },
  { value: "Final Interview", label: "Final Interview" }
];

// Form modes
const MODE_OPTIONS = [
  { value: "Video Call", label: "Video Call" },
  { value: "Phone Call", label: "Phone Call" },
  { value: "In-Person", label: "In-Person" }
];

function Interviews() {
  const location = useLocation();
  const preselectedCandidate = location.state?.candidate || null;

  const [interviews, setInterviews] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  // Scheduling Form state
  const [formCandidateId, setFormCandidateId] = useState("");
  const [formRound, setFormRound] = useState("Technical Interview");
  const [formMode, setFormMode] = useState("Video Call");
  const [formInterviewer, setFormInterviewer] = useState("HR Manager");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formDuration, setFormDuration] = useState("30");
  const [formMeetingLink, setFormMeetingLink] = useState("");
  const [scheduling, setScheduling] = useState(false);

  // Calendar state
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Feedback/Scorecard modal state
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [selectedIv, setSelectedIv] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [ratingVal, setRatingVal] = useState("3");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ivsRes, appsRes] = await Promise.all([
        api.get("/api/interviews/all"),
        api.get("/api/applications/all")
      ]);
      setInterviews(ivsRes.data || []);
      setCandidates(appsRes.data || []);

      // Pre-select applicant context if passed
      if (preselectedCandidate) {
        setFormCandidateId(preselectedCandidate.id);
      } else if (appsRes.data?.length > 0) {
        // Pre-select first eligible candidate
        const eligible = appsRes.data.filter(c => c.status !== "Rejected");
        if (eligible.length > 0) {
          setFormCandidateId(eligible[0].id);
        }
      }
    } catch (err) {
      console.warn("Failed to load interview dashboard datasets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter candidates who are NOT rejected for scheduling dropdown
  const eligibleCandidates = candidates.filter(c => c.status !== "Rejected");

  // Create schedule workflow
  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    if (!formCandidateId || !formDate || !formTime || !formInterviewer) {
      alert("Please fill in all scheduling form parameters.");
      return;
    }

    const app = candidates.find(c => Number(c.id) === Number(formCandidateId));
    if (!app) return;

    setScheduling(true);
    try {
      const payload = {
        candidate_id: app.id,
        application_id: app.id,
        candidate_name: app.candidate_name,
        email: app.email,
        phone: app.phone || "N/A",
        ai_score: app.match_score || 0,
        interview_date: formDate,
        interview_time: formTime,
        mode: formMode,
        interviewer: formInterviewer,
        round: formRound,
        duration: formDuration,
        meeting_link: formMode === "Video Call" ? formMeetingLink : null
      };

      console.log("[Interviews] Scheduling payload:", payload);
      await api.post("/api/interviews", payload);
      alert("Interview scheduled successfully! Candidate status updated to 'Interview'.");
      
      // Clear form
      setFormMeetingLink("");
      setFormDate("");
      setFormTime("");
      
      loadData();
    } catch (err) {
      console.error("[Interviews] Scheduling failed:", err);
      const backendMessage = err.response?.data?.message || err.response?.data?.error || "Failed to schedule interview. Check scheduling conflicts.";
      alert(backendMessage);
    } finally {
      setScheduling(false);
    }
  };

  // Reschedule/Cancel status actions
  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/api/interviews/status/${id}`, { status });
      alert(`Interview status updated to ${status}`);
      loadData();
    } catch (err) {
      alert("Failed to update interview status");
    }
  };

  // Feedback Submission Scorecard
  const triggerFeedback = (iv) => {
    setSelectedIv(iv);
    setFeedbackText("");
    setRatingVal("3");
    setFeedbackOpen(true);
  };

  const handleConfirmFeedback = async () => {
    if (!selectedIv) return;
    if (!feedbackText.trim()) {
      alert("Please enter evaluation comments before completing the scorecard.");
      return;
    }

    setSubmittingFeedback(true);
    try {
      await api.put(`/api/interviews/feedback/${selectedIv.id}`, {
        feedback: feedbackText.trim(),
        rating: parseInt(ratingVal, 10)
      });
      alert("Scorecard and feedback evaluation logged successfully.");
      setFeedbackOpen(false);
      loadData();
    } catch (err) {
      alert("Failed to submit feedback");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Filter list
  const filteredInterviews = interviews.filter(iv => {
    const matchesSearch =
      iv.candidate_name?.toLowerCase().includes(search.toLowerCase()) ||
      iv.email?.toLowerCase().includes(search.toLowerCase()) ||
      iv.interviewer?.toLowerCase().includes(search.toLowerCase()) ||
      iv.round?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = filterStatus === "All" ? true : iv.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Stats calculation
  const totalCount = interviews.length;
  const upcomingCount = interviews.filter(iv => iv.status === "Scheduled").length;
  const completedCount = interviews.filter(iv => iv.status === "Completed").length;
  const cancelledCount = interviews.filter(iv => iv.status === "Cancelled").length;

  // Status Badge Mapper
  const getBadge = (status) => {
    if (status === "Scheduled") return "success";
    if (status === "Completed") return "primary";
    return "danger";
  };

  return (
    <AppLayout>
      <div className="container-fluid px-0 text-white text-start">
        
        {/* HEADER */}
        <div className="mb-4">
          <h2 className="fw-bold mb-1" style={{ color: "var(--text-primary)" }}>Interview Management</h2>
          <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
            Schedule and conduct candidate evaluation rounds, submit structured scorecards, and check conflicts.
          </p>
        </div>

        {/* METRICS ROW */}
        <div className="row g-4 mb-4">
          <div className="col-6 col-md-3">
            <StatCard title="Upcoming Interviews" value={upcomingCount} icon={<FaCalendarAlt />} loading={loading} description="Booked calendar slots" />
          </div>
          <div className="col-6 col-md-3">
            <StatCard title="Evaluation Complete" value={completedCount} icon={<FaCheck />} loading={loading} description="Scorecards logged" />
          </div>
          <div className="col-6 col-md-3">
            <StatCard title="Cancelled Bookings" value={cancelledCount} icon={<FaTimes />} loading={loading} description="Rescheduled rounds" />
          </div>
          <div className="col-6 col-md-3">
            <StatCard title="Total Scheduled" value={totalCount} icon={<FaUsers />} loading={loading} description="Total metrics log" />
          </div>
        </div>

        <div className="row g-4">
          
          {/* LEFT COLUMN: SCHEDULE WIZARD & CALENDAR */}
          <div className="col-lg-5 d-flex flex-column gap-4">
            
            {/* CALENDAR */}
            <Card className="surface-custom border-custom">
              <CardContent className="p-3.5 d-flex flex-column align-items-center justify-content-center">
                <h5 className="fw-bold text-primary align-self-start mb-3">Interview Calendar</h5>
                <Calendar
                  value={calendarDate}
                  onChange={setCalendarDate}
                  className="bg-transparent border-0 w-100 text-white rounded"
                />
              </CardContent>
            </Card>

            {/* SCHEDULE WIZARD FORM */}
            <Card className="surface-custom border-custom">
              <CardContent className="p-4">
                <h5 className="fw-bold text-primary mb-3">Schedule New Round</h5>
                
                <form onSubmit={handleScheduleInterview} className="d-flex flex-column gap-3">
                  <div>
                    <label className="form-label-custom mb-1">Select Candidate Requisition</label>
                    <Select
                      value={formCandidateId}
                      onChange={(e) => setFormCandidateId(e.target.value)}
                      options={eligibleCandidates.map(c => ({
                        value: c.id,
                        label: `${c.candidate_name} — ${c.job_title}`
                      }))}
                    />
                  </div>

                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label-custom mb-1">Interview Round</label>
                      <Select
                        value={formRound}
                        onChange={(e) => setFormRound(e.target.value)}
                        options={ROUND_OPTIONS}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label-custom mb-1">Interview Type</label>
                      <Select
                        value={formMode}
                        onChange={(e) => setFormMode(e.target.value)}
                        options={MODE_OPTIONS}
                      />
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label-custom mb-1">Date</label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label-custom mb-1">Start Time</label>
                      <input
                        type="time"
                        className="form-control"
                        required
                        value={formTime}
                        onChange={(e) => setFormTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label-custom mb-1">Duration</label>
                      <Select
                        value={formDuration}
                        onChange={(e) => setFormDuration(e.target.value)}
                        options={[
                          { value: "15", label: "15 Minutes" },
                          { value: "30", label: "30 Minutes" },
                          { value: "45", label: "45/50 Minutes" },
                          { value: "60", label: "60 Minutes" }
                        ]}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label-custom mb-1">Assigned Interviewer</label>
                      <Select
                        value={formInterviewer}
                        onChange={(e) => setFormInterviewer(e.target.value)}
                        options={[
                          { value: "HR Manager", label: "HR Manager" },
                          { value: "Technical Lead", label: "Technical Lead" },
                          { value: "Engineering Director", label: "Engineering Director" },
                          { value: "Product Lead", label: "Product Lead" }
                        ]}
                      />
                    </div>
                  </div>

                  {formMode === "Video Call" && (
                    <div>
                      <label className="form-label-custom mb-1">Meeting Link (e.g. Google Meet URL)</label>
                      <input
                        type="url"
                        className="form-control"
                        placeholder="https://meet.google.com/abc-defg-hij"
                        value={formMeetingLink}
                        onChange={(e) => setFormMeetingLink(e.target.value)}
                      />
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    loading={scheduling}
                    className="w-100 py-2.5 mt-2 d-flex align-items-center justify-content-center gap-1.5"
                  >
                    <FaCalendarAlt /> Book Schedule Slot
                  </Button>
                </form>

              </CardContent>
            </Card>

          </div>

          {/* RIGHT COLUMN: BOOKINGS LIST & EVALUATIONS */}
          <div className="col-lg-7">
            <Card className="surface-custom border-custom h-100">
              <CardContent className="p-4 d-flex flex-column gap-3.5">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                  <h5 className="fw-bold text-primary mb-0">Interview Pipeline List</h5>
                  
                  <div className="d-flex align-items-center gap-2">
                    <div style={{ minWidth: "120px" }}>
                      <Select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        options={[
                          { value: "All", label: "All Statuses" },
                          { value: "Scheduled", label: "Scheduled" },
                          { value: "Completed", label: "Completed" },
                          { value: "Cancelled", label: "Cancelled" }
                        ]}
                        className="mb-0"
                      />
                    </div>
                  </div>
                </div>

                <div className="position-relative">
                  <FaSearch className="position-absolute text-muted" style={{ left: "12px", top: "14px" }} />
                  <input
                    type="text"
                    className="form-control ps-5"
                    placeholder="Search candidate name, interviewer, round..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                {/* LIST ROWS */}
                <div className="d-flex flex-column gap-3 overflow-y-auto pr-1" style={{ maxHeight: "700px" }}>
                  {filteredInterviews.length === 0 ? (
                    <div className="py-5 text-center text-muted small d-flex flex-column align-items-center gap-2">
                      <FaFolderOpen size={32} className="text-secondary opacity-30" />
                      <span>No scheduled bookings match your selectors.</span>
                    </div>
                  ) : (
                    filteredInterviews.map((iv) => (
                      <Card key={iv.id} className="border-custom shadow-sm" style={{ backgroundColor: "rgba(30, 41, 59, 0.3)" }}>
                        <CardContent className="p-4 text-start">
                          <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                            <div>
                              <h6 className="fw-bold text-white mb-0.5">{iv.candidate_name}</h6>
                              <small className="text-muted d-block">{iv.email}</small>
                            </div>
                            <Badge variant={getBadge(iv.status)}>{iv.status}</Badge>
                          </div>

                          <div className="row g-2 text-muted mb-3.5" style={{ fontSize: "0.85rem" }}>
                            <div className="col-md-6">
                              <strong>Round:</strong> {iv.round || "Technical Interview"}
                            </div>
                            <div className="col-md-6">
                              <strong>Interviewer:</strong> {iv.interviewer || "HR Manager"}
                            </div>
                            <div className="col-md-6">
                              <strong>Schedule:</strong> {iv.interview_date ? new Date(iv.interview_date).toLocaleDateString() : "TBD"} at {iv.interview_time || "TBD"} ({iv.duration || 30} mins)
                            </div>
                            <div className="col-md-6">
                              <strong>Type/Mode:</strong> {iv.mode || "Video Call"}
                            </div>
                          </div>

                          {/* Meeting details */}
                          {iv.mode === "Video Call" && iv.meeting_link && (
                            <div className="p-2.5 rounded bg-dark bg-opacity-25 border border-secondary border-opacity-10 d-flex align-items-center justify-content-between mb-3.5" style={{ fontSize: "0.85rem" }}>
                              <span className="text-truncate text-muted me-2">Link: {iv.meeting_link}</span>
                              <a href={iv.meeting_link} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost p-1 text-primary-light d-flex align-items-center gap-1">
                                Join <FaVideo />
                              </a>
                            </div>
                          )}

                          {/* Evaluations block if completed */}
                          {iv.status === "Completed" && (
                            <div className="p-3 rounded bg-success bg-opacity-5 border border-success border-opacity-15 mb-3.5">
                              <div className="fw-bold text-success-light mb-1 d-flex align-items-center justify-content-between" style={{ fontSize: "0.85rem" }}>
                                <span>Scorecard Evaluation rating:</span>
                                <span className="d-flex align-items-center gap-1">
                                  {iv.rating} <FaStar className="text-warning-light" />
                                </span>
                              </div>
                              <p className="text-muted mb-0" style={{ fontSize: "0.85rem", lineHeight: 1.4 }}>{iv.feedback}</p>
                            </div>
                          )}

                          {/* Recruiter Actions */}
                          <div className="d-flex gap-2 justify-content-end border-top pt-3" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                            {iv.status === "Scheduled" && (
                              <>
                                <Button variant="destructive" size="sm" onClick={() => handleUpdateStatus(iv.id, "Cancelled")}>
                                  Cancel Booking
                                </Button>
                                <Button variant="primary" size="sm" onClick={() => triggerFeedback(iv)}>
                                  Evaluate & Submit Scorecard
                                </Button>
                              </>
                            )}
                          </div>

                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

        </div>

        {/* FEEDBACK SCORECARD FORM MODAL */}
        {feedbackOpen && selectedIv && (
          <Modal
            isOpen={feedbackOpen}
            onClose={() => setFeedbackOpen(false)}
            title="Interview Evaluation Scorecard"
            size="sm"
            footer={
              <>
                <Button variant="ghost" onClick={() => setFeedbackOpen(false)}>Cancel</Button>
                <Button variant="primary" loading={submittingFeedback} onClick={handleConfirmFeedback}>
                  Submit Evaluation
                </Button>
              </>
            }
          >
            <div className="text-start text-white">
              <div className="mb-3">
                <span className="text-muted small">Candidate:</span>
                <div className="fw-bold">{selectedIv.candidate_name}</div>
                <small className="text-muted">{selectedIv.round} | Interviewer: {selectedIv.interviewer}</small>
              </div>

              <div className="mb-3">
                <label className="form-label-custom mb-1">Job Competency Scorecard Rating</label>
                <Select
                  value={ratingVal}
                  onChange={(e) => setRatingVal(e.target.value)}
                  options={[
                    { value: "5", label: "5 — Strongly Exceeds Expectations" },
                    { value: "4", label: "4 — Exceeds Expectations" },
                    { value: "3", label: "3 — Meets Expectations" },
                    { value: "2", label: "2 — Partially Meets Expectations" },
                    { value: "1", label: "1 — Does Not Meet Expectations" }
                  ]}
                />
              </div>

              <div>
                <label className="form-label-custom mb-1">Evaluation Assessment Feedback</label>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="Record interview notes, technical competency feedback, role fits, or review suggestions..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                />
              </div>
            </div>
          </Modal>
        )}

      </div>
    </AppLayout>
  );
}

export default Interviews;
