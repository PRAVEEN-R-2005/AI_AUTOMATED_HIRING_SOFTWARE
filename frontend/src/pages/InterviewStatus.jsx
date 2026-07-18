import { useEffect, useState } from "react";
import api from "../services/api";
import AppLayout from "../components/layout/AppLayout";
import { Card, CardContent } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import {
  FaVideo,
  FaFolderOpen
} from "react-icons/fa";

function InterviewStatus() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const email = localStorage.getItem("email");
      const response = await api.get(`/api/interviews/email/${email}`);
      setInterviews(response.data || []);
    } catch (error) {
      console.log("Failed to fetch candidate interview status logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

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
          <h2 className="fw-bold mb-1" style={{ color: "var(--text-primary)" }}>My Interviews</h2>
          <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
            Track your upcoming scheduled interview rounds and virtual meeting details.
          </p>
        </div>

        {/* DETAILS TABLE */}
        <Card className="surface-custom border-custom">
          <CardContent className="p-0">
            {loading ? (
              <div className="py-5 text-center text-muted">Loading scheduled interview details...</div>
            ) : interviews.length === 0 ? (
              <div className="py-5 text-center text-muted d-flex flex-column align-items-center gap-2">
                <FaFolderOpen size={36} className="text-secondary opacity-30" />
                <span>No scheduled interviews found for your account.</span>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 text-white">
                  <thead>
                    <tr className="table-dark">
                      <th>Round</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Mode</th>
                      <th>Status</th>
                      <th>Meeting / Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interviews.map((iv, index) => (
                      <tr key={iv.id || `iv-fallback-${index}`}>
                        <td>
                          <strong className="text-primary-light">{iv.round || "Technical Interview"}</strong>
                          <small className="text-muted d-block" style={{ fontSize: "0.75rem" }}>ID: #{iv.id}</small>
                        </td>
                        <td>{iv.interview_date ? new Date(iv.interview_date).toLocaleDateString() : "TBD"}</td>
                        <td>{iv.interview_time || "TBD"} ({iv.duration || 30} mins)</td>
                        <td>{iv.mode || iv.interview_mode || "Video Call"}</td>
                        <td>
                          <Badge variant={getBadge(iv.status)}>{iv.status}</Badge>
                        </td>
                        <td>
                          {iv.status === "Scheduled" && (iv.mode || iv.interview_mode) === "Video Call" && iv.meeting_link ? (
                            <a
                              href={iv.meeting_link}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1.5"
                              style={{ textDecoration: "none" }}
                            >
                              <FaVideo /> Join Meeting
                            </a>
                          ) : (
                            <span className="text-muted small">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </AppLayout>
  );
}

export default InterviewStatus;