import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";

// ================= STYLES =================
import "./styles/global.css";

// ================= AOS ANIMATION =================
import AOS from "aos";
import "aos/dist/aos.css";

// ================= ERROR BOUNDARY =================
import ErrorBoundary from "./components/common/ErrorBoundary";

// ================= PUBLIC PAGES (eager load for fast first paint) =================
import Home from "./pages/Home";
import Login from "./pages/login";
import Register from "./pages/Register";

// ================= LAZY-LOADED PAGES (code-splitting) =================
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Jobs = lazy(() => import("./pages/Jobs"));
const Candidates = lazy(() => import("./pages/Candidates"));
const AICandidates = lazy(() => import("./pages/AICandidates"));
const Interviews = lazy(() => import("./pages/Interviews"));
const TopCandidates = lazy(() => import("./pages/TopCandidates"));
const Applications = lazy(() => import("./pages/Applications"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Settings = lazy(() => import("./pages/Settings"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const AvailableJobs = lazy(() => import("./pages/AvailableJobs"));
const ApplyJob = lazy(() => import("./pages/ApplyJob"));
const MyApplications = lazy(() => import("./pages/MyApplications"));
const InterviewStatus = lazy(() => import("./pages/InterviewStatus"));

// ================= PROTECTED ROUTES =================
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";

// ================= SUSPENSE FALLBACK =================
const PageLoader = () => (
    <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "100vh", background: "var(--background, #f8fafc)"
    }}>
        <div style={{ textAlign: "center" }}>
            <div style={{
                width: 40, height: 40, borderRadius: "50%",
                border: "3px solid var(--border, #e2e8f0)",
                borderTopColor: "var(--primary, #6366f1)",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 12px"
            }} />
            <p style={{ color: "var(--text-secondary, #64748b)", fontSize: "0.9rem" }}>Loading…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    </div>
);

function App() {

    // ================= AOS INITIALIZATION =================
    useEffect(() => {
        AOS.init({ duration: 1000, once: true });
    }, []);

    return (
        <ErrorBoundary>
            <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                    <Routes>

                        {/* ================= PUBLIC ROUTES ================= */}
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* ================= COMMON DASHBOARD ================= */}
                        <Route
                            path="/dashboard"
                            element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
                        />

                        {/* ================= ADMIN + HR ================= */}
                        <Route
                            path="/jobs"
                            element={<RoleProtectedRoute allowedRoles={["Admin", "HR"]}><Jobs /></RoleProtectedRoute>}
                        />
                        <Route
                            path="/applications"
                            element={<RoleProtectedRoute allowedRoles={["Admin", "HR"]}><Applications /></RoleProtectedRoute>}
                        />
                        <Route
                            path="/candidates"
                            element={<RoleProtectedRoute allowedRoles={["Admin", "HR"]}><Candidates /></RoleProtectedRoute>}
                        />
                        <Route
                            path="/manage-jd"
                            element={<RoleProtectedRoute allowedRoles={["Admin", "HR"]}><Jobs /></RoleProtectedRoute>}
                        />
                        <Route
                            path="/ai-candidates"
                            element={<RoleProtectedRoute allowedRoles={["Admin", "HR"]}><AICandidates /></RoleProtectedRoute>}
                        />
                        <Route
                            path="/interviews"
                            element={<RoleProtectedRoute allowedRoles={["Admin", "HR"]}><Interviews /></RoleProtectedRoute>}
                        />
                        <Route
                            path="/top-candidates"
                            element={<RoleProtectedRoute allowedRoles={["Admin", "HR"]}><TopCandidates /></RoleProtectedRoute>}
                        />
                        <Route
                            path="/analytics"
                            element={<RoleProtectedRoute allowedRoles={["Admin", "HR"]}><Analytics /></RoleProtectedRoute>}
                        />
                        <Route
                            path="/notifications"
                            element={<RoleProtectedRoute allowedRoles={["Admin", "HR"]}><Notifications /></RoleProtectedRoute>}
                        />

                        {/* ================= SETTINGS (ALL ROLES) ================= */}
                        <Route
                            path="/settings"
                            element={<ProtectedRoute><Settings /></ProtectedRoute>}
                        />

                        {/* ================= CANDIDATE MODULE ================= */}
                        <Route
                            path="/student-dashboard"
                            element={<RoleProtectedRoute allowedRoles={["Candidate"]}><StudentDashboard /></RoleProtectedRoute>}
                        />
                        <Route
                            path="/available-jobs"
                            element={<RoleProtectedRoute allowedRoles={["Candidate"]}><AvailableJobs /></RoleProtectedRoute>}
                        />
                        <Route
                            path="/apply-job"
                            element={<RoleProtectedRoute allowedRoles={["Candidate"]}><ApplyJob /></RoleProtectedRoute>}
                        />
                        <Route
                            path="/my-applications"
                            element={<RoleProtectedRoute allowedRoles={["Candidate"]}><MyApplications /></RoleProtectedRoute>}
                        />
                        <Route
                            path="/interview-status"
                            element={<RoleProtectedRoute allowedRoles={["Candidate"]}><InterviewStatus /></RoleProtectedRoute>}
                        />

                    </Routes>
                </Suspense>
            </BrowserRouter>
        </ErrorBoundary>
    );
}

export default App;