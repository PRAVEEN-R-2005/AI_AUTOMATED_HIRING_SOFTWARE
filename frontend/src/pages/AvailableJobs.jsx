import { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { FaSearch, FaMapMarkerAlt, FaBriefcase, FaDollarSign, FaClock, FaFilter, FaTimes } from "react-icons/fa";

function AvailableJobs() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [locationFilter, setLocationFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const navigate = useNavigate();

    const fetchJobs = async () => {
        try {
            const response = await api.get("/api/job-descriptions/open");
            setTimeout(() => { setJobs(response.data); setLoading(false); }, 0);
        } catch {
            const demoData = [
                { jdId: 1, title: "AI Engineer (Python)", skills: "Python, PyTorch, LLMs, NLP", experience: "3+ years", salary: "$120,000 - $150,000", location: "Remote", employment_type: "Full-time" },
                { jdId: 2, title: "Frontend Developer", skills: "React, JavaScript, TailwindCSS, HTML", experience: "2+ years", salary: "$80,000 - $100,000", location: "San Francisco, CA", employment_type: "Full-time" },
                { jdId: 3, title: "HR Specialist", skills: "Recruiting, Onboarding, Communication", experience: "1+ years", salary: "$60,000 - $75,000", location: "Remote", employment_type: "Part-time" },
                { jdId: 4, title: "Data Analyst", skills: "SQL, Python, Tableau, Excel", experience: "2+ years", salary: "$70,000 - $90,000", location: "New York, NY", employment_type: "Full-time" },
                { jdId: 5, title: "DevOps Engineer", skills: "AWS, Docker, Kubernetes, CI/CD", experience: "3+ years", salary: "$110,000 - $140,000", location: "Remote", employment_type: "Contract" }
            ];
            setTimeout(() => { setJobs(demoData); setLoading(false); }, 0);
        }
    };

    useEffect(() => { fetchJobs(); }, []);

    const locations = useMemo(() => [...new Set(jobs.map(j => j.location).filter(Boolean))], [jobs]);
    const types = useMemo(() => [...new Set(jobs.map(j => j.employment_type).filter(Boolean))], [jobs]);

    const filteredJobs = useMemo(() => {
        return jobs.filter(job => {
            const q = searchQuery.toLowerCase();
            const matchesSearch = !q || job.title?.toLowerCase().includes(q) || job.skills?.toLowerCase().includes(q) || job.description?.toLowerCase().includes(q);
            const matchesLocation = !locationFilter || job.location === locationFilter;
            const matchesType = !typeFilter || job.employment_type === typeFilter;
            return matchesSearch && matchesLocation && matchesType;
        });
    }, [jobs, searchQuery, locationFilter, typeFilter]);

    const activeFilters = [searchQuery, locationFilter, typeFilter].filter(Boolean).length;

    const clearFilters = () => { setSearchQuery(""); setLocationFilter(""); setTypeFilter(""); };

    return (
        <AppLayout>
            <div className="container-fluid px-0">
                {/* Header */}
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
                    <div>
                        <h2 className="fw-bold mb-1" style={{ fontFamily: "var(--font-sans)", color: "var(--text-primary)" }}>
                            Available Positions
                        </h2>
                        <p className="mb-0" style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                            {filteredJobs.length} position{filteredJobs.length !== 1 ? "s" : ""} available
                        </p>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="card-custom surface-custom border-custom p-3 mb-4" style={{ borderRadius: "var(--radius-md)" }}>
                    <div className="row g-3 align-items-end">
                        <div className="col-md-5">
                            <label className="form-label fw-semibold" style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                <FaSearch className="me-1" /> Search Jobs
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search by title, skills, or keywords…"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{
                                    background: "var(--background)", color: "var(--text-primary)",
                                    border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
                                    padding: "10px 14px", fontSize: "0.9rem"
                                }}
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-semibold" style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                <FaMapMarkerAlt className="me-1" /> Location
                            </label>
                            <select
                                className="form-select"
                                value={locationFilter}
                                onChange={e => setLocationFilter(e.target.value)}
                                style={{
                                    background: "var(--background)", color: "var(--text-primary)",
                                    border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
                                    padding: "10px 14px", fontSize: "0.9rem"
                                }}
                            >
                                <option value="">All Locations</option>
                                {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-semibold" style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                <FaBriefcase className="me-1" /> Type
                            </label>
                            <select
                                className="form-select"
                                value={typeFilter}
                                onChange={e => setTypeFilter(e.target.value)}
                                style={{
                                    background: "var(--background)", color: "var(--text-primary)",
                                    border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
                                    padding: "10px 14px", fontSize: "0.9rem"
                                }}
                            >
                                <option value="">All Types</option>
                                {types.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="col-md-1 d-flex align-items-end">
                            {activeFilters > 0 && (
                                <button
                                    onClick={clearFilters}
                                    className="btn-custom btn-custom-ghost p-2"
                                    style={{ border: "none", background: "transparent", color: "var(--danger, #ef4444)" }}
                                    title="Clear all filters"
                                >
                                    <FaTimes size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                    {activeFilters > 0 && (
                        <div className="mt-2 d-flex align-items-center gap-2">
                            <FaFilter style={{ color: "var(--primary)", fontSize: "0.75rem" }} />
                            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                {activeFilters} filter{activeFilters > 1 ? "s" : ""} active · Showing {filteredJobs.length} result{filteredJobs.length !== 1 ? "s" : ""}
                            </span>
                        </div>
                    )}
                </div>

                {/* Job Cards Grid */}
                {loading ? (
                    <div className="text-center py-5" style={{ color: "var(--text-secondary)" }}>Loading positions…</div>
                ) : filteredJobs.length === 0 ? (
                    <div className="text-center py-5">
                        <FaBriefcase size={48} style={{ color: "var(--text-secondary)", opacity: 0.3, marginBottom: 16 }} />
                        <h5 style={{ color: "var(--text-secondary)" }}>No positions found</h5>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                            Try adjusting your search or filter criteria
                        </p>
                        {activeFilters > 0 && (
                            <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
                        )}
                    </div>
                ) : (
                    <div className="row g-4">
                        {filteredJobs.map((job, index) => (
                            <div className="col-lg-4 col-md-6" key={job.jdId || job.id || `job-fallback-${index}`}>
                                <div
                                    className="card-custom surface-custom border-custom p-4 h-100 d-flex flex-column"
                                    style={{
                                        borderRadius: "var(--radius-md)",
                                        transition: "transform 0.2s ease, box-shadow 0.2s ease",
                                        cursor: "default"
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.1)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                                >
                                    {/* Type Badge */}
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <h5 className="fw-bold mb-0" style={{ fontSize: "1.1rem", color: "var(--primary)", lineHeight: 1.3 }}>
                                            {job.title}
                                        </h5>
                                        {job.employment_type && (
                                            <Badge variant="info">{job.employment_type}</Badge>
                                        )}
                                    </div>

                                    <hr style={{ borderColor: "var(--border)", margin: "0 0 12px 0" }} />

                                    {/* Skills */}
                                    <div className="mb-3">
                                        <h6 className="fw-semibold mb-2" style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                            Required Skills
                                        </h6>
                                        <div className="d-flex flex-wrap gap-1">
                                            {job.skills?.split(",").map((skill, idx) => (
                                                <Badge key={idx} variant={searchQuery && skill.trim().toLowerCase().includes(searchQuery.toLowerCase()) ? "success" : "info"}>
                                                    {skill.trim()}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="mb-3 flex-grow-1" style={{ fontSize: "0.88rem", color: "var(--text-secondary)" }}>
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            <FaClock style={{ flexShrink: 0, opacity: 0.6 }} />
                                            <span><strong>Experience:</strong> {job.experience || "Not specified"}</span>
                                        </div>
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            <FaDollarSign style={{ flexShrink: 0, opacity: 0.6 }} />
                                            <span><strong>Salary:</strong> {job.salary || "Competitive"}</span>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            <FaMapMarkerAlt style={{ flexShrink: 0, opacity: 0.6 }} />
                                            <span><strong>Location:</strong> {job.location || "Not specified"}</span>
                                        </div>
                                    </div>

                                    <Button
                                        variant="primary"
                                        className="w-100 mt-auto"
                                        onClick={() => {
                                            const id = job.jdId || job.id;
                                            if (id) {
                                                navigate(`/apply-job/${id}`, { state: { job } });
                                            }
                                        }}
                                    >
                                        Apply Now
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

export default AvailableJobs;