import { useEffect, useState } from "react";
import api from "../services/api";
import AppLayout from "../components/layout/AppLayout";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { FaCog, FaUser, FaLock, FaUsers, FaPlus, FaTrash, FaCheck, FaExclamationTriangle } from "react-icons/fa";

function Settings() {
    const role = localStorage.getItem("role") || "HR";
    const [activeTab, setActiveTab] = useState("profile");
    const [profile, setProfile] = useState({ name: "", email: "", role: "", created_at: "" });
    const [nameInput, setNameInput] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [users, setUsers] = useState([]);
    const [inviteName, setInviteName] = useState("");
    const [inviteEmail, setInviteEmail] = useState("");
    const [invitePassword, setInvitePassword] = useState("");
    const [inviteRole, setInviteRole] = useState("HR");
    const [message, setMessage] = useState({ text: "", type: "" });
    const [loading, setLoading] = useState(false);

    useEffect(() => { fetchProfile(); }, []);
    useEffect(() => { if (activeTab === "admin" && role === "Admin") fetchUsers(); }, [activeTab]);

    const showMessage = (text, type = "success") => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: "", type: "" }), 4000);
    };

    const fetchProfile = async () => {
        try {
            const res = await api.get("/api/settings/profile");
            setProfile(res.data);
            setNameInput(res.data.name || "");
        } catch {
            const email = localStorage.getItem("email") || "";
            setProfile({ name: email.split("@")[0], email, role, created_at: new Date().toISOString() });
            setNameInput(email.split("@")[0]);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get("/api/settings/users");
            setUsers(res.data || []);
        } catch {
            setUsers([
                { id: 1, name: "Admin User", email: "admin@example.com", role: "Admin", created_at: "2026-01-01" },
                { id: 2, name: "HR Manager", email: "hr@example.com", role: "HR", created_at: "2026-03-15" }
            ]);
        }
    };

    const handleUpdateName = async () => {
        if (!nameInput.trim()) return showMessage("Name cannot be empty", "error");
        setLoading(true);
        try {
            await api.put("/api/settings/profile", { name: nameInput.trim() });
            showMessage("Profile updated successfully");
            fetchProfile();
        } catch (err) {
            showMessage(err.response?.data?.message || "Failed to update profile", "error");
        } finally { setLoading(false); }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) return showMessage("All password fields are required", "error");
        if (newPassword.length < 6) return showMessage("New password must be at least 6 characters", "error");
        if (newPassword !== confirmPassword) return showMessage("Passwords do not match", "error");
        setLoading(true);
        try {
            await api.put("/api/settings/change-password", { currentPassword, newPassword });
            showMessage("Password changed successfully");
            setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
        } catch (err) {
            showMessage(err.response?.data?.message || "Failed to change password", "error");
        } finally { setLoading(false); }
    };

    const handleInvite = async () => {
        if (!inviteName || !inviteEmail || !invitePassword) return showMessage("All fields are required", "error");
        setLoading(true);
        try {
            await api.post("/api/settings/users/invite", { name: inviteName, email: inviteEmail, password: invitePassword, role: inviteRole });
            showMessage("User invited successfully");
            setInviteName(""); setInviteEmail(""); setInvitePassword("");
            fetchUsers();
        } catch (err) {
            showMessage(err.response?.data?.message || "Failed to invite user", "error");
        } finally { setLoading(false); }
    };

    const handleDeleteUser = async (id, userName) => {
        if (!window.confirm(`Delete user "${userName}"? This action cannot be undone.`)) return;
        try {
            await api.delete(`/api/settings/users/${id}`);
            showMessage("User deleted successfully");
            fetchUsers();
        } catch (err) {
            showMessage(err.response?.data?.message || "Failed to delete user", "error");
        }
    };

    const tabs = [
        { key: "profile", label: "Profile", icon: <FaUser /> },
        { key: "security", label: "Security", icon: <FaLock /> },
        ...(role === "Admin" ? [{ key: "admin", label: "User Management", icon: <FaUsers /> }] : [])
    ];

    const inputStyle = {
        background: "var(--background)", color: "var(--text-primary)",
        border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
        padding: "10px 14px", fontSize: "0.9rem", width: "100%"
    };

    return (
        <AppLayout>
            <div className="container-fluid px-0">
                {/* Header */}
                <h2 className="fw-bold mb-4" style={{ fontFamily: "var(--font-sans)", color: "var(--text-primary)" }}>
                    <FaCog className="me-2" style={{ color: "var(--primary)" }} />
                    Settings
                </h2>

                {/* Message Banner */}
                {message.text && (
                    <div
                        className="p-3 mb-4 d-flex align-items-center gap-2"
                        style={{
                            borderRadius: "var(--radius-sm)",
                            background: message.type === "error" ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
                            color: message.type === "error" ? "#ef4444" : "#10b981",
                            border: `1px solid ${message.type === "error" ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
                            fontSize: "0.88rem"
                        }}
                    >
                        {message.type === "error" ? <FaExclamationTriangle /> : <FaCheck />}
                        {message.text}
                    </div>
                )}

                <div className="row g-4">
                    {/* Tab Sidebar */}
                    <div className="col-md-3">
                        <div className="card-custom surface-custom border-custom p-2" style={{ borderRadius: "var(--radius-md)" }}>
                            {tabs.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className="w-100 d-flex align-items-center gap-2 p-3 mb-1"
                                    style={{
                                        border: "none",
                                        background: activeTab === tab.key ? "var(--primary)" : "transparent",
                                        color: activeTab === tab.key ? "#fff" : "var(--text-secondary)",
                                        borderRadius: "var(--radius-sm)",
                                        fontSize: "0.9rem",
                                        fontWeight: activeTab === tab.key ? 600 : 400,
                                        cursor: "pointer",
                                        transition: "all 0.15s ease",
                                        textAlign: "left"
                                    }}
                                >
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="col-md-9">
                        {/* PROFILE TAB */}
                        {activeTab === "profile" && (
                            <div className="card-custom surface-custom border-custom p-4" style={{ borderRadius: "var(--radius-md)" }}>
                                <h5 className="fw-bold mb-4" style={{ color: "var(--text-primary)" }}>Profile Information</h5>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold" style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>Full Name</label>
                                        <input type="text" value={nameInput} onChange={e => setNameInput(e.target.value)} style={inputStyle} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold" style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>Email Address</label>
                                        <input type="text" value={profile.email} disabled style={{ ...inputStyle, opacity: 0.6 }} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold" style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>Role</label>
                                        <input type="text" value={profile.role} disabled style={{ ...inputStyle, opacity: 0.6 }} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold" style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>Member Since</label>
                                        <input type="text" value={profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"} disabled style={{ ...inputStyle, opacity: 0.6 }} />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <Button variant="primary" onClick={handleUpdateName} disabled={loading}>
                                        {loading ? "Saving…" : "Save Changes"}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* SECURITY TAB */}
                        {activeTab === "security" && (
                            <div className="card-custom surface-custom border-custom p-4" style={{ borderRadius: "var(--radius-md)" }}>
                                <h5 className="fw-bold mb-4" style={{ color: "var(--text-primary)" }}>Change Password</h5>
                                <div className="row g-3" style={{ maxWidth: 500 }}>
                                    <div className="col-12">
                                        <label className="form-label fw-semibold" style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>Current Password</label>
                                        <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={inputStyle} placeholder="Enter current password" />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label fw-semibold" style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>New Password</label>
                                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} placeholder="Enter new password (min 6 chars)" />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label fw-semibold" style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>Confirm New Password</label>
                                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} placeholder="Confirm new password" />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <Button variant="primary" onClick={handleChangePassword} disabled={loading}>
                                        {loading ? "Changing…" : "Change Password"}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* ADMIN TAB */}
                        {activeTab === "admin" && role === "Admin" && (
                            <div className="d-flex flex-column gap-4">
                                {/* Invite User */}
                                <div className="card-custom surface-custom border-custom p-4" style={{ borderRadius: "var(--radius-md)" }}>
                                    <h5 className="fw-bold mb-3" style={{ color: "var(--text-primary)" }}>
                                        <FaPlus className="me-2" style={{ color: "var(--primary)" }} />
                                        Invite New User
                                    </h5>
                                    <div className="row g-3">
                                        <div className="col-md-3">
                                            <input type="text" placeholder="Full Name" value={inviteName} onChange={e => setInviteName(e.target.value)} style={inputStyle} />
                                        </div>
                                        <div className="col-md-3">
                                            <input type="email" placeholder="Email Address" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} style={inputStyle} />
                                        </div>
                                        <div className="col-md-2">
                                            <input type="password" placeholder="Password" value={invitePassword} onChange={e => setInvitePassword(e.target.value)} style={inputStyle} />
                                        </div>
                                        <div className="col-md-2">
                                            <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} style={inputStyle}>
                                                <option value="HR">HR</option>
                                                <option value="Admin">Admin</option>
                                                <option value="Candidate">Candidate</option>
                                            </select>
                                        </div>
                                        <div className="col-md-2">
                                            <Button variant="primary" className="w-100" onClick={handleInvite} disabled={loading}>
                                                {loading ? "…" : "Invite"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Users Table */}
                                <div className="card-custom surface-custom border-custom p-4" style={{ borderRadius: "var(--radius-md)" }}>
                                    <h5 className="fw-bold mb-3" style={{ color: "var(--text-primary)" }}>
                                        <FaUsers className="me-2" style={{ color: "var(--primary)" }} />
                                        All Users ({users.length})
                                    </h5>
                                    <div style={{ overflowX: "auto" }}>
                                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                            <thead>
                                                <tr style={{ borderBottom: "2px solid var(--border)" }}>
                                                    {["ID", "Name", "Email", "Role", "Joined", "Actions"].map(h => (
                                                        <th key={h} style={{ padding: "10px 12px", fontSize: "0.78rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left" }}>
                                                            {h}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.map(user => (
                                                    <tr key={user.id} style={{ borderBottom: "1px solid var(--border)" }}>
                                                        <td style={{ padding: "10px 12px", fontSize: "0.88rem", color: "var(--text-secondary)" }}>#{user.id}</td>
                                                        <td style={{ padding: "10px 12px", fontSize: "0.88rem", color: "var(--text-primary)", fontWeight: 600 }}>{user.name}</td>
                                                        <td style={{ padding: "10px 12px", fontSize: "0.88rem", color: "var(--text-secondary)" }}>{user.email}</td>
                                                        <td style={{ padding: "10px 12px" }}>
                                                            <Badge variant={user.role === "Admin" ? "danger" : user.role === "HR" ? "primary" : "info"}>{user.role}</Badge>
                                                        </td>
                                                        <td style={{ padding: "10px 12px", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                                                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                                                        </td>
                                                        <td style={{ padding: "10px 12px" }}>
                                                            <button
                                                                onClick={() => handleDeleteUser(user.id, user.name)}
                                                                style={{
                                                                    border: "none", background: "rgba(239,68,68,0.1)",
                                                                    color: "#ef4444", padding: "4px 10px",
                                                                    borderRadius: "var(--radius-sm)",
                                                                    cursor: "pointer", fontSize: "0.8rem"
                                                                }}
                                                                title="Delete user"
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

export default Settings;
