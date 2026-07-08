import React, { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import AppLayout from "../components/layout/AppLayout";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Skeleton from "../components/ui/Skeleton";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";
import { Card, CardContent } from "../components/ui/Card";
import StatCard from "../components/ui/StatCard";
import { 
  FaCog, FaUser, FaLock, FaUsers, FaPlus, FaTrash, FaCheck, FaExclamationTriangle,
  FaPalette, FaBell, FaShieldAlt, FaBuilding, FaServer, FaBrain, FaHistory, FaLink,
  FaEnvelope, FaCalendarAlt, FaCheckCircle, FaExchangeAlt, FaChevronLeft, FaChevronRight, FaEye
} from "react-icons/fa";

function Settings() {
  const userRole = localStorage.getItem("role") || "Recruiter";
  const userEmail = localStorage.getItem("email") || "";
  const isAdmin = userRole === "Admin";

  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Personal Profile inputs
  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [jobTitleInput, setJobTitleInput] = useState("");
  const [timezoneInput, setTimezoneInput] = useState("UTC");
  const [localeInput, setLocaleInput] = useState("en-US");

  // Preferences inputs
  const [themeInput, setThemeInput] = useState("light");
  const [landingPageInput, setLandingPageInput] = useState("/dashboard");
  const [analyticsRangeInput, setAnalyticsRangeInput] = useState("30_days");
  const [candidateViewInput, setCandidateViewInput] = useState("list");
  const [pipelineViewInput, setPipelineViewInput] = useState("kanban");

  // Notification local preferences (persisted locally)
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [bellAlerts, setBellAlerts] = useState(true);
  const [highPriorityAlertsOnly, setHighPriorityAlertsOnly] = useState(false);

  // Security (password change) inputs
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Organization settings inputs
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [orgLogo, setOrgLogo] = useState("");
  const [orgIndustry, setOrgIndustry] = useState("");
  const [orgSize, setOrgSize] = useState("");
  const [orgWebsite, setOrgWebsite] = useState("");
  const [orgTimezone, setOrgTimezone] = useState("UTC");
  const [orgLocale, setOrgLocale] = useState("en-US");

  // Recruitment Defaults inputs
  const [defaultPipeline, setDefaultPipeline] = useState("Standard");
  const [defaultInterviewDuration, setDefaultInterviewDuration] = useState(30);
  const [defaultInterviewType, setDefaultInterviewType] = useState("Video");
  const [defaultApplicationStage, setDefaultApplicationStage] = useState("Applied");
  const [defaultAnalyticsRange, setDefaultAnalyticsRange] = useState("30_days");

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditTotalLogs, setAuditTotalLogs] = useState(0);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditCategory, setAuditCategory] = useState("All");
  const [auditResult, setAuditResult] = useState("All");
  const [auditStartDate, setAuditStartDate] = useState("");
  const [auditEndDate, setAuditEndDate] = useState("");
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);

  // System Diagnostics state
  const [systemInfo, setSystemInfo] = useState(null);
  const [sysInfoLoading, setSysInfoLoading] = useState(false);

  // Unsaved changes warning trigger
  const [isDirty, setIsDirty] = useState(false);

  const fetchSettingsData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch user profile and preferences
      const profileRes = await api.get("/api/settings/profile");
      const profileData = profileRes.data || {};
      setProfile(profileData);
      setNameInput(profileData.name || "");
      setPhoneInput(profileData.phone || "");
      setJobTitleInput(profileData.job_title || "");
      setTimezoneInput(profileData.timezone || "UTC");
      setLocaleInput(profileData.locale || "en-US");

      setThemeInput(profileData.theme || "light");
      setLandingPageInput(profileData.default_landing_page || "/dashboard");
      setAnalyticsRangeInput(profileData.default_analytics_range || "30_days");
      setCandidateViewInput(profileData.default_candidate_view || "list");
      setPipelineViewInput(profileData.default_pipeline_view || "kanban");

      // Load local notification settings from localStorage
      const savedEmailAlerts = localStorage.getItem("notif_email_alerts") !== "false";
      const savedBellAlerts = localStorage.getItem("notif_bell_alerts") !== "false";
      const savedHighPriorityOnly = localStorage.getItem("notif_high_priority_only") === "true";
      setEmailAlerts(savedEmailAlerts);
      setBellAlerts(savedBellAlerts);
      setHighPriorityAlertsOnly(savedHighPriorityOnly);

      // Fetch organization settings
      if (userRole !== "Candidate" && profileData.organization_id) {
        const orgRes = await api.get("/api/settings/organization");
        const orgData = orgRes.data || {};
        setOrganization(orgData);
        setOrgName(orgData.name || "");
        setOrgSlug(orgData.slug || "");
        setOrgLogo(orgData.logo_url || "");
        setOrgIndustry(orgData.industry || "");
        setOrgSize(orgData.company_size || "");
        setOrgWebsite(orgData.website || "");
        setOrgTimezone(orgData.timezone || "UTC");
        setOrgLocale(orgData.locale || "en-US");

        // Defaults
        setDefaultPipeline(orgData.default_pipeline || "Standard");
        setDefaultInterviewDuration(orgData.default_interview_duration || 30);
        setDefaultInterviewType(orgData.default_interview_type || "Video");
        setDefaultApplicationStage(orgData.default_application_stage || "Applied");
        setDefaultAnalyticsRange(orgData.default_analytics_range || "30_days");
      }
      setIsDirty(false);
    } catch (err) {
      console.error(err);
      setError("Failed to load settings from server. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  useEffect(() => {
    fetchSettingsData();
  }, [fetchSettingsData]);

  // Handle Tab Switch
  const handleTabChange = (tab) => {
    if (isDirty) {
      const confirmLeave = window.confirm("You have unsaved changes. Are you sure you want to discard them?");
      if (!confirmLeave) return;
    }
    setActiveTab(tab);
    setSuccessMessage("");
    setError("");
    setIsDirty(false);

    if (tab === "audit" && isAdmin) {
      fetchAuditLogs(1);
    } else if (tab === "sysinfo" && isAdmin) {
      fetchSystemDiagnostics();
    }
  };

  // Fetch Audit Logs
  const fetchAuditLogs = async (pageNo = 1) => {
    setAuditLoading(true);
    try {
      const params = {
        page: pageNo,
        limit: 10,
        search: auditSearch,
        category: auditCategory,
        result: auditResult,
        startDate: auditStartDate,
        endDate: auditEndDate
      };
      const res = await api.get("/api/settings/audit-logs", { params });
      setAuditLogs(res.data.logs || []);
      setAuditPage(res.data.pagination.page);
      setAuditTotalPages(res.data.pagination.pages);
      setAuditTotalLogs(res.data.pagination.total);
    } catch (err) {
      console.error("Failed to query audit logs:", err);
    } finally {
      setAuditLoading(false);
    }
  };

  // Fetch System Diagnostics
  const fetchSystemDiagnostics = async () => {
    setSysInfoLoading(true);
    try {
      const res = await api.get("/api/settings/system-info");
      setSystemInfo(res.data);
    } catch (err) {
      console.error("Failed to ping system status:", err);
    } finally {
      setSysInfoLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    if (e) e.preventDefault();
    if (!nameInput.trim()) return setError("Full Name is required");
    setSaving(true);
    setError("");
    setSuccessMessage("");
    try {
      await api.put("/api/settings/profile", {
        name: nameInput.trim(),
        phone: phoneInput.trim(),
        job_title: jobTitleInput.trim(),
        timezone: timezoneInput,
        locale: localeInput,
        default_landing_page: landingPageInput,
        default_analytics_range: analyticsRangeInput,
        default_candidate_view: candidateViewInput,
        default_pipeline_view: pipelineViewInput,
        theme: themeInput
      });

      // Update document classes instantly for local changes
      document.documentElement.setAttribute("data-theme", themeInput);
      localStorage.setItem("theme", themeInput);

      setSuccessMessage("Personal profile and preferences updated successfully!");
      setIsDirty(false);
      fetchSettingsData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateOrganization = async (e) => {
    if (e) e.preventDefault();
    if (!orgName.trim()) return setError("Organization Name is required");
    if (!orgSlug.trim()) return setError("Workspace Slug is required");
    setSaving(true);
    setError("");
    setSuccessMessage("");
    try {
      await api.put("/api/settings/organization", {
        name: orgName.trim(),
        slug: orgSlug.trim(),
        logo_url: orgLogo.trim(),
        industry: orgIndustry.trim(),
        company_size: orgSize,
        website: orgWebsite.trim(),
        timezone: orgTimezone,
        locale: orgLocale,
        default_pipeline: defaultPipeline,
        default_interview_duration: parseInt(defaultInterviewDuration) || 30,
        default_interview_type: defaultInterviewType,
        default_application_stage: defaultApplicationStage,
        default_analytics_range: defaultAnalyticsRange
      });
      setSuccessMessage("Organization settings and default configurations saved!");
      setIsDirty(false);
      fetchSettingsData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update organization settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = (e) => {
    e.preventDefault();
    localStorage.setItem("notif_email_alerts", emailAlerts);
    localStorage.setItem("notif_bell_alerts", bellAlerts);
    localStorage.setItem("notif_high_priority_only", highPriorityAlertsOnly);
    setSuccessMessage("Notification channel preferences updated locally!");
    setIsDirty(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return setError("Both current and new password are required");
    if (newPassword.length < 6) return setError("New password must be at least 6 characters");
    if (newPassword !== confirmPassword) return setError("Passwords do not match");

    setSaving(true);
    setError("");
    setSuccessMessage("");
    try {
      await api.put("/api/settings/change-password", { currentPassword, newPassword });
      setSuccessMessage("Your credentials have been updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsDirty(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to modify password.");
    } finally {
      setSaving(false);
    }
  };

  const openAuditDetails = (log) => {
    setSelectedAuditLog(log);
    setAuditModalOpen(true);
  };

  const inputStyle = {
    background: "var(--surface-secondary, #f1f5f9)", 
    color: "var(--text-primary)",
    border: "1px solid var(--border)", 
    borderRadius: "var(--radius-sm)",
    padding: "10px 14px", 
    fontSize: "0.9rem", 
    width: "100%"
  };

  const tabs = [
    { key: "profile", label: "Profile", icon: <FaUser />, roles: ["Admin", "HR", "Recruiter", "Hiring Manager", "Interviewer", "Candidate"] },
    { key: "account", label: "Account Status", icon: <FaShieldAlt />, roles: ["Admin", "HR", "Recruiter", "Hiring Manager", "Interviewer", "Candidate"] },
    { key: "preferences", label: "Preferences", icon: <FaPalette />, roles: ["Admin", "HR", "Recruiter", "Hiring Manager", "Interviewer", "Candidate"] },
    { key: "notifications", label: "Notifications", icon: <FaBell />, roles: ["Admin", "HR", "Recruiter", "Hiring Manager", "Interviewer", "Candidate"] },
    { key: "security", label: "Security", icon: <FaLock />, roles: ["Admin", "HR", "Recruiter", "Hiring Manager", "Interviewer", "Candidate"] },
    { key: "organization", label: "Organization", icon: <FaBuilding />, roles: ["Admin"] },
    { key: "defaults", label: "Recruitment Defaults", icon: <FaCog />, roles: ["Admin"] },
    { key: "status", label: "AI & Comms Status", icon: <FaBrain />, roles: ["Admin"] },
    { key: "team", label: "Team & Invites", icon: <FaUsers />, roles: ["Admin", "HR", "Recruiter"] },
    { key: "audit", label: "Audit Logs Explorer", icon: <FaHistory />, roles: ["Admin"] },
    { key: "sysinfo", label: "System Diagnostic", icon: <FaServer />, roles: ["Admin"] }
  ].filter(t => t.roles.includes(userRole));

  return (
    <AppLayout>
      <div className="container-fluid px-0 text-white text-start">
        
        {/* PAGE TITLE */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h2 className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <FaCog style={{ color: "var(--primary)" }} /> Platform Settings
            </h2>
            <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
              Configure your workspace preferences, personal profile, security, and administrative diagnostic portals.
            </p>
          </div>
        </div>

        {/* FEEDBACK BANNERS */}
        {error && (
          <div
            className="p-3 mb-4 d-flex align-items-center gap-2"
            style={{
              borderRadius: "var(--radius-sm)",
              background: "rgba(239, 68, 68, 0.1)",
              color: "#ef4444",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              fontSize: "0.88rem"
            }}
          >
            <FaExclamationTriangle />
            {error}
          </div>
        )}

        {successMessage && (
          <div
            className="p-3 mb-4 d-flex align-items-center gap-2"
            style={{
              borderRadius: "var(--radius-sm)",
              background: "rgba(16, 185, 129, 0.1)",
              color: "#10b981",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              fontSize: "0.88rem"
            }}
          >
            <FaCheckCircle />
            {successMessage}
          </div>
        )}

        <div className="row g-4">
          
          {/* TAB SIDEBAR */}
          <div className="col-lg-3 col-md-4">
            <div className="card-custom surface-custom border-custom p-2" style={{ borderRadius: "var(--radius-md)" }}>
              <div className="d-none d-md-flex flex-column gap-1">
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key)}
                    className="w-100 d-flex align-items-center gap-2.5 p-3 text-start"
                    style={{
                      border: "none",
                      background: activeTab === tab.key ? "var(--primary)" : "transparent",
                      color: activeTab === tab.key ? "#fff" : "var(--text-secondary)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.88rem",
                      fontWeight: activeTab === tab.key ? 600 : 400,
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* Mobile Tab Selector */}
              <div className="d-block d-md-none p-2">
                <label className="form-label-custom mb-1 text-muted" style={{ fontSize: "0.8rem" }}>Settings Category</label>
                <select
                  value={activeTab}
                  onChange={(e) => handleTabChange(e.target.value)}
                  className="form-select"
                  style={{ background: "var(--surface)", color: "var(--text-primary)" }}
                >
                  {tabs.map(tab => (
                    <option key={tab.key} value={tab.key}>
                      {tab.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* TAB CONTENT PANEL */}
          <div className="col-lg-9 col-md-8">
            <div className="card-custom surface-custom border-custom p-4 h-100" style={{ borderRadius: "var(--radius-md)" }}>
              
              {loading ? (
                <div className="d-flex flex-column gap-3 py-4">
                  <Skeleton height="35px" width="40%" />
                  <div className="row g-3">
                    <div className="col-md-6"><Skeleton height="45px" /></div>
                    <div className="col-md-6"><Skeleton height="45px" /></div>
                    <div className="col-12"><Skeleton height="60px" /></div>
                  </div>
                  <Skeleton height="45px" width="150px" />
                </div>
              ) : (
                <>
                  {/* TABS DEFINITIONS */}
                  
                  {/* 1. PERSONAL PROFILE */}
                  {activeTab === "profile" && (
                    <form onSubmit={handleUpdateProfile} onChange={() => setIsDirty(true)}>
                      <h5 className="fw-bold mb-4" style={{ color: "var(--text-primary)" }}>Personal Profile</h5>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <Input label="Full Name" value={nameInput} onChange={e => setNameInput(e.target.value)} required />
                        </div>
                        <div className="col-md-6">
                          <Input label="Email Address (Read-only)" value={profile?.email || ""} disabled style={{ opacity: 0.6 }} />
                        </div>
                        <div className="col-md-6">
                          <Input label="Phone Number" value={phoneInput} onChange={e => setPhoneInput(e.target.value)} placeholder="+1 (555) 000-0000" />
                        </div>
                        <div className="col-md-6">
                          <Input label="Job Title" value={jobTitleInput} onChange={e => setJobTitleInput(e.target.value)} placeholder="Senior Recruiter" />
                        </div>
                        <div className="col-md-6">
                          <Select 
                            label="Timezone" 
                            value={timezoneInput} 
                            onChange={e => setTimezoneInput(e.target.value)}
                            options={[
                              { value: "UTC", label: "UTC (Coordinated Universal Time)" },
                              { value: "America/New_York", label: "EST (America/New_York)" },
                              { value: "America/Chicago", label: "CST (America/Chicago)" },
                              { value: "America/Denver", label: "MST (America/Denver)" },
                              { value: "America/Los_Angeles", label: "PST (America/Los_Angeles)" },
                              { value: "Europe/London", label: "GMT (Europe/London)" },
                              { value: "Europe/Paris", label: "CET (Europe/Paris)" },
                              { value: "Asia/Kolkata", label: "IST (Asia/Kolkata)" },
                              { value: "Asia/Tokyo", label: "JST (Asia/Tokyo)" }
                            ]}
                          />
                        </div>
                        <div className="col-md-6">
                          <Select 
                            label="Preferred Locale" 
                            value={localeInput} 
                            onChange={e => setLocaleInput(e.target.value)}
                            options={[
                              { value: "en-US", label: "English (US)" },
                              { value: "en-GB", label: "English (UK)" },
                              { value: "es-ES", label: "Spanish (España)" },
                              { value: "fr-FR", label: "French (France)" },
                              { value: "de-DE", label: "German (Deutschland)" }
                            ]}
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <Button type="submit" variant="primary" loading={saving}>
                          Save Profile Changes
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* 2. ACCOUNT STATUS */}
                  {activeTab === "account" && (
                    <div className="text-start">
                      <h5 className="fw-bold mb-4" style={{ color: "var(--text-primary)" }}>Account Details</h5>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="fw-semibold text-muted mb-1" style={{ fontSize: "0.8rem" }}>Registered Email</label>
                          <div className="p-3 bg-dark rounded border border-secondary" style={{ fontSize: "0.9rem" }}>{profile?.email}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="fw-semibold text-muted mb-1" style={{ fontSize: "0.8rem" }}>System Role Privilege</label>
                          <div className="p-3 bg-dark rounded border border-secondary d-flex align-items-center justify-content-between">
                            <span className="fw-bold" style={{ fontSize: "0.9rem" }}>{profile?.role}</span>
                            <Badge variant={profile?.role === "Admin" ? "danger" : profile?.role === "Recruiter" || profile?.role === "HR" ? "primary" : "info"}>Active License</Badge>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <label className="fw-semibold text-muted mb-1" style={{ fontSize: "0.8rem" }}>Active Organization Workspace</label>
                          <div className="p-3 bg-dark rounded border border-secondary" style={{ fontSize: "0.9rem" }}>{organization?.name || "No organization workspace mapped"}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="fw-semibold text-muted mb-1" style={{ fontSize: "0.8rem" }}>Member Since</label>
                          <div className="p-3 bg-dark rounded border border-secondary" style={{ fontSize: "0.9rem" }}>
                            {profile?.created_at ? new Date(profile.created_at).toLocaleString() : "N/A"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. USER PREFERENCES */}
                  {activeTab === "preferences" && (
                    <form onSubmit={handleUpdateProfile} onChange={() => setIsDirty(true)}>
                      <h5 className="fw-bold mb-4" style={{ color: "var(--text-primary)" }}>Theme and View Preferences</h5>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <Select 
                            label="Color Theme" 
                            value={themeInput} 
                            onChange={e => setThemeInput(e.target.value)}
                            options={[
                              { value: "light", label: "Light Mode (Premium Workspace)" },
                              { value: "dark", label: "Dark Mode (High Contrast Glass)" }
                            ]}
                          />
                        </div>
                        <div className="col-md-6">
                          <Select 
                            label="Default Landing Page" 
                            value={landingPageInput} 
                            onChange={e => setLandingPageInput(e.target.value)}
                            options={[
                              { value: "/dashboard", label: "Recruiter Dashboard" },
                              { value: "/jobs", label: "Jobs Requisition Panel" },
                              { value: "/applications", label: "Applications Tracker" },
                              { value: "/candidates", label: "Candidates Database" },
                              { value: "/interviews", label: "Interview Calendar" },
                              { value: "/analytics", label: "Recruitment Analytics" },
                              { value: "/student-dashboard", label: "Student Dashboard" },
                              { value: "/available-jobs", label: "Student Job Board" }
                            ]}
                          />
                        </div>
                        <div className="col-md-6">
                          <Select 
                            label="Default Analytics Range" 
                            value={analyticsRangeInput} 
                            onChange={e => setAnalyticsRangeInput(e.target.value)}
                            options={[
                              { value: "7_days", label: "Past 7 Days" },
                              { value: "30_days", label: "Past 30 Days" },
                              { value: "90_days", label: "Past 90 Days" }
                            ]}
                          />
                        </div>
                        <div className="col-md-6">
                          <Select 
                            label="Default Pipeline View Layout" 
                            value={pipelineViewInput} 
                            onChange={e => setPipelineViewInput(e.target.value)}
                            options={[
                              { value: "kanban", label: "Interactive Kanban Board" },
                              { value: "list", label: "Standard Columns List" }
                            ]}
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <Button type="submit" variant="primary" loading={saving}>
                          Save Preferences
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* 4. NOTIFICATION SETTINGS */}
                  {activeTab === "notifications" && (
                    <form onSubmit={handleSaveNotifications} onChange={() => setIsDirty(true)}>
                      <h5 className="fw-bold mb-4" style={{ color: "var(--text-primary)" }}>Notification Preferences</h5>
                      <p className="text-muted" style={{ fontSize: "0.85rem" }}>
                        Configure communication channels and alerts delivery options.
                      </p>

                      <div className="d-flex flex-column gap-3 my-4">
                        <div className="form-check text-start">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            id="emailAlertsCheck" 
                            checked={emailAlerts}
                            onChange={e => setEmailAlerts(e.target.checked)}
                          />
                          <label className="form-check-label fw-semibold" htmlFor="emailAlertsCheck" style={{ fontSize: "0.9rem" }}>
                            Email Notifications
                            <small className="d-block text-muted" style={{ fontSize: "0.78rem" }}>Receive summary emails for candidate submittals and scorecard feedbacks.</small>
                          </label>
                        </div>

                        <div className="form-check text-start">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            id="bellAlertsCheck" 
                            checked={bellAlerts}
                            onChange={e => setBellAlerts(e.target.checked)}
                          />
                          <label className="form-check-label fw-semibold" htmlFor="bellAlertsCheck" style={{ fontSize: "0.9rem" }}>
                            Platform Bell Alerts
                            <small className="d-block text-muted" style={{ fontSize: "0.78rem" }}>Display real-time updates inside the header notification dropdown.</small>
                          </label>
                        </div>

                        <div className="form-check text-start">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            id="highPriorityCheck" 
                            checked={highPriorityAlertsOnly}
                            onChange={e => setHighPriorityAlertsOnly(e.target.checked)}
                          />
                          <label className="form-check-label fw-semibold" htmlFor="highPriorityCheck" style={{ fontSize: "0.9rem" }}>
                            High Priority Events Only
                            <small className="d-block text-muted" style={{ fontSize: "0.78rem" }}>Suppress lower-importance comments and alerts (only notify @mentions or schedule warnings).</small>
                          </label>
                        </div>
                      </div>

                      <div className="mt-4">
                        <Button type="submit" variant="primary">
                          Save Notification Channels
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* 5. SECURITY SETTINGS */}
                  {activeTab === "security" && (
                    <form onSubmit={handleChangePassword} onChange={() => setIsDirty(true)}>
                      <h5 className="fw-bold mb-4" style={{ color: "var(--text-primary)" }}>Security & Credentials</h5>
                      
                      <div className="row g-3" style={{ maxWidth: "550px" }}>
                        <div className="col-12">
                          <Input 
                            type="password" 
                            label="Current Password" 
                            value={currentPassword} 
                            onChange={e => setCurrentPassword(e.target.value)} 
                            placeholder="Enter current password" 
                            required 
                          />
                        </div>
                        <div className="col-12">
                          <Input 
                            type="password" 
                            label="New Password" 
                            value={newPassword} 
                            onChange={e => setNewPassword(e.target.value)} 
                            placeholder="Enter new password (min 6 characters)" 
                            required 
                          />
                        </div>
                        <div className="col-12">
                          <Input 
                            type="password" 
                            label="Confirm New Password" 
                            value={confirmPassword} 
                            onChange={e => setConfirmPassword(e.target.value)} 
                            placeholder="Re-type new password" 
                            required 
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <Button type="submit" variant="primary" loading={saving}>
                          Update Security Credentials
                        </Button>
                      </div>

                      <hr className="my-5 border-secondary" />

                      <div className="text-start">
                        <h6 className="fw-bold mb-2 text-danger">Active Browser Sessions</h6>
                        <p className="text-muted mb-3" style={{ fontSize: "0.82rem" }}>
                          You are currently logged in from this browser. Changing your password automatically invalidates active access tokens on other sessions.
                        </p>
                        <div className="p-3 bg-dark rounded border border-danger d-flex align-items-center justify-content-between">
                          <span style={{ fontSize: "0.85rem" }} className="text-danger fw-semibold">Current Active Token Session Valid</span>
                          <Badge variant="danger">Primary Session</Badge>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* 6. ORGANIZATION SETTINGS */}
                  {activeTab === "organization" && isAdmin && (
                    <form onSubmit={handleUpdateOrganization} onChange={() => setIsDirty(true)}>
                      <h5 className="fw-bold mb-4" style={{ color: "var(--text-primary)" }}>Organization Settings</h5>
                      
                      <div className="row g-3">
                        <div className="col-md-6">
                          <Input label="Organization Workspace Name" value={orgName} onChange={e => setOrgName(e.target.value)} required />
                        </div>
                        <div className="col-md-6">
                          <Input label="Organization URL Slug" value={orgSlug} onChange={e => setOrgSlug(e.target.value)} required placeholder="demo-org" />
                        </div>
                        <div className="col-md-6">
                          <Input label="Logo URL" value={orgLogo} onChange={e => setOrgLogo(e.target.value)} placeholder="https://company.com/logo.png" />
                        </div>
                        <div className="col-md-6">
                          <Input label="Company Website" value={orgWebsite} onChange={e => setOrgWebsite(e.target.value)} placeholder="https://company.com" />
                        </div>
                        <div className="col-md-6">
                          <Input label="Industry" value={orgIndustry} onChange={e => setOrgIndustry(e.target.value)} placeholder="Software Development" />
                        </div>
                        <div className="col-md-6">
                          <Select 
                            label="Company Size" 
                            value={orgSize} 
                            onChange={e => setOrgSize(e.target.value)}
                            options={[
                              { value: "1-10", label: "1 to 10 Employees" },
                              { value: "11-50", label: "11 to 50 Employees" },
                              { value: "51-200", label: "51 to 200 Employees" },
                              { value: "201-500", label: "201 to 500 Employees" },
                              { value: "501+", label: "Over 500 Employees" }
                            ]}
                          />
                        </div>
                        <div className="col-md-6">
                          <Select 
                            label="Workspace Regional Timezone" 
                            value={orgTimezone} 
                            onChange={e => setOrgTimezone(e.target.value)}
                            options={[
                              { value: "UTC", label: "UTC (Coordinated Universal Time)" },
                              { value: "America/New_York", label: "EST" },
                              { value: "America/Chicago", label: "CST" },
                              { value: "Asia/Kolkata", label: "IST" }
                            ]}
                          />
                        </div>
                        <div className="col-md-6">
                          <Select 
                            label="Workspace Default Locale" 
                            value={orgLocale} 
                            onChange={e => setOrgLocale(e.target.value)}
                            options={[
                              { value: "en-US", label: "English (US)" },
                              { value: "en-GB", label: "English (UK)" },
                              { value: "es-ES", label: "Spanish" }
                            ]}
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <Button type="submit" variant="primary" loading={saving}>
                          Save Organization Workspace
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* 7. RECRUITMENT DEFAULTS */}
                  {activeTab === "defaults" && isAdmin && (
                    <form onSubmit={handleUpdateOrganization} onChange={() => setIsDirty(true)}>
                      <h5 className="fw-bold mb-4" style={{ color: "var(--text-primary)" }}>Recruitment Workflows Defaults</h5>
                      <p className="text-muted" style={{ fontSize: "0.82rem" }}>
                        Define templates and default structures for new requisitions, stages, and scheduler durations.
                      </p>

                      <div className="row g-3">
                        <div className="col-md-6">
                          <Select 
                            label="Default Interview Scheduler Duration" 
                            value={defaultInterviewDuration} 
                            onChange={e => setDefaultInterviewDuration(e.target.value)}
                            options={[
                              { value: 15, label: "15 Minutes" },
                              { value: 30, label: "30 Minutes" },
                              { value: 45, label: "45 Minutes" },
                              { value: 60, label: "60 Minutes" }
                            ]}
                          />
                        </div>
                        <div className="col-md-6">
                          <Select 
                            label="Default Interview Medium" 
                            value={defaultInterviewType} 
                            onChange={e => setDefaultInterviewType(e.target.value)}
                            options={[
                              { value: "Video", label: "Video Call (Google Meet / Zoom)" },
                              { value: "Phone", label: "Phone Screen Call" },
                              { value: "In-Person", label: "In-Person Meeting" }
                            ]}
                          />
                        </div>
                        <div className="col-md-6">
                          <Select 
                            label="Initial Stage on Job Applications" 
                            value={defaultApplicationStage} 
                            onChange={e => setDefaultApplicationStage(e.target.value)}
                            options={[
                              { value: "Applied", label: "Applied (Screening Pending)" },
                              { value: "Screened", label: "Screened (AI Checked)" },
                              { value: "Interviewing", label: "Interview Scheduled" }
                            ]}
                          />
                        </div>
                        <div className="col-md-6">
                          <Select 
                            label="Analytics Default Window Range" 
                            value={defaultAnalyticsRange} 
                            onChange={e => setDefaultAnalyticsRange(e.target.value)}
                            options={[
                              { value: "7_days", label: "Last 7 Days" },
                              { value: "30_days", label: "Last 30 Days" },
                              { value: "90_days", label: "Last 90 Days" }
                            ]}
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <Button type="submit" variant="primary" loading={saving}>
                          Save Workspace Default Configurations
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* 8. AI & COMMS CONFIG STATUS */}
                  {activeTab === "status" && isAdmin && (
                    <div className="text-start">
                      <h5 className="fw-bold mb-4" style={{ color: "var(--text-primary)" }}>AI engine & Comms Visibility</h5>
                      
                      <div className="row g-4">
                        <div className="col-md-6">
                          <div className="card bg-dark border-secondary p-3">
                            <h6 className="fw-bold text-info d-flex align-items-center gap-2"><FaBrain /> AI Engine Integration</h6>
                            <hr className="my-2 border-secondary" />
                            <div className="d-flex flex-column gap-2" style={{ fontSize: "0.82rem" }}>
                              <div><strong>Algorithmic Processor:</strong> Local Skill Vectorization</div>
                              <div><strong>Scoring Model:</strong> Text Cosine Matrix Weighted</div>
                              <div><strong>Weight Ratios:</strong> Skills (50%), Experience (35%), Education (15%)</div>
                              <div className="d-flex justify-content-between mt-2 pt-2 border-top border-secondary">
                                <span>Engine State</span>
                                <Badge variant="success">Fully Operational</Badge>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="col-md-6">
                          <div className="card bg-dark border-secondary p-3">
                            <h6 className="fw-bold text-primary d-flex align-items-center gap-2"><FaEnvelope /> Outbound Communications</h6>
                            <hr className="my-2 border-secondary" />
                            <div className="d-flex flex-column gap-2" style={{ fontSize: "0.82rem" }}>
                              <div><strong>Sender Domain:</strong> smart-ats-system.local</div>
                              <div><strong>Integration Channel:</strong> Simulated JSON Mail logs</div>
                              <div><strong>Delivery Speed:</strong> Instantaneous auto-resolve</div>
                              <div className="d-flex justify-content-between mt-2 pt-2 border-top border-secondary">
                                <span>SMTP Gateway</span>
                                <Badge variant="warning">Mock Active</Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 9. TEAM SHORTCUT LINKS */}
                  {activeTab === "team" && (
                    <div className="text-start py-3">
                      <h5 className="fw-bold mb-3" style={{ color: "var(--text-primary)" }}>Team and Workspace Collaborations</h5>
                      <p className="text-muted mb-4" style={{ fontSize: "0.88rem" }}>
                        System member invitations, status changes, and workspace roles are managed centrally under the Team settings dashboard.
                      </p>

                      <div className="row g-3">
                        <div className="col-md-6">
                          <div className="card bg-dark border-secondary p-4 d-flex flex-column gap-3">
                            <h6 className="fw-bold mb-0 text-white d-flex align-items-center gap-2"><FaUsers /> Members Registry</h6>
                            <p className="text-muted mb-0" style={{ fontSize: "0.8rem" }}>
                              List all team members, view roles, and manage active/deactivated workspace accounts.
                            </p>
                            <Button variant="primary" className="d-flex align-items-center justify-content-center gap-2 w-fit-content" onClick={() => window.location.assign("/team")}>
                              <FaLink /> Go to Member Directory
                            </Button>
                          </div>
                        </div>

                        <div className="col-md-6">
                          <div className="card bg-dark border-secondary p-4 d-flex flex-column gap-3">
                            <h6 className="fw-bold mb-0 text-white d-flex align-items-center gap-2"><FaEnvelope /> Workspace Invites</h6>
                            <p className="text-muted mb-0" style={{ fontSize: "0.8rem" }}>
                              Create new workspace signup links and check the status of pending invitation emails.
                            </p>
                            <Button variant="ghost" className="d-flex align-items-center justify-content-center gap-2 w-fit-content text-white border-secondary" onClick={() => window.location.assign("/team")}>
                              <FaPlus /> Invite Panel Settings
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 10. AUDIT LOGS EXPLORER */}
                  {activeTab === "audit" && isAdmin && (
                    <div className="text-start">
                      <h5 className="fw-bold mb-3" style={{ color: "var(--text-primary)" }}>System Audit Trail Explorer</h5>
                      <p className="text-muted mb-4" style={{ fontSize: "0.82rem" }}>
                        Search and filter administrative operations, security logins, and candidate stage updates recorded across the organization.
                      </p>

                      {/* Filters toolbar */}
                      <div className="row g-3 mb-4">
                        <div className="col-md-4">
                          <Input 
                            placeholder="Search actor name, action, or resource..." 
                            value={auditSearch} 
                            onChange={e => setAuditSearch(e.target.value)} 
                            onKeyPress={e => e.key === "Enter" && fetchAuditLogs(1)}
                          />
                        </div>
                        <div className="col-md-3">
                          <Select 
                            value={auditCategory} 
                            onChange={e => setAuditCategory(e.target.value)}
                            options={[
                              { value: "All", label: "All Categories" },
                              { value: "AUTHENTICATION", label: "Authentication" },
                              { value: "TEAM", label: "Team Management" },
                              { value: "ORGANIZATION", label: "Organization Settings" },
                              { value: "SETTINGS", label: "Settings updates" },
                              { value: "SECURITY", label: "Security & Passwords" }
                            ]}
                          />
                        </div>
                        <div className="col-md-3">
                          <Select 
                            value={auditResult} 
                            onChange={e => setAuditResult(e.target.value)}
                            options={[
                              { value: "All", label: "All Results" },
                              { value: "SUCCESS", label: "Success logs" },
                              { value: "FAILURE", label: "Failures / Warnings" }
                            ]}
                          />
                        </div>
                        <div className="col-md-2">
                          <Button className="w-100 py-2.5" variant="primary" onClick={() => fetchAuditLogs(1)}>Search</Button>
                        </div>

                        <div className="col-md-4">
                          <Input label="From Date" type="date" value={auditStartDate} onChange={e => setAuditStartDate(e.target.value)} />
                        </div>
                        <div className="col-md-4">
                          <Input label="To Date" type="date" value={auditEndDate} onChange={e => setAuditEndDate(e.target.value)} />
                        </div>
                        <div className="col-md-4 d-flex align-items-end mb-3">
                          <Button 
                            variant="ghost" 
                            className="w-100 py-2 border-secondary text-white"
                            onClick={() => {
                              setAuditSearch("");
                              setAuditCategory("All");
                              setAuditResult("All");
                              setAuditStartDate("");
                              setAuditEndDate("");
                              setTimeout(() => fetchAuditLogs(1), 50);
                            }}
                          >
                            Clear Filters
                          </Button>
                        </div>
                      </div>

                      {/* Audit Table */}
                      {auditLoading ? (
                        <div className="d-flex flex-column gap-2 py-4">
                          <Skeleton height="35px" />
                          <Skeleton height="35px" />
                          <Skeleton height="35px" />
                        </div>
                      ) : auditLogs.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                          <FaHistory size={48} className="mb-2 opacity-50" />
                          <p>No audit trail logs match your filters.</p>
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-dark table-striped text-white" style={{ fontSize: "0.82rem" }}>
                            <thead>
                              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                                <th>Timestamp</th>
                                <th>Actor</th>
                                <th>Category</th>
                                <th>Action</th>
                                <th>Resource</th>
                                <th>Result</th>
                                <th>Inspect</th>
                              </tr>
                            </thead>
                            <tbody>
                              {auditLogs.map(log => (
                                <tr key={log.id} style={{ borderBottom: "1px solid var(--border)", verticalAlign: "middle" }}>
                                  <td className="text-muted">{new Date(log.created_at).toLocaleString()}</td>
                                  <td>
                                    <div className="d-flex flex-column text-start">
                                      <span className="fw-semibold">{log.actor_name}</span>
                                      <small className="text-muted">{log.actor_email}</small>
                                    </div>
                                  </td>
                                  <td>
                                    <Badge variant="primary" style={{ fontSize: "0.68rem" }}>{log.event_category}</Badge>
                                  </td>
                                  <td className="fw-bold">{log.action}</td>
                                  <td>
                                    {log.resource_type} {log.resource_id ? `#${log.resource_id}` : ""}
                                  </td>
                                  <td>
                                    <Badge variant={log.result === "SUCCESS" ? "success" : "danger"}>{log.result}</Badge>
                                  </td>
                                  <td>
                                    <button 
                                      className="btn btn-sm btn-ghost p-1 text-white border-0" 
                                      onClick={() => openAuditDetails(log)}
                                      title="Inspect Metadata Details"
                                    >
                                      <FaEye size={14} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {/* Pagination */}
                          <div className="d-flex align-items-center justify-content-between mt-4">
                            <span className="text-muted" style={{ fontSize: "0.8rem" }}>Total events: {auditTotalLogs}</span>
                            <div className="d-flex gap-2">
                              <Button 
                                variant="ghost" 
                                className="p-2 border-secondary text-white"
                                disabled={auditPage === 1}
                                onClick={() => fetchAuditLogs(auditPage - 1)}
                              >
                                <FaChevronLeft size={12} />
                              </Button>
                              <span className="align-self-center text-muted" style={{ fontSize: "0.85rem" }}>Page {auditPage} of {auditTotalPages}</span>
                              <Button 
                                variant="ghost" 
                                className="p-2 border-secondary text-white"
                                disabled={auditPage === auditTotalPages}
                                onClick={() => fetchAuditLogs(auditPage + 1)}
                              >
                                <FaChevronRight size={12} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 11. SYSTEM INFORMATION PORTAL */}
                  {activeTab === "sysinfo" && isAdmin && (
                    <div className="text-start">
                      <h5 className="fw-bold mb-3" style={{ color: "var(--text-primary)" }}>System Administration Diagnostic</h5>
                      <p className="text-muted mb-4" style={{ fontSize: "0.82rem" }}>
                        View live status connectivity checks, configurations flags, and runtime process details.
                      </p>

                      {sysInfoLoading ? (
                        <div className="d-flex flex-column gap-3">
                          <Skeleton height="80px" />
                          <Skeleton height="80px" />
                        </div>
                      ) : systemInfo ? (
                        <div className="d-flex flex-column gap-4">
                          
                          {/* Active services health grid */}
                          <div className="row g-3">
                            <div className="col-md-6 col-lg-4">
                              <div className="p-3 bg-dark rounded border border-secondary d-flex justify-content-between align-items-center">
                                <div className="text-start">
                                  <span className="fw-semibold d-block" style={{ fontSize: "0.85rem" }}>MySQL Database</span>
                                  <small className="text-muted" style={{ fontSize: "0.75rem" }}>Connection pool ping</small>
                                </div>
                                <Badge variant={systemInfo.services?.database?.status === "OPERATIONAL" ? "success" : "danger"}>
                                  {systemInfo.services?.database?.status}
                                </Badge>
                              </div>
                            </div>

                            <div className="col-md-6 col-lg-4">
                              <div className="p-3 bg-dark rounded border border-secondary d-flex justify-content-between align-items-center">
                                <div className="text-start">
                                  <span className="fw-semibold d-block" style={{ fontSize: "0.85rem" }}>AI Screening Engine</span>
                                  <small className="text-muted" style={{ fontSize: "0.75rem" }}>Rule NLP processor</small>
                                </div>
                                <Badge variant="success">OPERATIONAL</Badge>
                              </div>
                            </div>

                            <div className="col-md-6 col-lg-4">
                              <div className="p-3 bg-dark rounded border border-secondary d-flex justify-content-between align-items-center">
                                <div className="text-start">
                                  <span className="fw-semibold d-block" style={{ fontSize: "0.85rem" }}>Communications SMTP</span>
                                  <small className="text-muted" style={{ fontSize: "0.75rem" }}>Simulated gateways</small>
                                </div>
                                <Badge variant={systemInfo.services?.email?.status === "OPERATIONAL" ? "success" : "warning"}>
                                  {systemInfo.services?.email?.status}
                                </Badge>
                              </div>
                            </div>

                            <div className="col-md-6 col-lg-4">
                              <div className="p-3 bg-dark rounded border border-secondary d-flex justify-content-between align-items-center">
                                <div className="text-start">
                                  <span className="fw-semibold d-block" style={{ fontSize: "0.85rem" }}>CRON Scheduler</span>
                                  <small className="text-muted" style={{ fontSize: "0.75rem" }}>Calendar reminder loops</small>
                                </div>
                                <Badge variant="success">OPERATIONAL</Badge>
                              </div>
                            </div>

                            <div className="col-md-6 col-lg-4">
                              <div className="p-3 bg-dark rounded border border-secondary d-flex justify-content-between align-items-center">
                                <div className="text-start">
                                  <span className="fw-semibold d-block" style={{ fontSize: "0.85rem" }}>Real-time Server Channels</span>
                                  <small className="text-muted" style={{ fontSize: "0.75rem" }}>SSE notifications feeds</small>
                                </div>
                                <Badge variant="success">OPERATIONAL</Badge>
                              </div>
                            </div>
                          </div>

                          {/* Process runtime stats */}
                          <div className="card bg-dark border-secondary p-4">
                            <h6 className="fw-bold mb-3 text-info">Process Runtime Information</h6>
                            <div className="row g-3" style={{ fontSize: "0.84rem" }}>
                              <div className="col-md-6">
                                <div><strong>Node.js Version:</strong> {systemInfo.environment?.nodeVersion}</div>
                                <div><strong>Deployment Mode:</strong> {systemInfo.environment?.nodeEnv}</div>
                                <div><strong>System Uptime:</strong> {Math.round(systemInfo.environment?.uptime / 60)} minutes</div>
                              </div>
                              <div className="col-md-6">
                                <div><strong>RSS Allocated:</strong> {systemInfo.environment?.memoryUsage?.rss}</div>
                                <div><strong>Heap Allocated:</strong> {systemInfo.environment?.memoryUsage?.heapTotal}</div>
                                <div><strong>Heap In Use:</strong> {systemInfo.environment?.memoryUsage?.heapUsed}</div>
                              </div>
                            </div>
                          </div>

                        </div>
                      ) : (
                        <div className="text-danger py-4">Failed to connect to administrative monitoring pings.</div>
                      )}
                    </div>
                  )}

                </>
              )}

            </div>
          </div>

        </div>

      </div>

      {/* AUDIT LOG DETAILS MODAL */}
      <Modal isOpen={auditModalOpen} onClose={() => setAuditModalOpen(false)} title="Audit Event Trace Inspector">
        {selectedAuditLog && (
          <div className="text-start text-white">
            <h6 className="fw-bold mb-3" style={{ color: "var(--primary)" }}>Action: {selectedAuditLog.action}</h6>
            <div className="d-flex flex-column gap-2" style={{ fontSize: "0.85rem" }}>
              <div><strong>Event Category:</strong> {selectedAuditLog.event_category}</div>
              <div><strong>Execution Result:</strong> <Badge variant={selectedAuditLog.result === "SUCCESS" ? "success" : "danger"}>{selectedAuditLog.result}</Badge></div>
              <div><strong>Occurred At:</strong> {new Date(selectedAuditLog.created_at).toLocaleString()}</div>
              <div><strong>Client IP Address:</strong> {selectedAuditLog.ip_address || "System Loop"}</div>
              <div><strong>Client User Agent:</strong> {selectedAuditLog.user_agent || "Server Process"}</div>
              <hr className="my-2 border-secondary" />
              <div><strong>Target Resource Type:</strong> {selectedAuditLog.resource_type}</div>
              <div><strong>Target Resource ID:</strong> {selectedAuditLog.resource_id || "N/A"}</div>
              
              <div className="mt-3">
                <label className="fw-semibold text-muted d-block mb-1">Attached Safe Metadata logs</label>
                <div 
                  className="p-3 bg-dark rounded border border-secondary"
                  style={{ maxHeight: "250px", overflowY: "auto", fontFamily: "monospace", fontSize: "0.78rem" }}
                >
                  <pre className="mb-0 text-success">{JSON.stringify(selectedAuditLog.metadata, null, 2)}</pre>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end mt-4">
              <Button onClick={() => setAuditModalOpen(false)} variant="primary">Dismiss Inspector</Button>
            </div>
          </div>
        )}
      </Modal>

    </AppLayout>
  );
}

export default Settings;
