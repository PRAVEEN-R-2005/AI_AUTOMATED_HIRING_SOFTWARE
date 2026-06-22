import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";

// ================= STYLES =================
import "./styles/global.css";

// ================= AOS ANIMATION =================
import AOS from "aos";
import "aos/dist/aos.css";

// ================= PUBLIC PAGES =================
import Login from "./pages/Login";
import Register from "./pages/Register";

// ================= ADMIN + HR PAGES =================
import Dashboard from "./pages/Dashboard";
import ManageJD from "./pages/ManageJD";
import Jobs from "./pages/Jobs";
import Candidates from "./pages/Candidates";
import AICandidates from "./pages/AICandidates";
import Interviews from "./pages/Interviews";
import TopCandidates from "./pages/TopCandidates";
import Applications from "./pages/Applications";

// ================= STUDENT PAGES =================
import StudentDashboard from "./pages/StudentDashboard";
import AvailableJobs from "./pages/AvailableJobs";
import ApplyJob from "./pages/ApplyJob";
import MyApplications from "./pages/MyApplications";
import InterviewStatus from "./pages/InterviewStatus";

// ================= PROTECTED ROUTES =================
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";

function App() {

    // ================= AOS INITIALIZATION =================
    useEffect(() => {

        AOS.init({

            duration: 1000,

            once: true

        });

    }, []);


    return (

        <BrowserRouter>

            <Routes>

                {/* ================= PUBLIC ROUTES ================= */}

                <Route
                    path="/"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />


                {/* ================= COMMON DASHBOARD ================= */}

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />


                {/* ================= HR ONLY ================= */}

                <Route
                    path="/jobs"
                    element={
                        <RoleProtectedRoute allowedRoles={["HR"]}>
                            <Jobs />
                        </RoleProtectedRoute>
                    }
                />

                <Route
                    path="/applications"
                    element={
                        <RoleProtectedRoute allowedRoles={["HR"]}>
                            <Applications />
                        </RoleProtectedRoute>
                    }
                />


                {/* ================= ADMIN + HR ================= */}

                <Route
                    path="/candidates"
                    element={
                        <RoleProtectedRoute allowedRoles={["Admin", "HR"]}>
                            <Candidates />
                        </RoleProtectedRoute>
                    }
                />
                <Route
    path="/manage-jd"
    element={
        <RoleProtectedRoute
            allowedRoles={["Admin"]}
        >
            <ManageJD />
        </RoleProtectedRoute>
    }
/>

                <Route
                    path="/ai-candidates"
                    element={
                        <RoleProtectedRoute allowedRoles={["Admin", "HR"]}>
                            <AICandidates />
                        </RoleProtectedRoute>
                    }
                />

                <Route
                    path="/interviews"
                    element={
                        <RoleProtectedRoute allowedRoles={["Admin", "HR"]}>
                            <Interviews />
                        </RoleProtectedRoute>
                    }
                />

                <Route
                    path="/top-candidates"
                    element={
                        <RoleProtectedRoute allowedRoles={["Admin", "HR"]}>
                            <TopCandidates />
                        </RoleProtectedRoute>
                    }
                />


                {/* ================= STUDENT MODULE ================= */}

                <Route
                    path="/student-dashboard"
                    element={
                        <RoleProtectedRoute allowedRoles={["Candidate"]}>
                            <StudentDashboard />
                        </RoleProtectedRoute>
                    }
                />

                <Route
                    path="/available-jobs"
                    element={
                        <RoleProtectedRoute allowedRoles={["Candidate"]}>
                            <AvailableJobs />
                        </RoleProtectedRoute>
                    }
                />

                <Route
                    path="/apply-job"
                    element={
                        <RoleProtectedRoute allowedRoles={["Candidate"]}>
                            <ApplyJob />
                        </RoleProtectedRoute>
                    }
                />

                <Route
                    path="/my-applications"
                    element={
                        <RoleProtectedRoute allowedRoles={["Candidate"]}>
                            <MyApplications />
                        </RoleProtectedRoute>
                    }
                />

                <Route
                    path="/interview-status"
                    element={
                        <RoleProtectedRoute allowedRoles={["Candidate"]}>
                            <InterviewStatus />
                        </RoleProtectedRoute>
                    }
                />

            </Routes>

        </BrowserRouter>

    );
}

export default App;