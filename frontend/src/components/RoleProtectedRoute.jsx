import { Navigate } from "react-router-dom";

function RoleProtectedRoute({
    children,
    allowedRoles
}) {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    // If no token exists, redirect to login regardless of role
    if (!token) {
        return <Navigate to="/login" />;
    }

    // Support Recruiter & HR as aliases on frontend too
    let effectiveRole = role;
    if (effectiveRole === "HR" && allowedRoles.includes("Recruiter")) {
        effectiveRole = "Recruiter";
    }
    if (effectiveRole === "Recruiter" && allowedRoles.includes("HR")) {
        effectiveRole = "HR";
    }

    if (
        allowedRoles.includes(effectiveRole) ||
        allowedRoles.includes(role)
    ) {
        return children;
    }

    return <Navigate to="/unauthorized" />;
}

export default RoleProtectedRoute;