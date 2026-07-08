import React, { useEffect, useState } from "react";
import api from "../services/api";
import AppLayout from "../components/layout/AppLayout";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";
import Skeleton from "../components/ui/Skeleton";
import { Card, CardContent } from "../components/ui/Card";
import StatCard from "../components/ui/StatCard";
import { 
  FaUsers, 
  FaUserPlus, 
  FaSearch, 
  FaUserShield, 
  FaClock, 
  FaInfoCircle, 
  FaUndo, 
  FaBan, 
  FaTrash,
  FaEnvelope, 
  FaCrown,
  FaCheckCircle,
  FaUserCog
} from "react-icons/fa";

function Team() {
  const currentUserRole = localStorage.getItem("role") || "HR";
  const currentUserEmail = localStorage.getItem("email") || "";
  const isAdmin = currentUserRole === "Admin";

  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  // Invite Modal State
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Recruiter");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");

  // Role Info Modal State
  const [infoOpen, setInfoOpen] = useState(false);

  // Edit Role Modal State
  const [roleOpen, setRoleOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [newRole, setNewRole] = useState("Recruiter");
  const [roleLoading, setRoleLoading] = useState(false);

  const fetchTeamData = async () => {
    setLoading(true);
    setError("");
    try {
      const [membersRes, invitesRes] = await Promise.all([
        api.get("/api/team/members"),
        api.get("/api/team/invitations")
      ]);
      setMembers(membersRes.data || []);
      setInvitations(invitesRes.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch team dataset. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    setGeneratedLink("");
    try {
      const res = await api.post("/api/team/invitations", {
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole
      });
      alert(res.data.message || "Invitation created successfully!");
      if (res.data.inviteUrl) {
        // Build absolute invite URL
        const absoluteUrl = `${window.location.origin}${res.data.inviteUrl}`;
        setGeneratedLink(absoluteUrl);
      }
      setInviteEmail("");
      fetchTeamData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create invitation");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCancelInvite = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this pending invitation?")) return;
    try {
      await api.delete(`/api/team/invitations/${id}`);
      alert("Invitation cancelled");
      fetchTeamData();
    } catch (err) {
      alert("Failed to cancel invitation");
    }
  };

  const handleResendInvite = async (id) => {
    try {
      const res = await api.post(`/api/team/invitations/${id}/resend`);
      const absoluteUrl = `${window.location.origin}${res.data.inviteUrl}`;
      alert("Invitation resent! New link generated.");
      // Copy to clipboard or show link
      setInviteOpen(true);
      setGeneratedLink(absoluteUrl);
      fetchTeamData();
    } catch (err) {
      alert("Failed to resend invitation");
    }
  };

  const handleDeactivate = async (membershipId, currentStatus, name) => {
    const nextStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const msg = nextStatus === "INACTIVE" 
      ? `Deactivate workspace access for "${name}"? They will lose dashboard privileges immediately.`
      : `Reactivate workspace access for "${name}"?`;
    
    if (!window.confirm(msg)) return;
    
    try {
      const res = await api.put(`/api/team/members/${membershipId}/status`, { status: nextStatus });
      alert(res.data.message || "Status updated successfully");
      fetchTeamData();
    } catch (err) {
      alert(err.response?.data?.message || "Status update failed");
    }
  };

  const handleRemoveMember = async (membershipId, name) => {
    if (!window.confirm(`Permanently remove team member "${name}" from this organization? Historical activities, feedback, and logs will remain attributed to them.`)) return;
    try {
      const res = await api.delete(`/api/team/members/${membershipId}`);
      alert(res.data.message || "Member removed");
      fetchTeamData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to remove member");
    }
  };

  const openEditRole = (member) => {
    setSelectedMember(member);
    setNewRole(member.role);
    setRoleOpen(true);
  };

  const handleSaveRole = async () => {
    if (!selectedMember) return;
    setRoleLoading(true);
    try {
      const res = await api.put(`/api/team/members/${selectedMember.membership_id}/role`, { role: newRole });
      alert(res.data.message || "Role updated successfully");
      setRoleOpen(false);
      fetchTeamData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update role");
    } finally {
      setRoleLoading(false);
    }
  };

  // Filter lists
  const filteredMembers = members.filter(m => {
    const matchesSearch = 
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase());
    
    const matchesRole = filterRole === "All" ? true : m.role === filterRole;
    const matchesStatus = filterStatus === "All" ? true : m.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate Metrics
  const activeCount = members.filter(m => m.status === "ACTIVE").length;
  const inactiveCount = members.filter(m => m.status === "INACTIVE").length;
  const adminCount = members.filter(m => m.role === "Admin").length;

  return (
    <AppLayout>
      <div className="container-fluid px-0 text-white text-start">
        
        {/* HEADER */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <h2 className="fw-bold mb-1" style={{ color: "var(--text-primary)" }}>Team Management</h2>
            <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
              Manage team members, configure system authorization roles, and view invitation logs.
            </p>
          </div>
          
          <div className="d-flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setInfoOpen(true)}
              className="d-flex align-items-center gap-2 text-light"
              style={{ border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <FaInfoCircle /> Role Privileges
            </Button>

            {isAdmin && (
              <Button
                variant="primary"
                onClick={() => {
                  setGeneratedLink("");
                  setInviteOpen(true);
                }}
                className="d-flex align-items-center gap-2"
              >
                <FaUserPlus /> Invite Member
              </Button>
            )}
          </div>
        </div>

        {/* METRICS CARDS */}
        <div className="row g-4 mb-4">
          <div className="col-6 col-md-3">
            <StatCard title="Total Team Members" value={members.length} icon={<FaUsers />} loading={loading} description="Assigned workspace users" />
          </div>
          <div className="col-6 col-md-3">
            <StatCard title="Active Access" value={activeCount} icon={<FaCheckCircle />} loading={loading} description="Active workspace accounts" />
          </div>
          <div className="col-6 col-md-3">
            <StatCard title="Pending Invites" value={invitations.length} icon={<FaClock />} loading={loading} description="Awaiting acceptance" />
          </div>
          <div className="col-6 col-md-3">
            <StatCard title="Admins Assigned" value={adminCount} icon={<FaCrown />} loading={loading} description="Root controllers" />
          </div>
        </div>

        {/* SEARCH AND FILTERS */}
        <Card className="surface-custom border-custom mb-4">
          <CardContent className="p-3">
            <div className="row g-3">
              <div className="col-md-5 position-relative">
                <div className="position-absolute" style={{ left: "22px", top: "20px", color: "var(--text-secondary)" }}>
                  <FaSearch size={14} />
                </div>
                <input
                  type="text"
                  placeholder="Search members by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: "38px" }}
                />
              </div>

              <div className="col-md-3">
                <Select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  options={[
                    { value: "All", label: "All Roles" },
                    { value: "Admin", label: "Admin" },
                    { value: "Recruiter", label: "Recruiter" },
                    { value: "Hiring Manager", label: "Hiring Manager" },
                    { value: "Interviewer", label: "Interviewer" }
                  ]}
                />
              </div>

              <div className="col-md-3">
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  options={[
                    { value: "All", label: "All Statuses" },
                    { value: "ACTIVE", label: "Active" },
                    { value: "INACTIVE", label: "Inactive" }
                  ]}
                />
              </div>

              <div className="col-md-1 d-flex">
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setSearch("");
                    setFilterRole("All");
                    setFilterStatus("All");
                  }}
                  className="w-100 p-0 text-muted"
                  title="Clear Filters"
                >
                  <FaUndo size={14} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* WORKSPACE MEMBERS TABLE */}
        <div className="row g-4">
          <div className="col-lg-8">
            <Card className="surface-custom border-custom">
              <CardContent className="p-4">
                <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <FaUserShield className="text-primary" /> Team Members ({filteredMembers.length})
                </h5>

                {loading ? (
                  <div className="d-flex flex-column gap-2">
                    <Skeleton height="50px" />
                    <Skeleton height="50px" />
                    <Skeleton height="50px" />
                  </div>
                ) : error ? (
                  <div className="text-center p-5 text-danger">{error}</div>
                ) : filteredMembers.length === 0 ? (
                  <div className="text-center py-5 text-muted opacity-75">
                    <FaUsers size={48} className="mb-2" />
                    <p className="mb-0">No team members match your current filters.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid var(--border)" }}>
                          <th style={{ padding: "12px", color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", textAlign: "left" }}>Member</th>
                          <th style={{ padding: "12px", color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", textAlign: "left" }}>Role</th>
                          <th style={{ padding: "12px", color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", textAlign: "left" }}>Status</th>
                          <th style={{ padding: "12px", color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", textAlign: "left" }}>Joined</th>
                          {isAdmin && <th style={{ padding: "12px", color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", textAlign: "right" }}>Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMembers.map(member => (
                          <tr key={member.membership_id} style={{ borderBottom: "1px solid var(--border)" }}>
                            
                            {/* Member Details */}
                            <td style={{ padding: "12px" }}>
                              <div className="d-flex align-items-center gap-2.5">
                                <div 
                                  style={{
                                    width: "36px", height: "36px", borderRadius: "50%",
                                    background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontWeight: 600, color: "var(--primary)"
                                  }}
                                >
                                  {member.name ? member.name.charAt(0).toUpperCase() : "?"}
                                </div>
                                <div className="d-flex flex-column text-start">
                                  <span className="fw-semibold" style={{ color: "var(--text-primary)", fontSize: "0.92rem" }}>
                                    {member.name} {member.email === currentUserEmail && <small className="text-primary">(You)</small>}
                                  </span>
                                  <small className="text-muted" style={{ fontSize: "0.78rem" }}>{member.email}</small>
                                </div>
                              </div>
                            </td>

                            {/* Role */}
                            <td style={{ padding: "12px" }}>
                              <Badge variant={member.role === "Admin" ? "danger" : member.role === "Recruiter" ? "primary" : "info"}>
                                {member.role}
                              </Badge>
                            </td>

                            {/* Status */}
                            <td style={{ padding: "12px" }}>
                              <span 
                                style={{
                                  fontSize: "0.8rem", fontWeight: 600,
                                  color: member.status === "ACTIVE" ? "#10b981" : "#64748b"
                                }}
                              >
                                {member.status === "ACTIVE" ? "Active" : "Deactivated"}
                              </span>
                            </td>

                            {/* Joined */}
                            <td style={{ padding: "12px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                              {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : "—"}
                            </td>

                            {/* Admin Actions */}
                            {isAdmin && (
                              <td style={{ padding: "12px", textAlign: "right" }}>
                                <div className="d-flex align-items-center justify-content-end gap-2">
                                  {/* Change Role */}
                                  <button
                                    onClick={() => openEditRole(member)}
                                    disabled={member.email === currentUserEmail}
                                    style={{
                                      border: "none", background: "rgba(99,102,241,0.1)",
                                      color: "var(--primary)", padding: "6px 10px", borderRadius: "var(--radius-sm)",
                                      fontSize: "0.8rem", cursor: "pointer", opacity: member.email === currentUserEmail ? 0.4 : 1
                                    }}
                                    title="Edit Authorization Role"
                                  >
                                    <FaUserCog /> Role
                                  </button>

                                  {/* Deactivate/Reactivate */}
                                  <button
                                    onClick={() => handleDeactivate(member.membership_id, member.status, member.name)}
                                    disabled={member.email === currentUserEmail}
                                    style={{
                                      border: "none",
                                      background: member.status === "ACTIVE" ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
                                      color: member.status === "ACTIVE" ? "#ef4444" : "#10b981",
                                      padding: "6px 10px", borderRadius: "var(--radius-sm)",
                                      fontSize: "0.8rem", cursor: "pointer", opacity: member.email === currentUserEmail ? 0.4 : 1
                                    }}
                                    title={member.status === "ACTIVE" ? "Suspend workspace access" : "Restore workspace access"}
                                  >
                                    <FaBan /> {member.status === "ACTIVE" ? "Deactivate" : "Activate"}
                                  </button>

                                  {/* Delete */}
                                  <button
                                    onClick={() => handleRemoveMember(member.membership_id, member.name)}
                                    disabled={member.email === currentUserEmail}
                                    style={{
                                      border: "none", background: "rgba(239,68,68,0.15)",
                                      color: "#ef4444", padding: "6px", borderRadius: "var(--radius-sm)",
                                      cursor: "pointer", opacity: member.email === currentUserEmail ? 0.4 : 1
                                    }}
                                    title="Remove permanently"
                                  >
                                    <FaTrash size={12} />
                                  </button>
                                </div>
                              </td>
                            )}

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* INVITATION LOGS */}
          <div className="col-lg-4">
            <Card className="surface-custom border-custom h-100">
              <CardContent className="p-4 d-flex flex-column gap-3">
                <h5 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <FaEnvelope className="text-info" /> Invitation Logs
                </h5>
                
                {loading ? (
                  <Skeleton height="150px" />
                ) : invitations.length === 0 ? (
                  <div className="text-center py-5 text-muted opacity-75 d-flex flex-column align-items-center justify-content-center">
                    <FaEnvelope size={32} className="mb-2 text-muted" />
                    <p className="mb-0" style={{ fontSize: "0.88rem" }}>No pending invitations active.</p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3 overflow-y-auto" style={{ maxHeight: "400px" }}>
                    {invitations.map(invite => {
                      const isExpired = new Date() > new Date(invite.expires_at);
                      return (
                        <div 
                          key={invite.id} 
                          className="p-3 text-start"
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            border: `1px solid ${isExpired ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)"}`,
                            borderRadius: "var(--radius-sm)"
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-start gap-2 mb-1.5">
                            <span className="fw-semibold text-truncate" style={{ fontSize: "0.88rem", color: "var(--text-primary)" }}>
                              {invite.email}
                            </span>
                            <Badge variant={isExpired ? "secondary" : "info"} style={{ fontSize: "0.7rem" }}>
                              {invite.role}
                            </Badge>
                          </div>
                          
                          <div className="d-flex flex-column mb-3 text-muted" style={{ fontSize: "0.78rem" }}>
                            <span>Invited by: {invite.invited_by_name || "Admin"}</span>
                            <span>Expires: {new Date(invite.expires_at).toLocaleString()}</span>
                          </div>

                          {isAdmin && (
                            <div className="d-flex justify-content-end gap-2">
                              <button
                                onClick={() => handleResendInvite(invite.id)}
                                style={{
                                  border: "none", background: "rgba(255,255,255,0.08)",
                                  color: "var(--text-primary)", padding: "4px 10px", borderRadius: "var(--radius-sm)",
                                  fontSize: "0.75rem", cursor: "pointer"
                                }}
                              >
                                Resend
                              </button>
                              <button
                                onClick={() => handleCancelInvite(invite.id)}
                                style={{
                                  border: "none", background: "rgba(239,68,68,0.1)",
                                  color: "#ef4444", padding: "4px 10px", borderRadius: "var(--radius-sm)",
                                  fontSize: "0.75rem", cursor: "pointer"
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* INVITE DIALOG MODAL */}
        <Modal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Team Member">
          <form onSubmit={handleInvite} className="d-flex flex-column gap-3 text-start">
            <div>
              <label className="form-label fw-semibold text-muted mb-1" style={{ fontSize: "0.8rem" }}>Email Address</label>
              <Input
                type="email"
                placeholder="developer@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                disabled={inviteLoading}
              />
            </div>

            <div>
              <label className="form-label fw-semibold text-muted mb-1" style={{ fontSize: "0.8rem" }}>Select Access Role</label>
              <Select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                options={[
                  { value: "Admin", label: "Admin User (Full workspace & team settings)" },
                  { value: "Recruiter", label: "Recruiter (Create jobs, manage candidates, interview pipeline)" },
                  { value: "Hiring Manager", label: "Hiring Manager (Review assigned candidates & submit feedback)" },
                  { value: "Interviewer", label: "Interviewer (Review assigned interviews & submit scorecards)" }
                ]}
                disabled={inviteLoading}
              />
            </div>

            {generatedLink && (
              <div 
                className="p-3 my-2 text-start"
                style={{
                  background: "rgba(16,185,129,0.1)",
                  border: "1px solid rgba(16,185,129,0.3)",
                  borderRadius: "var(--radius-sm)"
                }}
              >
                <div className="fw-semibold text-success mb-1" style={{ fontSize: "0.85rem" }}>Secure Registration Link Generated:</div>
                <div 
                  className="p-2 mb-2 bg-dark rounded text-break"
                  style={{ fontSize: "0.78rem", border: "1px solid rgba(255,255,255,0.15)", color: "#10b981", userSelect: "all" }}
                >
                  {generatedLink}
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-100 py-1.5"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedLink);
                    alert("Invite link copied to clipboard!");
                  }}
                  style={{ fontSize: "0.8rem", border: "1px solid rgba(16,185,129,0.4)", color: "#10b981" }}
                >
                  Copy to Clipboard
                </Button>
              </div>
            )}

            <div className="d-flex justify-content-end gap-2.5 mt-3">
              <Button type="button" variant="ghost" onClick={() => setInviteOpen(false)} disabled={inviteLoading}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={inviteLoading}>
                Generate Invite Link
              </Button>
            </div>
          </form>
        </Modal>

        {/* EDIT ROLE MODAL */}
        <Modal isOpen={roleOpen} onClose={() => setRoleOpen(false)} title="Update Authorization Role">
          <div className="text-start">
            <p className="text-muted mb-3" style={{ fontSize: "0.88rem" }}>
              Update workspace permissions for <strong>{selectedMember?.name}</strong> ({selectedMember?.email}).
            </p>

            <div className="mb-4">
              <label className="form-label fw-semibold text-muted mb-1" style={{ fontSize: "0.8rem" }}>Workspace Role</label>
              <Select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                options={[
                  { value: "Admin", label: "Admin" },
                  { value: "Recruiter", label: "Recruiter" },
                  { value: "Hiring Manager", label: "Hiring Manager" },
                  { value: "Interviewer", label: "Interviewer" }
                ]}
                disabled={roleLoading}
              />
            </div>

            <div className="d-flex justify-content-end gap-2.5">
              <Button variant="ghost" onClick={() => setRoleOpen(false)} disabled={roleLoading}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveRole} loading={roleLoading}>
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>

        {/* ROLE MATRIX INFO MODAL */}
        <Modal isOpen={infoOpen} onClose={() => setInfoOpen(false)} title="Workspace Role Privileges Matrix">
          <div className="text-start" style={{ overflowX: "auto" }}>
            <table className="table table-dark table-striped text-white" style={{ fontSize: "0.82rem" }}>
              <thead>
                <tr>
                  <th>Permission Privilege</th>
                  <th>Admin</th>
                  <th>Recruiter</th>
                  <th>Hiring Manager</th>
                  <th>Interviewer</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="fw-semibold">Invite Team Members / Cancel Invites</td>
                  <td className="text-success fw-bold">Yes</td>
                  <td className="text-danger">No</td>
                  <td className="text-danger">No</td>
                  <td className="text-danger">No</td>
                </tr>
                <tr>
                  <td className="fw-semibold">Change Member Roles / Suspend access</td>
                  <td className="text-success fw-bold">Yes</td>
                  <td className="text-danger">No</td>
                  <td className="text-danger">No</td>
                  <td className="text-danger">No</td>
                </tr>
                <tr>
                  <td className="fw-semibold">Create Requisitions / Edit specs</td>
                  <td className="text-success fw-bold">Yes</td>
                  <td className="text-success fw-bold">Yes</td>
                  <td className="text-danger">No</td>
                  <td className="text-danger">No</td>
                </tr>
                <tr>
                  <td className="fw-semibold">View Workspace Jobs</td>
                  <td className="text-success fw-bold">All</td>
                  <td className="text-success fw-bold">All</td>
                  <td className="text-info fw-bold">Assigned Only</td>
                  <td className="text-danger">No</td>
                </tr>
                <tr>
                  <td className="fw-semibold">Manage Applications / Pipeline Stages</td>
                  <td className="text-success fw-bold">Yes</td>
                  <td className="text-success fw-bold">Yes</td>
                  <td className="text-info fw-bold">Limited/Review</td>
                  <td className="text-danger">No</td>
                </tr>
                <tr>
                  <td className="fw-semibold">Schedule Candidates & Interviews</td>
                  <td className="text-success fw-bold">Yes</td>
                  <td className="text-success fw-bold">Yes</td>
                  <td className="text-danger">No</td>
                  <td className="text-danger">No</td>
                </tr>
                <tr>
                  <td className="fw-semibold">Submit Feedback Scorecard</td>
                  <td className="text-success fw-bold">Yes</td>
                  <td className="text-success fw-bold">Yes</td>
                  <td className="text-success fw-bold">Yes</td>
                  <td className="text-success fw-bold">Assigned Only</td>
                </tr>
                <tr>
                  <td className="fw-semibold">View general Workspace Analytics</td>
                  <td className="text-success fw-bold">Yes</td>
                  <td className="text-success fw-bold">Yes</td>
                  <td className="text-danger">No</td>
                  <td className="text-danger">No</td>
                </tr>
              </tbody>
            </table>
            <div className="d-flex justify-content-end mt-3">
              <Button variant="primary" onClick={() => setInfoOpen(false)}>
                Dismiss
              </Button>
            </div>
          </div>
        </Modal>

      </div>
    </AppLayout>
  );
}

export default Team;
