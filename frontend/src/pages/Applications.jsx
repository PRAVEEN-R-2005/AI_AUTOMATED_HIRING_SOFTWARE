import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function Applications() {
    const [applications, setApplications] = useState([]);
    const [search, setSearch] = useState("");
    const location = useLocation();
    const navigate = useNavigate();
    const selectedJob = location.state?.job;

    const fetchApplications = async () => {
        try {
            const response = await api.get("/api/applications/all");
            const data = response.data;
            setTimeout(() => {
                setApplications(data);
            }, 0);
        } catch (error) {
            console.warn("Failed to fetch applications, using demo data:", error);
            const demoData = [
                {
                    id: 1,
                    candidate_name: "Alice Johnson",
                    email: "alice.johnson@gmail.com",
                    phone: "+1 (555) 019-9922",
                    job_id: 1,
                    status: "Shortlisted",
                    match_score: 87,
                    resume_file: "1781694668117.pdf"
                },
                {
                    id: 2,
                    candidate_name: "Bob Smith",
                    email: "bob.smith@gmail.com",
                    phone: "+1 (555) 014-4433",
                    job_id: 2,
                    status: "Pending",
                    match_score: 92,
                    resume_file: "1781776652145.pdf"
                },
                {
                    id: 3,
                    candidate_name: "Charlie Brown",
                    email: "charlie.brown@gmail.com",
                    phone: "+1 (555) 013-3344",
                    job_id: 2,
                    status: "Rejected",
                    match_score: 35,
                    resume_file: "1782109667233.pdf"
                },
                {
                    id: 4,
                    candidate_name: "Diana Prince",
                    email: "diana.prince@gmail.com",
                    phone: "+1 (555) 017-7788",
                    job_id: 1,
                    status: "Interview Scheduled",
                    match_score: 78,
                    resume_file: "1782117061685.pdf"
                }
            ];
            setTimeout(() => {
                setApplications(demoData);
            }, 0);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const shortlistCandidate = async (id) => {
        try {
            await api.put(`/api/applications/shortlist/${id}`);
            alert("Candidate Shortlisted Successfully");
            fetchApplications();
        } catch (error) {
            console.error(error);
        }
    };

    const rejectCandidate = async (id) => {
        try {
            await api.put(`/api/applications/reject/${id}`);
            alert("Candidate Rejected Successfully");
            fetchApplications();
        } catch (error) {
            console.error(error);
        }
    };

    const runAI = async (id) => {
        try {
            await api.put(`/api/ai/run/${id}`);
            alert("AI Match Score Generated Successfully");
            fetchApplications();
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

    const getMatchStatus = (score) => {
        if (score >= 80) return "Excellent Match";
        if (score >= 60) return "Good Match";
        if (score >= 40) return "Average Match";
        return "Poor Match";
    };

    const selectedJobId = selectedJob?.id ?? selectedJob?.jd_id;

    const filteredApplications = selectedJobId
        ? applications.filter((app) => Number(app.job_id) === Number(selectedJobId))
        : applications;

    const visibleApplications = filteredApplications.filter((app) =>
        app.candidate_name.toLowerCase().includes(search.toLowerCase()) ||
        app.email.toLowerCase().includes(search.toLowerCase()) ||
        app.phone.includes(search)
    );

    const totalCandidates = filteredApplications.length;
    const shortlisted = filteredApplications.filter((app) => app.status === "Shortlisted").length;
    const excellentMatches = filteredApplications.filter((app) => (app.match_score || 0) >= 80).length;
    const averageScore = filteredApplications.length > 0
        ? Math.round(filteredApplications.reduce((sum, app) => sum + (app.match_score || 0), 0) / filteredApplications.length)
        : 0;

    return (
        <>
            <Navbar />
            <div className="d-flex">
                <Sidebar />
                <div className="container-fluid p-4">
                    <h1 className="mb-4">Candidate Applications</h1>

                    {selectedJob && (
                        <div className="card shadow-sm border-0 mb-4">
                            <div className="card-body">
                                <h3 className="text-primary">{selectedJob.title}</h3>
                                <hr />
                                <div className="mb-3">
                                    {selectedJob.skills?.split(",").map((skill, index) => (
                                        <span key={index} className="badge bg-info me-2 mb-2">
                                            {skill.trim()}
                                        </span>
                                    ))}
                                </div>
                                <p className="mb-1"><strong>Experience:</strong> {selectedJob.experience}</p>
                                <p className="mb-1"><strong>Salary:</strong> {selectedJob.salary}</p>
                                <p className="mb-0"><strong>Location:</strong> {selectedJob.location}</p>
                            </div>
                        </div>
                    )}

                    <input
                        className="form-control mb-4"
                        placeholder="Search Candidate"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <div className="row mb-4 g-3">
                            <div className="col-md-3">
                                <div className="card shadow text-center">
                                    <div className="card-body">
                                        <h5>Total Candidates</h5>
                                        <h1>{totalCandidates}</h1>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card shadow text-center">
                                    <div className="card-body">
                                        <h5>Excellent Match</h5>
                                        <h1>{excellentMatches}</h1>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card shadow text-center">
                                    <div className="card-body">
                                        <h5>Average Score</h5>
                                        <h1>{averageScore}%</h1>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card shadow text-center">
                                    <div className="card-body">
                                        <h5>Shortlisted</h5>
                                        <h1>{shortlisted}</h1>
                                    </div>
                                </div>
                            </div>
                        </div>
                    <div className="row g-4">
                        {visibleApplications.length ? (
                            visibleApplications.map((app) => (
                                <div className="col-md-6" key={app.id}>
                                    <div className="card shadow-sm h-100">
                                        <div className="card-body d-flex flex-column">
                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                <div>
                                                    <h5 className="mb-1">{app.candidate_name}</h5>
                                                    <p className="mb-1 text-muted">{app.email}</p>
                                                    <p className="mb-0 text-muted">{app.phone}</p>
                                                </div>
                                                <span className={`badge ${app.match_score >= 80 ? "bg-success" : app.match_score >= 60 ? "bg-primary" : app.match_score >= 40 ? "bg-warning" : "bg-danger"}`}>
                                                    {getMatchStatus(app.match_score)}
                                                </span>
                                            </div>
                                            <div className="mb-3">
                                                <div className="progress" style={{ height: "18px" }}>
                                                    <div
                                                        className={`progress-bar ${app.match_score >= 80 ? "bg-success" : app.match_score >= 60 ? "bg-primary" : app.match_score >= 40 ? "bg-warning" : "bg-danger"}`}
                                                        style={{ width: `${app.match_score || 0}%` }}
                                                    >
                                                        {app.match_score || 0}%
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mb-3">
                                                <span className={`badge bg-${getBadge(app.status)}`}>{app.status}</span>
                                            </div>
                                            <a
    href={`/uploads/resumes/${app.resume_file}`}
    target="_blank"
    rel="noreferrer"
    className="btn btn-danger"
>
    View Resume
</a>
                                            <div className="mt-auto d-flex flex-wrap gap-2">
                                                <button className="btn btn-success btn-sm" onClick={() => runAI(app.id)}>
                                                    Run AI
                                                </button>
                                                <button className="btn btn-primary btn-sm" onClick={() => shortlistCandidate(app.id)}>
                                                    Shortlist
                                                </button>
                                                <button className="btn btn-danger btn-sm" onClick={() => rejectCandidate(app.id)}>
                                                    Reject
                                                </button>
                                                <button
                                                    className="btn btn-dark btn-sm"
                                                    onClick={() => navigate("/interviews", { state: { candidate: app } })}
                                                >
                                                    Schedule Interview
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-12">
                                <div className="alert alert-secondary">No matching candidates found.</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default Applications;
