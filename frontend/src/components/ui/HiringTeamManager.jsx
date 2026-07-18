import { useEffect, useState } from "react";
import api from "../../services/api";
import Button from "./Button";
import Select from "./Select";
import Badge from "./Badge";
import { FaUserPlus, FaTrash, FaUsers, FaUserTie } from "react-icons/fa";

function HiringTeamManager({ jobId, jobTitle }) {
  const [team, setTeam] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [assignedRole, setAssignedRole] = useState("Hiring Manager");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  const loadTeamData = async () => {
    setLoading(true);
    try {
      const [teamRes, membersRes] = await Promise.all([
        api.get(`/api/job-descriptions/${jobId}/team`),
        api.get("/api/team/members")
      ]);
      setTeam(teamRes.data || []);
      setAllMembers(membersRes.data || []);

      // Filter members who are ACTIVE
      const activeMembers = (membersRes.data || []).filter(m => m.status === "ACTIVE");
      if (activeMembers.length > 0) {
        setSelectedUserId(activeMembers[0].user_id);
      }
    } catch (err) {
      console.warn("Failed to load hiring team data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      loadTeamData();
    }
  }, [jobId]);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setAssigning(true);
    try {
      await api.post(`/api/job-descriptions/${jobId}/team`, {
        user_id: selectedUserId,
        assigned_role: assignedRole
      });
      alert("Hiring team updated!");
      loadTeamData();
    } catch (err) {
      alert(err.response?.data?.message || "Assignment failed");
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async (userId) => {
    if (!window.confirm("Remove this member's assignment for this job?")) return;
    try {
      await api.delete(`/api/job-descriptions/${jobId}/team/${userId}`);
      alert("Member unassigned successfully");
      loadTeamData();
    } catch (err) {
      alert("Failed to unassign member");
    }
  };

  // Only ACTIVE members of the organization who are not already assigned to the job
  const assignedUserIds = team.map(t => t.id);
  const eligibleAssignees = allMembers.filter(m => m.status === "ACTIVE" && !assignedUserIds.includes(m.user_id));

  return (
    <div className="text-white text-start">
      <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: "var(--text-primary)" }}>
        <FaUserTie className="text-primary" /> Hiring Team for: "{jobTitle}"
      </h6>

      <div className="row g-4">
        {/* ASSIGN FORM */}
        <div className="col-md-5">
          <div 
            className="p-3"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)"
            }}
          >
            <h6 className="fw-semibold text-primary mb-3">Assign Team Member</h6>
            {eligibleAssignees.length === 0 ? (
              <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>
                All active organization members are already assigned to this job requisition.
              </p>
            ) : (
              <form onSubmit={handleAssign} className="d-flex flex-column gap-3">
                <div>
                  <label className="form-label-custom mb-1" style={{ fontSize: "0.8rem" }}>Select Team Member</label>
                  <Select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    options={eligibleAssignees.map(m => ({
                      value: m.user_id,
                      label: `${m.name} (${m.email})`
                    }))}
                  />
                </div>

                <div>
                  <label className="form-label-custom mb-1" style={{ fontSize: "0.8rem" }}>Assignment Requisition Role</label>
                  <Select
                    value={assignedRole}
                    onChange={(e) => setAssignedRole(e.target.value)}
                    options={[
                      { value: "Hiring Manager", label: "Hiring Manager" },
                      { value: "Recruiter", label: "Recruiter" },
                      { value: "Interviewer", label: "Interviewer" }
                    ]}
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  loading={assigning}
                  className="w-100 d-flex align-items-center justify-content-center gap-2 mt-2"
                >
                  <FaUserPlus /> Assign to Job
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* TEAM MEMBER LIST */}
        <div className="col-md-7">
          <div 
            className="p-3"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              minHeight: "220px"
            }}
          >
            <h6 className="fw-semibold text-primary mb-3">Assigned Hiring Team ({team.length})</h6>
            {loading ? (
              <p className="text-muted" style={{ fontSize: "0.85rem" }}>Loading team details...</p>
            ) : team.length === 0 ? (
              <div className="text-center py-4 text-muted opacity-75 d-flex flex-column align-items-center justify-content-center">
                <FaUsers size={28} className="mb-2 text-muted" />
                <p className="mb-0" style={{ fontSize: "0.85rem" }}>No team members assigned to this job description yet.</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2" style={{ maxHeight: "250px", overflowY: "auto" }}>
                {team.map(member => (
                  <div 
                    key={member.id}
                    className="p-2.5 d-flex align-items-center justify-content-between"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)"
                    }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <div 
                        style={{
                          width: "30px", height: "30px", borderRadius: "50%",
                          background: "rgba(99,102,241,0.1)", color: "var(--primary)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.85rem", fontWeight: 600
                        }}
                      >
                        {member.name ? member.name.charAt(0).toUpperCase() : "?"}
                      </div>
                      <div className="d-flex flex-column text-start">
                        <span className="fw-semibold" style={{ fontSize: "0.88rem", color: "var(--text-primary)" }}>{member.name}</span>
                        <small className="text-muted" style={{ fontSize: "0.75rem" }}>{member.email}</small>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <Badge variant={member.assigned_role === "Recruiter" ? "primary" : "info"}>
                        {member.assigned_role}
                      </Badge>
                      <button
                        onClick={() => handleUnassign(member.id)}
                        style={{
                          border: "none", background: "rgba(239,68,68,0.15)",
                          color: "#ef4444", padding: "4px 8px", borderRadius: "var(--radius-sm)",
                          cursor: "pointer", fontSize: "0.75rem"
                        }}
                        title="Unassign member"
                      >
                        <FaTrash size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HiringTeamManager;
