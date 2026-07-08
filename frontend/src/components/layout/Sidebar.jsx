import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import {
  FaTachometerAlt,
  FaClipboardList,
  FaBriefcase,
  FaFileAlt,
  FaRobot,
  FaCalendarAlt,
  FaTrophy,
  FaUserGraduate,
  FaUsers,
  FaSignOutAlt,
  FaChartBar,
  FaBell,
  FaCog,
} from "react-icons/fa";

const Sidebar = ({ isCollapsed, isMobileOpen, onCloseMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    navigate("/");
  };

  const navItems = {
    Admin: [
      { path: "/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
      { path: "/team", label: "Team", icon: <FaUsers /> },
      { path: "/jobs", label: "Jobs", icon: <FaBriefcase /> },
      { path: "/applications", label: "Applications", icon: <FaFileAlt /> },
      { path: "/candidates", label: "Candidates", icon: <FaUsers /> },
      { path: "/ai-candidates", label: "AI Candidates", icon: <FaRobot /> },
      { path: "/interviews", label: "Interviews", icon: <FaCalendarAlt /> },
      { path: "/top-candidates", label: "Top Candidates", icon: <FaTrophy /> },
      { path: "/analytics", label: "Analytics", icon: <FaChartBar /> },
      { path: "/notifications", label: "Notifications", icon: <FaBell /> },
      { path: "/settings", label: "Settings", icon: <FaCog /> },
    ],
    HR: [
      { path: "/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
      { path: "/team", label: "Team", icon: <FaUsers /> },
      { path: "/jobs", label: "Jobs", icon: <FaBriefcase /> },
      { path: "/applications", label: "Applications", icon: <FaFileAlt /> },
      { path: "/candidates", label: "Candidates", icon: <FaUsers /> },
      { path: "/ai-candidates", label: "AI Candidates", icon: <FaRobot /> },
      { path: "/interviews", label: "Interviews", icon: <FaCalendarAlt /> },
      { path: "/top-candidates", label: "Top Candidates", icon: <FaTrophy /> },
      { path: "/analytics", label: "Analytics", icon: <FaChartBar /> },
      { path: "/notifications", label: "Notifications", icon: <FaBell /> },
      { path: "/settings", label: "Settings", icon: <FaCog /> },
    ],
    Recruiter: [
      { path: "/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
      { path: "/team", label: "Team", icon: <FaUsers /> },
      { path: "/jobs", label: "Jobs", icon: <FaBriefcase /> },
      { path: "/applications", label: "Applications", icon: <FaFileAlt /> },
      { path: "/candidates", label: "Candidates", icon: <FaUsers /> },
      { path: "/ai-candidates", label: "AI Candidates", icon: <FaRobot /> },
      { path: "/interviews", label: "Interviews", icon: <FaCalendarAlt /> },
      { path: "/top-candidates", label: "Top Candidates", icon: <FaTrophy /> },
      { path: "/analytics", label: "Analytics", icon: <FaChartBar /> },
      { path: "/notifications", label: "Notifications", icon: <FaBell /> },
      { path: "/settings", label: "Settings", icon: <FaCog /> },
    ],
    "Hiring Manager": [
      { path: "/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
      { path: "/jobs", label: "Jobs", icon: <FaBriefcase /> },
      { path: "/applications", label: "Applications", icon: <FaFileAlt /> },
      { path: "/candidates", label: "Candidates", icon: <FaUsers /> },
      { path: "/interviews", label: "Interviews", icon: <FaCalendarAlt /> },
      { path: "/notifications", label: "Notifications", icon: <FaBell /> },
      { path: "/settings", label: "Settings", icon: <FaCog /> },
    ],
    Interviewer: [
      { path: "/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
      { path: "/interviews", label: "Interviews", icon: <FaCalendarAlt /> },
      { path: "/notifications", label: "Notifications", icon: <FaBell /> },
      { path: "/settings", label: "Settings", icon: <FaCog /> },
    ],
    Candidate: [
      { path: "/student-dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
      { path: "/available-jobs", label: "Available Jobs", icon: <FaBriefcase /> },
      { path: "/apply-job", label: "Apply Job", icon: <FaUserGraduate /> },
      { path: "/my-applications", label: "My Applications", icon: <FaFileAlt /> },
      { path: "/interview-status", label: "Interview Status", icon: <FaCalendarAlt /> },
      { path: "/settings", label: "Settings", icon: <FaCog /> },
    ],
  };

  const items = navItems[role] || [];
  const sidebarWidthClass = isCollapsed ? "sidebar-custom-collapsed" : "sidebar-custom-expanded";
  const mobileOpenClass = isMobileOpen ? "sidebar-custom-mobile-open" : "";

  return (
    <aside
      className={`sidebar-custom ${sidebarWidthClass} ${mobileOpenClass} text-white d-flex flex-column`}
      style={{ height: "100vh", position: "sticky", top: 0, zIndex: 1020 }}
    >
      {/* Header / Brand */}
      <div className="d-flex align-items-center justify-content-between p-4" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
        {!isCollapsed && (
          <div className="d-flex flex-column">
            <h5 className="fw-bold mb-0 text-white text-truncate" style={{ letterSpacing: "0.05em" }}>
              Smart ATS
            </h5>
            <small className="sidebar-subtitle">
              AI RECRUITMENT
            </small>
          </div>
        )}
        {isCollapsed && (
          <div className="mx-auto fw-bold text-white text-uppercase" style={{ fontSize: "0.85rem", letterSpacing: "0.05em" }}>
            ATS
          </div>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-grow-1 p-3 overflow-y-auto">
        <ul className="nav flex-column gap-2 list-unstyled">
          {items.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path} className="nav-item">
                <Link
                  to={item.path}
                  className={`sidebar-nav-link ${isActive ? "active" : ""}`}
                  style={{
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.925rem",
                  }}
                  title={isCollapsed ? item.label : ""}
                >
                  <span style={{ fontSize: "1.1rem" }} className="d-flex align-items-center">
                    {item.icon}
                  </span>
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer / Logout */}
      <div className="p-3" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
        <button
          onClick={handleLogout}
          className="sidebar-logout-button w-100 d-flex align-items-center gap-3 px-3 py-2.5"
          style={{
            color: "#ef4444",
            justifyContent: isCollapsed ? "center" : "flex-start",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            borderRadius: "var(--radius-sm)",
            padding: "10px 16px",
          }}
          title={isCollapsed ? "Logout" : ""}
        >
          <span style={{ fontSize: "1.1rem" }} className="d-flex align-items-center">
            <FaSignOutAlt />
          </span>
          {!isCollapsed && <span style={{ fontSize: "0.925rem" }}>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

Sidebar.propTypes = {
  isCollapsed: PropTypes.bool.isRequired,
  isMobileOpen: PropTypes.bool.isRequired,
  onCloseMobile: PropTypes.func.isRequired,
};

export default Sidebar;
