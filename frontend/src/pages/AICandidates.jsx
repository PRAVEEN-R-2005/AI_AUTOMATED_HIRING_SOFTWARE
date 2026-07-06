import { useEffect, useState } from "react";
import api from "../services/api";
import { FaCalendarAlt } from "react-icons/fa";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function AICandidates() {
    const [candidates, setCandidates] = useState([]);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [interviewData, setInterviewData] = useState({
        date: "",
        time: "",
        mode: "Video Call",
    });

    const fetchCandidates = async () => {
        try {
            const response = await api.get("/api/applications/all");
            const shortlistedCandidates = response.data.filter(
                (candidate) => candidate.status === "Shortlisted"
            );
            // Sort by match_score descending
            shortlistedCandidates.sort((a, b) => (b.match_score || b.ai_score || 0) - (a.match_score || a.ai_score || 0));
            setTimeout(() => {
                setCandidates(shortlistedCandidates);
            }, 0);
        } catch (error) {
            console.error("Failed to fetch AI candidates, using demo data:", error);
            const demoData = [
                {
                    id: 1,
                    candidate_name: "Alice Johnson",
                    email: "alice.johnson@gmail.com",
                    phone: "+1 (555) 019-9922",
                    status: "Shortlisted",
                    match_score: 87,
                    resume_file: "1781694668117.pdf"
                },
                {
                    id: 4,
                    candidate_name: "Diana Prince",
                    email: "diana.prince@gmail.com",
                    phone: "+1 (555) 017-7788",
                    status: "Shortlisted",
                    match_score: 78,
                    resume_file: "1782117061685.pdf"
                }
            ];
            setTimeout(() => {
                setCandidates(demoData);
            }, 0);
        }
    };

    useEffect(() => {
        fetchCandidates();
    }, []);

    const rejectCandidate = async (id) => {
        try {
            await api.put(`/api/applications/reject/${id}`);
            alert("Candidate Rejected Successfully");
            fetchCandidates();
        } catch (error) {
            console.error(error);
        }
    };

    const scheduleInterview = async () => {
        try {
            const payload = {
                candidate_name: selectedCandidate.candidate_name,
                email: selectedCandidate.email,
                phone: selectedCandidate.phone,
                ai_score: selectedCandidate.match_score || selectedCandidate.ai_score || 0,
                interview_date: interviewData.date,
                interview_time: interviewData.time,
                mode: interviewData.mode,
                interviewer: "HR Manager",
            };
            await api.post("/api/interviews", payload);
            alert("Interview scheduled successfully");
            setShowModal(false);
            setInterviewData({ date: "", time: "", mode: "Video Call" });
            fetchCandidates();
        } catch (error) {
            console.error(error);
        }
    };

    const getBadge = (status) => {
        if (status === "Pending") return "warning";
        if (status === "Shortlisted") return "primary";
        if (status === "Rejected") return "danger";
        if (status === "Interview Scheduled") return "success";
        return "secondary";
    };

    const getMatchLabel = (score) => {
        if (score >= 80) return "Excellent Match";
        if (score >= 60) return "Strong Match";
        if (score >= 40) return "Good Match";
        return "Need Review";
    };

    const filteredCandidates = candidates.filter((candidate) =>
        candidate.candidate_name.toLowerCase().includes(search.toLowerCase()) ||
        candidate.email.toLowerCase().includes(search.toLowerCase()) ||
        candidate.phone.includes(search)
    );

    return (
        <>
            <Navbar />
            <div className="d-flex">
                <Sidebar />
                <div className="container-fluid p-4">
                    <h1 className="mb-4">AI Matched Candidates</h1>

                    <input
                        className="form-control mb-4"
                        placeholder="Search Candidate"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <div className="row g-4">
                        {filteredCandidates.length ? (
                            filteredCandidates.map((candidate) => (
                                <div className="col-md-4" key={candidate.id}>
                                    <div className="card shadow-sm h-100">
                                        <div className="card-body d-flex flex-column">
                                            <div className="mb-3">
                                                <h5 className="mb-1">{candidate.candidate_name}</h5>
                                                <p className="mb-1 text-muted small">{candidate.email}</p>
                                                <p className="mb-0 text-muted small">{candidate.phone}</p>
                                            </div>

                                            <div className="mb-3">
                                                <span className={`badge ${candidate.match_score >= 80 ? "bg-success" : candidate.match_score >= 60 ? "bg-primary" : candidate.match_score >= 40 ? "bg-warning" : "bg-danger"}`}>
                                                    {getMatchLabel(candidate.match_score)}
                                                </span>
                                            </div>

                                            <div className="mb-3">
                                                <div className="progress" style={{ height: "20px" }}>
                                                    <div
                                                        className={`progress-bar ${candidate.match_score >= 80 ? "bg-success" : candidate.match_score >= 60 ? "bg-primary" : candidate.match_score >= 40 ? "bg-warning" : "bg-danger"}`}
                                                        style={{ width: `${candidate.match_score || 0}%` }}
                                                    >
                                                        <strong>{candidate.match_score || 0}%</strong>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <span className={`badge bg-${getBadge(candidate.status)}`}>{candidate.status}</span>
                                            </div>

                                            <div className="mb-3">
                                                <a
                                                    href={`/uploads/resumes/${candidate.resume_file}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="btn btn-outline-danger btn-sm w-100"
                                                >
                                                    📄 View Resume
                                                </a>
                                            </div>

                                            <div className="mt-auto d-flex flex-wrap gap-2">
                                                <button
                                                    className="btn btn-primary btn-sm flex-grow-1"
                                                    onClick={() => {
                                                        setSelectedCandidate(candidate);
                                                        setShowModal(true);
                                                    }}
                                                >
                                                    <FaCalendarAlt className="me-1" /> Schedule
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => rejectCandidate(candidate.id)}
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-12">
                                <div className="alert alert-secondary">No AI matched candidates available.</div>
                            </div>
                        )}
                    </div>

                    {showModal && (
                        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                            <div className="modal-dialog">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h5 className="modal-title">Schedule Interview</h5>
                                        <button
                                            type="button"
                                            className="btn-close"
                                            onClick={() => setShowModal(false)}
                                        ></button>
                                    </div>
                                    <div className="modal-body">
                                        <div className="mb-3">
                                            <label className="form-label">Candidate: {selectedCandidate?.candidate_name}</label>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Date</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={interviewData.date}
                                                onChange={(e) =>
                                                    setInterviewData({
                                                        ...interviewData,
                                                        date: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Time</label>
                                            <input
                                                type="time"
                                                className="form-control"
                                                value={interviewData.time}
                                                onChange={(e) =>
                                                    setInterviewData({
                                                        ...interviewData,
                                                        time: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Mode</label>
                                            <select
                                                className="form-control"
                                                value={interviewData.mode}
                                                onChange={(e) =>
                                                    setInterviewData({
                                                        ...interviewData,
                                                        mode: e.target.value,
                                                    })
                                                }
                                            >
                                                <option>Video Call</option>
                                                <option>Phone Call</option>
                                                <option>In-Person</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => setShowModal(false)}
                                        >
                                            Close
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={scheduleInterview}
                                        >
                                            Schedule
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default AICandidates;
