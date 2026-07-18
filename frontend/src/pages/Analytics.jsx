import { useEffect, useState } from "react";
import api from "../services/api";
import AppLayout from "../components/layout/AppLayout";
import StatCard from "../components/ui/StatCard";
import { Card, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Select from "../components/ui/Select";
import Skeleton from "../components/ui/Skeleton";
import ErrorState from "../components/feedback/ErrorState";
import Modal from "../components/ui/Modal";
import {
  FaFileCsv,
  FaRobot,
  FaFileAlt,
  FaUniversalAccess
} from "react-icons/fa";
import { Doughnut, Bar } from "react-chartjs-2";

function Analytics() {
  // Datasets
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Filters state
  const [filterJobId, setFilterJobId] = useState("All");
  const [filterDateRange, setFilterDateRange] = useState("30"); // 7, 30, 90, all
  const [showAccessibleData, setShowAccessibleData] = useState(false);

  // Report Generator parameters
  const [reportType, setReportType] = useState("Overview");
  const [reportPreviewOpen, setReportPreviewOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      const [jobsRes, appsRes, ivsRes] = await Promise.all([
        api.get("/api/job-descriptions"),
        api.get("/api/applications/all"),
        api.get("/api/interviews/all")
      ]);
      setJobs(jobsRes.data || []);
      setApplications(appsRes.data || []);
      setInterviews(ivsRes.data || []);
    } catch (err) {
      console.warn("Failed to load analytics datasets:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter application data based on Job ID and Date Range
  const getFilteredData = () => {
    let apps = [...applications];
    let ivs = [...interviews];

    // 1. Job Requisition Filter
    if (filterJobId !== "All") {
      apps = apps.filter(a => Number(a.job_id) === Number(filterJobId));
      ivs = ivs.filter(i => Number(i.candidate_id) === Number(filterJobId) || apps.some(a => a.id === i.candidate_id));
    }

    // 2. Date Range Filter
    if (filterDateRange !== "all") {
      const days = parseInt(filterDateRange, 10);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);

      apps = apps.filter(a => new Date(a.created_at) >= cutoff);
      ivs = ivs.filter(i => new Date(i.interview_date) >= cutoff);
    }

    return { apps, ivs };
  };

  const { apps: filteredApps, ivs: filteredIvs } = getFilteredData();

  // Metrics Calculations (Safeguarded against division by zero)
  const totalAppsCount = filteredApps.length;
  const hiresCount = filteredApps.filter(a => a.status === "Hired").length;
  const rejectionsCount = filteredApps.filter(a => a.status === "Rejected").length;
  const shortlistedCount = filteredApps.filter(a => a.status === "Shortlisted").length;
  const screeningCount = filteredApps.filter(a => a.status === "Screening").length;
  const interviewCount = filteredApps.filter(a => a.status === "Interview").length;

  const hiringRate = totalAppsCount > 0 ? ((hiresCount / totalAppsCount) * 100).toFixed(1) : "0.0";
  const rejectionRate = totalAppsCount > 0 ? ((rejectionsCount / totalAppsCount) * 100).toFixed(1) : "0.0";
  const shortlistingRate = totalAppsCount > 0 ? ((shortlistedCount / totalAppsCount) * 100).toFixed(1) : "0.0";

  // Match score distributions
  const scoreDistribution = {
    "Low Fit (0-40%)": filteredApps.filter(a => a.match_score !== null && a.match_score <= 40).length,
    "Potential Fit (41-60%)": filteredApps.filter(a => a.match_score > 40 && a.match_score <= 60).length,
    "Good Fit (61-80%)": filteredApps.filter(a => a.match_score > 60 && a.match_score <= 80).length,
    "Strong Fit (81-100%)": filteredApps.filter(a => a.match_score > 80).length,
    "Not Screened": filteredApps.filter(a => a.match_score === null).length
  };

  // Interview outcomes
  const totalInterviews = filteredIvs.length;
  const scheduledIvs = filteredIvs.filter(i => i.status === "Scheduled").length;
  const completedIvs = filteredIvs.filter(i => i.status === "Completed").length;
  const cancelledIvs = filteredIvs.filter(i => i.status === "Cancelled").length;

  const avgInterviewScore = (() => {
    const scored = filteredIvs.filter(i => i.rating !== null);
    if (scored.length === 0) return "N/A";
    const sum = scored.reduce((acc, curr) => acc + curr.rating, 0);
    return (sum / scored.length).toFixed(1);
  })();

  // Chart configuration: Funnel Progression
  const funnelChartData = {
    labels: ["Applied", "Screening", "Shortlisted", "Interview", "Hired"],
    datasets: [
      {
        label: "Candidates",
        data: [
          totalAppsCount,
          totalAppsCount - rejectionsCount, // screening flow estimates
          shortlistedCount + interviewCount + hiresCount,
          interviewCount + hiresCount,
          hiresCount
        ],
        backgroundColor: [
          "rgba(59, 130, 246, 0.6)",
          "rgba(14, 165, 233, 0.6)",
          "rgba(168, 85, 247, 0.6)",
          "rgba(236, 72, 153, 0.6)",
          "rgba(34, 197, 94, 0.6)"
        ],
        borderColor: "var(--border)",
        borderWidth: 1
      }
    ]
  };

  // Chart configuration: Match Scores split
  const scoresChartData = {
    labels: Object.keys(scoreDistribution),
    datasets: [
      {
        data: Object.values(scoreDistribution),
        backgroundColor: [
          "#ef4444", // red
          "#f59e0b", // yellow
          "#3b82f6", // blue
          "#22c55e", // green
          "#64748b"  // slate
        ],
        borderWidth: 1
      }
    ]
  };

  // Chart configuration: Interview Splits
  const interviewChartData = {
    labels: ["Scheduled", "Completed", "Cancelled"],
    datasets: [
      {
        data: [scheduledIvs, completedIvs, cancelledIvs],
        backgroundColor: ["#10b981", "#3b82f6", "#ef4444"],
        borderWidth: 1
      }
    ]
  };

  // Export CSV generator helper
  const handleExportCSV = () => {
    let headers = ["ID", "Candidate Name", "Email", "Applied Job", "AI Match Score", "Interview Status", "Applied Date"];
    let csvRows = [headers.join(",")];

    filteredApps.forEach(app => {
      const row = [
        app.id,
        `"${app.candidate_name.replace(/"/g, '""')}"`,
        app.email,
        `"${app.job_title?.replace(/"/g, '""') || "N/A"}"`,
        app.match_score !== null ? `${app.match_score}%` : "N/A",
        app.status,
        new Date(app.created_at).toLocaleDateString()
      ];
      csvRows.push(row.join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ATS_Recruitment_Report_${filterDateRange}Days.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert("Report CSV download initiated.");
  };

  return (
    <AppLayout>
      <div className="container-fluid px-0 text-white text-start">
        
        {/* HEADER */}
        <div className="mb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <h2 className="fw-bold mb-1" style={{ color: "var(--text-primary)" }}>Recruitment Analytics</h2>
            <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
              Explore application flows, funnel conversions, interview statistics, and AI screening distribution.
            </p>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="ghost"
              className="d-flex align-items-center gap-1.5"
              onClick={() => setShowAccessibleData(!showAccessibleData)}
            >
              <FaUniversalAccess /> {showAccessibleData ? "Hide Table Mode" : "Show Table Mode"}
            </Button>
            <Button
              variant="primary"
              className="d-flex align-items-center gap-1.5"
              onClick={() => setReportPreviewOpen(true)}
            >
              <FaFileAlt /> Run Reports Wizard
            </Button>
          </div>
        </div>

        {/* RESPONSIBLE AI HEALTH DISCLAIMER */}
        <div className="alert border border-primary border-opacity-15 bg-primary bg-opacity-5 p-3 mb-4 d-flex gap-3 align-items-start" style={{ fontSize: "0.85rem" }}>
          <FaRobot className="text-primary-light mt-0.5" size={18} />
          <div>
            <strong className="text-white d-block mb-0.5">Responsible AI and Decision Support Statement:</strong>
            <span className="text-muted">
              AI screening scores summarize text compatibilities for support purposes. Match insights do not assert qualification proof, and final selections remain human recruiter decisions.
            </span>
          </div>
        </div>

        {/* CONTROLLERS & FILTERS */}
        <Card className="surface-custom border-custom mb-4">
          <CardContent className="p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <span className="text-muted me-2" style={{ fontSize: "0.85rem" }}>Filter Requisition:</span>
              <div style={{ minWidth: "200px" }}>
                <Select
                  value={filterJobId}
                  onChange={(e) => setFilterJobId(e.target.value)}
                  options={[
                    { value: "All", label: "All Job Descriptions" },
                    ...jobs.map(j => ({ value: j.jdId, label: j.title }))
                  ]}
                  className="mb-0"
                />
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <span className="text-muted" style={{ fontSize: "0.85rem" }}>Timeframe:</span>
              <div style={{ minWidth: "150px" }}>
                <Select
                  value={filterDateRange}
                  onChange={(e) => setFilterDateRange(e.target.value)}
                  options={[
                    { value: "7", label: "Last 7 Days" },
                    { value: "30", label: "Last 30 Days" },
                    { value: "90", label: "Last 90 Days" },
                    { value: "all", label: "All-Time Records" }
                  ]}
                  className="mb-0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* METRICS ROW */}
        {loading ? (
          <div className="row g-3 mb-4">
            {[...Array(4).keys()].map(i => (
              <div className="col-md-3" key={i}><Skeleton variant="rect" width="100%" height={100} /></div>
            ))}
          </div>
        ) : (
          <div className="row g-4 mb-4">
            <div className="col-md-3">
              <StatCard title="Processed Applications" value={totalAppsCount} description="Total candidate files" />
            </div>
            <div className="col-md-3">
              <StatCard title="Overall Hiring Rate" value={`${hiringRate}%`} description={`${hiresCount} candidates hired`} />
            </div>
            <div className="col-md-3">
              <StatCard title="Interviews Evaluated" value={completedIvs} description={`Average rating: ${avgInterviewScore}`} />
            </div>
            <div className="col-md-3">
              <StatCard title="Disqualification Rate" value={`${rejectionRate}%`} description={`${rejectionsCount} records archived`} />
            </div>
          </div>
        )}

        {/* ACCESSIBLE TABLES DATA REPLACEMENT */}
        {showAccessibleData && (
          <Card className="surface-custom border-custom mb-4 bg-opacity-25">
            <CardContent className="p-4">
              <h5 className="fw-bold text-primary mb-3">Accessible Data Summary Table</h5>
              <div className="table-responsive">
                <table className="table table-hover mb-0 text-white">
                  <thead>
                    <tr>
                      <th>Metric Attribute</th>
                      <th>Calculated Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Total Processed Candidates</td>
                      <td>{totalAppsCount}</td>
                    </tr>
                    <tr>
                      <td>Successful Hires</td>
                      <td>{hiresCount} ({hiringRate}%)</td>
                    </tr>
                    <tr>
                      <td>Disqualified Rejections</td>
                      <td>{rejectionsCount} ({rejectionRate}%)</td>
                    </tr>
                    <tr>
                      <td>Shortlisted for Review</td>
                      <td>{shortlistedCount} ({shortlistingRate}%)</td>
                    </tr>
                    <tr>
                      <td>Pending Assessment</td>
                      <td>{screeningCount}</td>
                    </tr>
                    <tr>
                      <td>Completed Interviews</td>
                      <td>{completedIvs} (Average Rating: {avgInterviewScore}/5)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CORE ANALYTICS GRAPHICS CHARTS */}
        {error ? (
          <ErrorState title="Failed to compute recruitment metrics" onRetry={loadData} />
        ) : (
          <div className="row g-4 mb-4">
            
            {/* FUNNEL PROGRESSION */}
            <div className="col-lg-7">
              <Card className="surface-custom border-custom h-100">
                <CardContent className="p-4 d-flex flex-column gap-3">
                  <h5 className="fw-bold text-primary mb-0">Hiring Pipeline Funnel</h5>
                  <p className="text-muted small mb-0">Estimates candidate conversion counts sequentially through active stages.</p>
                  
                  <div style={{ height: "260px" }} className="d-flex align-items-center justify-content-center">
                    <Bar
                      data={funnelChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI SCORE DENSITY */}
            <div className="col-lg-5">
              <Card className="surface-custom border-custom h-100">
                <CardContent className="p-4 d-flex flex-column gap-3">
                  <h5 className="fw-bold text-primary mb-0">AI Match Score Distribution</h5>
                  <p className="text-muted small mb-0">Distribution of candidate compatibility weights.</p>
                  
                  <div style={{ height: "260px" }} className="d-flex align-items-center justify-content-center">
                    <Doughnut
                      data={scoresChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: "right", labels: { color: "#94a3b8" } } }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        )}

        <div className="row g-4 mb-4">
          
          {/* INTERVIEW STATUS CHART */}
          <div className="col-md-6">
            <Card className="surface-custom border-custom">
              <CardContent className="p-4 d-flex flex-column gap-3">
                <h5 className="fw-bold text-primary mb-0">Scheduled Interview Split</h5>
                <p className="text-muted small mb-0">Ratio of upcoming, completed, and cancelled rounds.</p>
                <div style={{ height: "230px" }} className="d-flex align-items-center justify-content-center">
                  <Doughnut
                    data={interviewChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { position: "bottom", labels: { color: "#94a3b8" } } }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* DRILL-DOWN DATAGRID */}
          <div className="col-md-6">
            <Card className="surface-custom border-custom">
              <CardContent className="p-4 d-flex flex-column gap-3">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="fw-bold text-primary mb-0">Job Opening Performance Summary</h5>
                  <Button variant="ghost" size="sm" className="d-flex align-items-center gap-1.5" onClick={handleExportCSV}>
                    <FaFileCsv /> Export Raw Data
                  </Button>
                </div>
                <p className="text-muted small mb-0">Drill down into application counts and average screening scores by position description.</p>

                <div className="table-responsive" style={{ maxHeight: "230px", overflowY: "auto" }}>
                  <table className="table table-hover align-middle mb-0 text-white" style={{ fontSize: "0.85rem" }}>
                    <thead>
                      <tr>
                        <th>Job Title</th>
                        <th>Applications</th>
                        <th>Hires</th>
                        <th>Avg Fit Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((job) => {
                        const jobApps = filteredApps.filter(a => Number(a.job_id) === Number(job.jdId));
                        const jobHires = jobApps.filter(a => a.status === "Hired").length;
                        const validScores = jobApps.filter(a => a.match_score !== null);
                        const avgScore = validScores.length > 0
                          ? (validScores.reduce((acc, curr) => acc + curr.match_score, 0) / validScores.length).toFixed(0) + "%"
                          : "N/A";

                        return (
                          <tr key={job.jdId}>
                            <td>{job.title}</td>
                            <td>{jobApps.length}</td>
                            <td>{jobHires}</td>
                            <td>{avgScore}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>

        {/* REPORTS WIZARD POPUP PREVIEW */}
        {reportPreviewOpen && (
          <Modal
            isOpen={reportPreviewOpen}
            onClose={() => setReportPreviewOpen(false)}
            title="Predefined Recruitment Reports Wizard"
            size="md"
            footer={
              <>
                <Button variant="ghost" onClick={() => setReportPreviewOpen(false)}>Cancel Wizard</Button>
                <Button variant="primary" className="d-flex align-items-center gap-1.5" onClick={handleExportCSV}>
                  <FaFileCsv /> Download CSV Report
                </Button>
              </>
            }
          >
            <div className="text-start text-white">
              <div className="mb-3">
                <label className="form-label-custom mb-1">Choose Report Definition</label>
                <Select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  options={[
                    { value: "Overview", label: "Recruitment Summary Overview Report" },
                    { value: "AI Health", label: "AI Screening & Assessment Health Report" },
                    { value: "Interviews", label: "Interview Evaluations & Scorecard Report" }
                  ]}
                />
              </div>

              {/* REPORT PREVIEW CARD */}
              <div className="p-3.5 rounded border border-secondary border-opacity-15 bg-dark bg-opacity-25">
                <h6 className="fw-bold mb-2 text-primary-light">Pre-generation Audit Summary Preview</h6>
                <div className="d-flex flex-column gap-2 text-muted" style={{ fontSize: "0.85rem" }}>
                  <div><strong>Report Type:</strong> {reportType}</div>
                  <div><strong>Date cutoff filter:</strong> Last {filterDateRange} days</div>
                  <div><strong>Job constraints:</strong> {filterJobId === "All" ? "All requisitions included" : `Job ID #${filterJobId}`}</div>
                  <div><strong>Total candidates in audit scope:</strong> {totalAppsCount} applicant records</div>
                  <div><strong>Total interview logs in scope:</strong> {totalInterviews} scheduled sessions</div>
                </div>
              </div>
            </div>
          </Modal>
        )}

      </div>
    </AppLayout>
  );
}

export default Analytics;
