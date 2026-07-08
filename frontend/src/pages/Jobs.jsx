import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import AppLayout from "../components/layout/AppLayout";
import StatCard from "../components/ui/StatCard";
import { Card, CardContent } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/feedback/EmptyState";
import HiringTeamManager from "../components/ui/HiringTeamManager";
import ErrorState from "../components/feedback/ErrorState";
import {
  FaBriefcase,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaUsers,
  FaSearch,
  FaThLarge,
  FaList,
  FaTrashAlt,
  FaEdit,
  FaCopy,
  FaPlay,
  FaBan,
  FaPlus,
  FaEye,
  FaTimes
} from "react-icons/fa";

function Jobs() {
  const navigate = useNavigate();
  const recruiterRole = localStorage.getItem("role");

  // State Declarations
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid or table

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterLocation, setFilterLocation] = useState("All");
  const [sortBy, setSortBy] = useState("newest"); // newest, oldest, title-asc, title-desc

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Form Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [skillsList, setSkillsList] = useState([]);
  const [experience, setExperience] = useState("");
  const [salary, setSalary] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  // Preview Modal state
  const [previewOpen, setPreviewOpen] = useState(false);

  // Delete Confirm Modal state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [hiringTeamJob, setHiringTeamJob] = useState(null);

  const fetchJobs = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await api.get("/api/job-descriptions");
      setJobs(response.data || []);
    } catch (err) {
      console.warn("Failed to fetch jobs:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Form handlers
  const openCreateModal = () => {
    setEditingJob(null);
    setTitle("");
    setSkillsInput("");
    setSkillsList([]);
    setExperience("");
    setSalary("");
    setLocation("");
    setDescription("");
    setModalOpen(true);
  };

  const openEditModal = (job) => {
    setEditingJob(job);
    setTitle(job.title || "");
    setSkillsList(job.skills ? job.skills.split(",").map(s => s.trim()) : []);
    setSkillsInput("");
    setExperience(job.experience || "");
    setSalary(job.salary || "");
    setLocation(job.location || "");
    setDescription(job.description || "");
    setModalOpen(true);
  };

  const handleAddSkill = (e) => {
    if (e.key === "Enter" || e.type === "click") {
      if (e.key === "Enter") e.preventDefault();
      const val = skillsInput.trim();
      if (val && !skillsList.includes(val)) {
        setSkillsList([...skillsList, val]);
        setSkillsInput("");
      }
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkillsList(skillsList.filter(s => s !== skillToRemove));
  };

  const handleSaveJob = async () => {
    if (!title.trim() || !description.trim() || skillsList.length === 0) {
      alert("Title, Description, and at least one Skill tag are required.");
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        title: title.trim(),
        skills: skillsList.join(", "),
        experience: experience.trim(),
        salary: salary.trim(),
        location: location.trim(),
        description: description.trim()
      };

      if (editingJob) {
        // Edit Action
        await api.put(`/api/job-descriptions/${editingJob.jd_id}`, payload);
        alert("Job Description Updated Successfully");
      } else {
        // Create Action
        await api.post("/api/job-descriptions", payload);
        // Default backend creates as 'Pending' (Draft)
        alert("Job Description Saved as Draft");
      }
      setModalOpen(false);
      fetchJobs();
    } catch (err) {
      console.error("Save failed:", err);
      alert(err.response?.data?.message || "Failed to save job posting");
    } finally {
      setFormLoading(false);
    }
  };

  const handlePublishJob = async (id) => {
    if (!window.confirm("Publish this job description? Active candidates will immediately be able to view and apply.")) return;
    try {
      await api.put(`/api/job-descriptions/publish/${id}`);
      alert("Job Published Successfully");
      fetchJobs();
    } catch (err) {
      alert(err.response?.data?.message || "Publishing failed");
    }
  };

  const handleCloseJob = async (id) => {
    if (!window.confirm("Are you sure you want to close applications for this job opening?")) return;
    try {
      await api.put(`/api/job-descriptions/close/${id}`);
      alert("Job Closed Successfully");
      fetchJobs();
    } catch (err) {
      alert(err.response?.data?.message || "Close operation failed");
    }
  };

  const handleDuplicateJob = async (job) => {
    try {
      const payload = {
        title: `Copy of ${job.title}`,
        skills: job.skills || "",
        experience: job.experience || "",
        salary: job.salary || "",
        location: job.location || "",
        description: job.description || ""
      };
      await api.post("/api/job-descriptions", payload);
      alert("Job Duplicated as Draft Successfully");
      fetchJobs();
    } catch (err) {
      alert("Failed to duplicate job posting");
    }
  };

  const confirmDelete = (job) => {
    setJobToDelete(job);
    setDeleteOpen(true);
  };

  const handleDeleteJob = async () => {
    if (!jobToDelete) return;
    try {
      await api.delete(`/api/job-descriptions/${jobToDelete.jd_id}`);
      alert("Job Description Deleted Successfully");
      setDeleteOpen(false);
      setJobToDelete(null);
      fetchJobs();
    } catch (err) {
      alert("Failed to delete job posting");
    }
  };

  // Helper Stats Calculation
  const getJobStats = () => {
    const total = jobs.length;
    const active = jobs.filter(j => j.status === "Open").length;
    const draft = jobs.filter(j => j.status === "Pending" || !j.status).length;
    const closed = jobs.filter(j => j.status === "Closed").length;
    return { total, active, draft, closed };
  };

  const statsObj = getJobStats();

  // Search & Filters Logic
  const getFilteredJobs = () => {
    let result = [...jobs];

    // Search
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        j =>
          j.title?.toLowerCase().includes(query) ||
          j.skills?.toLowerCase().includes(query) ||
          j.location?.toLowerCase().includes(query)
      );
    }

    // Status Filter
    if (filterStatus !== "All") {
      result = result.filter(j => {
        if (filterStatus === "Active") return j.status === "Open";
        if (filterStatus === "Draft") return j.status === "Pending" || !j.status;
        return j.status === filterStatus;
      });
    }

    // Location Filter
    if (filterLocation !== "All") {
      result = result.filter(j => j.location === filterLocation);
    }

    // Sort Logic
    result.sort((a, b) => {
      if (sortBy === "newest") return b.jd_id - a.jd_id;
      if (sortBy === "oldest") return a.jd_id - b.jd_id;
      if (sortBy === "title-asc") return a.title?.localeCompare(b.title);
      if (sortBy === "title-desc") return b.title?.localeCompare(a.title);
      return 0;
    });

    return result;
  };

  const filteredJobs = getFilteredJobs();

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredJobs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Status Badge Mapper
  const getStatusBadge = (status) => {
    if (status === "Open") return <Badge variant="success">Active</Badge>;
    if (status === "Closed") return <Badge variant="danger">Closed</Badge>;
    return <Badge variant="secondary">Draft</Badge>;
  };

  const uniqueLocations = ["All", ...new Set(jobs.map(j => j.location).filter(Boolean))];

  return (
    <AppLayout>
      <div className="container-fluid px-0 text-white">
        
        {/* 1. HEADER */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <h2 className="fw-bold mb-1" style={{ fontFamily: "var(--font-sans)", color: "var(--text-primary)" }}>
              Job Postings
            </h2>
            <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
              Create, preview, and coordinate your candidate requisitions.
            </p>
          </div>
          <Button variant="primary" className="d-flex align-items-center gap-2" onClick={openCreateModal}>
            <FaPlus size={14} /> Create New Job
          </Button>
        </div>

        {/* 2. REAL JOB STATISTICS */}
        <div className="row g-4 mb-4">
          <div className="col-6 col-md-3">
            <StatCard title="Total Positions" value={statsObj.total} icon={<FaBriefcase />} loading={loading} description="Positions created" />
          </div>
          <div className="col-6 col-md-3">
            <StatCard title="Active Roles" value={statsObj.active} icon={<FaBriefcase />} loading={loading} description="Open for applications" />
          </div>
          <div className="col-6 col-md-3">
            <StatCard title="Draft Postings" value={statsObj.draft} icon={<FaBriefcase />} loading={loading} description="Work in progress" />
          </div>
          <div className="col-6 col-md-3">
            <StatCard title="Closed Roles" value={statsObj.closed} icon={<FaBriefcase />} loading={loading} description="Closed positions" />
          </div>
        </div>

        {/* 3. MANAGEMENT TOOLBAR */}
        <Card className="surface-custom border-custom mb-4">
          <CardContent className="p-3 d-flex flex-column flex-md-row gap-3 align-items-center justify-content-between">
            {/* Search */}
            <div className="position-relative w-100" style={{ maxWidth: "350px" }}>
              <FaSearch className="position-absolute text-muted" style={{ left: "12px", top: "14px" }} />
              <input
                type="text"
                className="form-control ps-5"
                placeholder="Search job title, skills, location..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>

            {/* Filters */}
            <div className="d-flex flex-wrap align-items-center gap-2 w-100 justify-content-md-end">
              <div style={{ minWidth: "130px" }}>
                <Select
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                  options={[
                    { value: "All", label: "All Statuses" },
                    { value: "Active", label: "Active" },
                    { value: "Draft", label: "Draft" },
                    { value: "Closed", label: "Closed" }
                  ]}
                  className="mb-0"
                />
              </div>

              <div style={{ minWidth: "140px" }}>
                <Select
                  value={filterLocation}
                  onChange={(e) => { setFilterLocation(e.target.value); setCurrentPage(1); }}
                  options={uniqueLocations.map(loc => ({ value: loc, label: loc === "All" ? "All Locations" : loc }))}
                  className="mb-0"
                />
              </div>

              <div style={{ minWidth: "130px" }}>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  options={[
                    { value: "newest", label: "Newest First" },
                    { value: "oldest", label: "Oldest First" },
                    { value: "title-asc", label: "Title A-Z" },
                    { value: "title-desc", label: "Title Z-A" }
                  ]}
                  className="mb-0"
                />
              </div>

              {/* View Toggle */}
              <div className="btn-group border border-secondary border-opacity-10 rounded">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`btn btn-custom btn-custom-ghost p-2 ${viewMode === "grid" ? "bg-primary text-white" : "text-muted"}`}
                  aria-label="Grid View"
                  style={{ border: "none" }}
                >
                  <FaThLarge size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`btn btn-custom btn-custom-ghost p-2 ${viewMode === "table" ? "bg-primary text-white" : "text-muted"}`}
                  aria-label="Table View"
                  style={{ border: "none" }}
                >
                  <FaList size={14} />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. CONTENT VIEW */}
        {loading ? (
          <div className="row g-4">
            <div className="col-md-4"><Skeleton variant="rect" width="100%" height={250} /></div>
            <div className="col-md-4"><Skeleton variant="rect" width="100%" height={250} /></div>
            <div className="col-md-4"><Skeleton variant="rect" width="100%" height={250} /></div>
          </div>
        ) : error ? (
          <ErrorState title="Failed to load open positions" onRetry={fetchJobs} />
        ) : filteredJobs.length === 0 ? (
          <EmptyState title="No Jobs Found" description="Try broadening your search term or select other filters." actionText="Reset Filters" onActionClick={() => { setSearch(""); setFilterStatus("All"); setFilterLocation("All"); }} />
        ) : viewMode === "grid" ? (
          /* GRID VIEW */
          <div className="row g-4">
            {currentItems.map((job) => (
              <div className="col-md-6 col-lg-4" key={job.jd_id}>
                <Card className="surface-custom border-custom h-100 d-flex flex-column justify-content-between">
                  <CardContent className="p-4 d-flex flex-column gap-3">
                    <div className="d-flex justify-content-between align-items-start">
                      {getStatusBadge(job.status)}
                      <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                        ID: #{job.jd_id}
                      </div>
                    </div>

                    <div>
                      <h4 className="fw-bold mb-1" style={{ color: "var(--text-primary)", fontSize: "1.2rem" }}>
                        {job.title}
                      </h4>
                      <span className="text-muted" style={{ fontSize: "0.85rem" }}>Created by: {job.created_by || "Recruiter"}</span>
                    </div>

                    <div className="d-flex flex-wrap gap-1">
                      {job.skills?.split(",").slice(0, 3).map((s, idx) => (
                        <Badge key={idx} variant="info" style={{ fontSize: "0.7rem", padding: "3px 6px" }}>
                          {s.trim()}
                        </Badge>
                      ))}
                      {job.skills?.split(",").length > 3 && (
                        <span className="text-muted align-self-center" style={{ fontSize: "0.75rem" }}>
                          +{job.skills.split(",").length - 3} more
                        </span>
                      )}
                    </div>

                    <div className="mt-2 d-flex flex-column gap-1.5" style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      <div className="d-flex align-items-center gap-2">
                        <FaMapMarkerAlt className="text-primary-light" /> <span>{job.location || "Remote"}</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <FaMoneyBillWave className="text-primary-light" /> <span>{job.salary || "Not Specified"}</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <FaBriefcase className="text-primary-light" /> <span>{job.experience || "Not Specified"}</span>
                      </div>
                    </div>
                  </CardContent>

                  <div className="card-custom-footer p-3 bg-dark bg-opacity-25 border-top d-flex gap-2 justify-content-end" style={{ borderColor: "var(--border)" }}>
                    {recruiterRole !== "Hiring Manager" && (
                      <Button variant="ghost" size="sm" title="Hiring Team" onClick={() => setHiringTeamJob(job)}>
                        <FaUsers />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" title="Duplicate Requisition" onClick={() => handleDuplicateJob(job)}>
                      <FaCopy />
                    </Button>
                    <Button variant="ghost" size="sm" title="Edit Position" onClick={() => openEditModal(job)}>
                      <FaEdit />
                    </Button>
                    
                    {/* Status Triggers */}
                    {(job.status === "Pending" || !job.status) && (
                      <Button variant="outline" size="sm" className="btn-custom-sm" onClick={() => handlePublishJob(job.jd_id)}>
                        <FaPlay size={10} className="me-1" /> Publish
                      </Button>
                    )}
                    {job.status === "Open" && (
                      <Button variant="destructive" size="sm" className="btn-custom-sm" onClick={() => handleCloseJob(job.jd_id)}>
                        <FaBan size={10} className="me-1" /> Close
                      </Button>
                    )}
                    {job.status === "Closed" && (
                      <Button variant="outline" size="sm" className="btn-custom-sm" onClick={() => handlePublishJob(job.jd_id)}>
                        Reopen
                      </Button>
                    )}

                    <Button variant="ghost" size="sm" className="text-danger" title="Delete Permanent" onClick={() => confirmDelete(job)}>
                      <FaTrashAlt />
                    </Button>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          /* TABLE VIEW */
          <Card className="surface-custom border-custom">
            <CardContent className="p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Job Info</th>
                      <th>Location</th>
                      <th>Experience</th>
                      <th>Salary</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((job) => (
                      <tr key={job.jd_id}>
                        <td>
                          <div className="fw-bold text-white">{job.title}</div>
                          <small className="text-muted">By: {job.created_by || "Recruiter"}</small>
                        </td>
                        <td>{job.location || "Remote"}</td>
                        <td>{job.experience}</td>
                        <td>{job.salary}</td>
                        <td>{getStatusBadge(job.status)}</td>
                        <td className="text-end">
                          <div className="d-inline-flex gap-1">
                            {recruiterRole !== "Hiring Manager" && (
                              <Button variant="ghost" size="sm" title="Hiring Team" onClick={() => setHiringTeamJob(job)}>
                                <FaUsers />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" title="Duplicate" onClick={() => handleDuplicateJob(job)}>
                              <FaCopy />
                            </Button>
                            <Button variant="ghost" size="sm" title="Edit" onClick={() => openEditModal(job)}>
                              <FaEdit />
                            </Button>
                            
                            {(job.status === "Pending" || !job.status) && (
                              <Button variant="outline" size="sm" className="btn-custom-sm py-1 px-2" onClick={() => handlePublishJob(job.jd_id)}>
                                Publish
                              </Button>
                            )}
                            {job.status === "Open" && (
                              <Button variant="destructive" size="sm" className="btn-custom-sm py-1 px-2" onClick={() => handleCloseJob(job.jd_id)}>
                                Close
                              </Button>
                            )}
                            {job.status === "Closed" && (
                              <Button variant="outline" size="sm" className="btn-custom-sm py-1 px-2" onClick={() => handlePublishJob(job.jd_id)}>
                                Reopen
                              </Button>
                            )}

                            <Button variant="ghost" size="sm" className="text-danger" title="Delete" onClick={() => confirmDelete(job)}>
                              <FaTrashAlt />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 5. PAGINATION PANEL */}
        {!loading && totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-4">
            <span className="text-muted" style={{ fontSize: "0.85rem" }}>
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredJobs.length)} of {filteredJobs.length} postings
            </span>
            <div className="d-flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Previous
              </Button>
              {[...Array(totalPages).keys()].map((p) => (
                <Button
                  key={p + 1}
                  variant={currentPage === p + 1 ? "primary" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(p + 1)}
                >
                  {p + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* 6. CREATE / EDIT DIALOG FORM MODAL */}
        {modalOpen && (
          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title={editingJob ? "Edit Job Posting" : "Post a New Requisition"}
            size="lg"
            footer={
              <>
                <Button variant="ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="outline" onClick={() => setPreviewOpen(true)}>
                  <FaEye className="me-1" /> Preview
                </Button>
                <Button variant="primary" loading={formLoading} onClick={() => handleSaveJob()}>
                  Save as Draft
                </Button>
              </>
            }
          >
            <form onSubmit={(e) => { e.preventDefault(); handleSaveJob(); }} className="d-flex flex-column gap-3 text-start">
              <div className="row g-3">
                <div className="col-md-6">
                  <Input
                    id="title"
                    label="Job Title"
                    placeholder="e.g. Senior React Developer"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <Input
                    id="location"
                    label="Location / Mode"
                    placeholder="e.g. New York, NY / Remote"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <Input
                    id="experience"
                    label="Experience Target"
                    placeholder="e.g. 3+ years"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <Input
                    id="salary"
                    label="Salary Bracket"
                    placeholder="e.g. $120,000 - $140,000"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                  />
                </div>
              </div>

              {/* Skills Tag Management */}
              <div>
                <label className="form-label-custom mb-1">Required Professional Skills</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Type a skill and press Enter (e.g. JavaScript)"
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    onKeyDown={handleAddSkill}
                  />
                  <Button type="button" variant="secondary" onClick={handleAddSkill}>
                    Add
                  </Button>
                </div>
                <div className="d-flex flex-wrap gap-1.5 mt-2">
                  {skillsList.map((skill, index) => (
                    <span
                      key={index}
                      className="badge-custom badge-custom-primary d-inline-flex align-items-center gap-1.5"
                      style={{ fontSize: "0.8rem", padding: "5px 10px" }}
                    >
                      {skill}
                      <FaTimes
                        style={{ cursor: "pointer" }}
                        onClick={() => handleRemoveSkill(skill)}
                        size={10}
                      />
                    </span>
                  ))}
                  {skillsList.length === 0 && (
                    <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                      * No skills added. Add at least one.
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="description" className="form-label-custom mb-1">Detailed Description</label>
                <textarea
                  id="description"
                  className="form-control"
                  rows="6"
                  placeholder="Enter detailed job criteria, requirements, and benefits..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
            </form>
          </Modal>
        )}

        {/* 7. PREVIEW MODAL */}
        {previewOpen && (
          <Modal
            isOpen={previewOpen}
            onClose={() => setPreviewOpen(false)}
            title="Job Description Preview"
            size="md"
            footer={
              <Button variant="primary" onClick={() => setPreviewOpen(false)}>
                Back to Editing
              </Button>
            }
          >
            <div className="d-flex flex-column gap-3 text-white text-start">
              <div>
                <h3 className="fw-bold mb-0 text-primary">{title || "Untitled Job"}</h3>
                <small className="text-muted">Target Location: {location || "Remote"}</small>
              </div>
              <hr style={{ borderColor: "var(--border)" }} />
              
              <div className="row g-2">
                <div className="col-6">
                  <span className="text-muted d-block" style={{ fontSize: "0.8rem" }}>Experience level</span>
                  <strong>{experience || "Not Specified"}</strong>
                </div>
                <div className="col-6">
                  <span className="text-muted d-block" style={{ fontSize: "0.8rem" }}>Estimated Salary</span>
                  <strong>{salary || "Not Specified"}</strong>
                </div>
              </div>

              <div>
                <h6 className="fw-semibold text-secondary-custom mb-1">Skills Stack Required</h6>
                <div className="d-flex flex-wrap gap-1 mt-1">
                  {skillsList.map((skill, i) => (
                    <Badge key={i} variant="info">
                      {skill}
                    </Badge>
                  ))}
                  {skillsList.length === 0 && <span className="text-muted">None specified</span>}
                </div>
              </div>

              <div>
                <h6 className="fw-semibold text-secondary-custom mb-1">Position Description</h6>
                <p className="mb-0 text-muted" style={{ fontSize: "0.9rem", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                  {description || "No description provided."}
                </p>
              </div>
            </div>
          </Modal>
        )}

        {/* 8. DELETE CONFIRMATION DIALOG */}
        {deleteOpen && (
          <Modal
            isOpen={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            title="Delete Posting"
            size="sm"
            footer={
              <>
                <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteJob}>
                  Confirm Delete
                </Button>
              </>
            }
          >
            <p className="text-muted mb-0 text-start" style={{ fontSize: "0.95rem" }}>
              Are you sure you want to permanently delete **{jobToDelete?.title}**? All candidate applications associated with this posting will remain intact but the posting itself will be deleted.
            </p>
          </Modal>
        )}

        {/* 9. HIRING TEAM ASSIGNMENTS MODAL */}
        {hiringTeamJob && (
          <Modal
            isOpen={!!hiringTeamJob}
            onClose={() => setHiringTeamJob(null)}
            title="Manage Hiring Team"
            size="lg"
          >
            <HiringTeamManager jobId={hiringTeamJob.jd_id} jobTitle={hiringTeamJob.title} />
          </Modal>
        )}

      </div>
    </AppLayout>
  );
}

export default Jobs;
