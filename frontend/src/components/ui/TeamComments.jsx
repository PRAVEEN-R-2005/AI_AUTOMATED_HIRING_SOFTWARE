import { useEffect, useState, useRef } from "react";
import api from "../../services/api";
import Button from "./Button";
import Badge from "./Badge";
import { FaComment, FaPaperPlane, FaEdit, FaTrash, FaUserCircle } from "react-icons/fa";

function TeamComments({ resourceType, resourceId }) {
  const currentUserEmail = localStorage.getItem("email") || "";
  const currentUserId = Number(localStorage.getItem("userId")) || 0;
  const currentUserRole = localStorage.getItem("role") || "Recruiter";

  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState([]);

  // Mentions Autocomplete State
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionIndex, setMentionIndex] = useState(-1);
  const textareaRef = useRef(null);

  // Edit Comment State
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState("");

  const loadComments = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/comments/${resourceType}/${resourceId}`);
      setComments(res.data || []);
    } catch (err) {
      console.warn("Failed to load comments list:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const res = await api.get("/api/team/members");
      setMembers((res.data || []).filter(m => m.status === "ACTIVE"));
    } catch (err) {
      console.warn("Failed to load workspace members:", err);
    }
  };

  useEffect(() => {
    if (resourceId) {
      loadComments();
      loadMembers();
    }
  }, [resourceType, resourceId]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      await api.post("/api/comments", {
        resourceType,
        resourceId,
        content: content.trim()
      });
      setContent("");
      loadComments();
    } catch (err) {
      alert("Failed to post comment");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteComment = async (id) => {
    if (!window.confirm("Permanently delete this comment?")) return;
    try {
      await api.delete(`/api/comments/${id}`);
      loadComments();
    } catch (err) {
      alert("Failed to delete comment");
    }
  };

  const handleStartEdit = (comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async (id) => {
    if (!editContent.trim()) return;
    try {
      await api.put(`/api/comments/${id}`, { content: editContent.trim() });
      setEditingCommentId(null);
      loadComments();
    } catch (err) {
      alert("Failed to update comment");
    }
  };

  // Textarea input monitoring for '@' character
  const handleInputChange = (e) => {
    const value = e.target.value;
    setContent(value);

    const selectionEnd = e.target.selectionEnd;
    const textBeforeCursor = value.slice(0, selectionEnd);
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");

    if (lastAtIdx !== -1 && lastAtIdx >= textBeforeCursor.search(/\s|^/)) {
      const triggerPart = textBeforeCursor.slice(lastAtIdx + 1);
      if (!triggerPart.includes(" ")) {
        setShowMentions(true);
        setMentionSearch(triggerPart);
        setMentionIndex(0);
        return;
      }
    }
    setShowMentions(false);
  };

  const selectMention = (member) => {
    const text = content;
    const selectionEnd = textareaRef.current?.selectionEnd || 0;
    const textBeforeCursor = text.slice(0, selectionEnd);
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");

    const before = text.slice(0, lastAtIdx);
    const after = text.slice(selectionEnd);
    
    // Add double quotes around name if it has spaces
    const nameStr = member.name.includes(" ") ? `"${member.name}"` : member.name;
    const newText = `${before}@${nameStr} ${after}`;

    setContent(newText);
    setShowMentions(false);
    
    // Put focus back to textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  // Mentions Filter list
  const filteredMembers = members.filter(m => 
    m.name?.toLowerCase().includes(mentionSearch.toLowerCase()) ||
    m.email?.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  return (
    <div className="text-white text-start d-flex flex-column gap-3.5">
      <h6 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: "var(--text-primary)" }}>
        <FaComment className="text-primary" /> Internal Hiring Team Notes
      </h6>

      {/* COMMENT THREAD LIST */}
      <div 
        className="p-3"
        style={{
          maxHeight: "350px",
          overflowY: "auto",
          background: "rgba(255, 255, 255, 0.02)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          display: "flex",
          flexDirection: "column",
          gap: "14px"
        }}
      >
        {loading ? (
          <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>Loading team notes...</p>
        ) : comments.length === 0 ? (
          <p className="text-muted text-center py-4 mb-0" style={{ fontSize: "0.88rem" }}>
            No internal notes logged. Use notes to coordinate scheduling, candidate status updates, or interview reviews.
          </p>
        ) : (
          comments.map(c => {
            const isAuthor = c.author_email?.toLowerCase() === currentUserEmail?.toLowerCase();
            const canDelete = isAuthor || currentUserRole === "Admin";
            
            return (
              <div 
                key={c.id}
                className="d-flex gap-2.5"
                style={{
                  background: isAuthor ? "rgba(99,102,241,0.03)" : "rgba(255,255,255,0.01)",
                  padding: "10px",
                  borderRadius: "var(--radius-sm)",
                  border: isAuthor ? "1px solid rgba(99,102,241,0.15)" : "1px solid var(--border)"
                }}
              >
                <div style={{ color: "var(--text-secondary)", marginTop: "2px" }}>
                  <FaUserCircle size={28} />
                </div>

                <div className="flex-grow-1 d-flex flex-column gap-1 text-start">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-1.5 flex-wrap">
                      <span className="fw-semibold" style={{ fontSize: "0.88rem", color: "var(--text-primary)" }}>
                        {c.author_name}
                      </span>
                      <span 
                        style={{
                          fontSize: "0.7rem", 
                          background: "rgba(255,255,255,0.08)",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          color: "var(--text-secondary)"
                        }}
                      >
                        {c.author_role}
                      </span>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <span className="text-muted" style={{ fontSize: "0.72rem" }}>
                        {new Date(c.created_at).toLocaleString()}
                      </span>
                      {isAuthor && editingCommentId !== c.id && (
                        <button 
                          onClick={() => handleStartEdit(c)}
                          style={{ border: "none", background: "none", color: "var(--text-secondary)", cursor: "pointer", padding: 0 }}
                          title="Edit Comment"
                        >
                          <FaEdit size={11} />
                        </button>
                      )}
                      {canDelete && (
                        <button 
                          onClick={() => handleDeleteComment(c.id)}
                          style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer", padding: 0 }}
                          title="Delete Comment"
                        >
                          <FaTrash size={11} />
                        </button>
                      )}
                    </div>
                  </div>

                  {editingCommentId === c.id ? (
                    <div className="d-flex flex-column gap-2 mt-1">
                      <textarea
                        className="form-control text-white"
                        rows="2"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        style={{ fontSize: "0.85rem", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border)" }}
                      />
                      <div className="d-flex justify-content-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingCommentId(null)}>Cancel</Button>
                        <Button variant="primary" size="sm" onClick={() => handleSaveEdit(c.id)}>Save</Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mb-0 text-light opacity-90" style={{ fontSize: "0.88rem", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                      {/* Color code @mentions in UI */}
                      {c.content.split(/(@[a-zA-Z0-9_.+-]+|@[a-zA-Z0-9_+-]+|@"[^"]+")/g).map((word, index) => {
                        if (word.startsWith("@")) {
                          return <strong key={index} style={{ color: "#38bdf8" }}>{word}</strong>;
                        }
                        return word;
                      })}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* INPUT FORM WITH AUTOCOMPLETE dropdown */}
      <form onSubmit={handlePostComment} className="position-relative">
        {showMentions && filteredMembers.length > 0 && (
          <div 
            className="position-absolute shadow-lg border text-start"
            style={{
              bottom: "100%",
              left: 0,
              right: 0,
              background: "#1e293b",
              borderColor: "var(--border)",
              borderRadius: "var(--radius-sm)",
              maxHeight: "150px",
              overflowY: "auto",
              zIndex: 100,
              marginBottom: "4px"
            }}
          >
            <div className="p-2 border-bottom text-muted" style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.02)" }}>
              Mention Organization Member...
            </div>
            {filteredMembers.map((member, i) => (
              <div
                key={member.user_id}
                onClick={() => selectMention(member)}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  background: mentionIndex === i ? "rgba(99,102,241,0.15)" : "transparent",
                  borderBottom: "1px solid rgba(255,255,255,0.03)"
                }}
                className="d-flex align-items-center justify-content-between text-white"
              >
                <div>
                  <span className="fw-semibold" style={{ fontSize: "0.85rem" }}>{member.name}</span>
                  <small className="text-muted ms-2" style={{ fontSize: "0.75rem" }}>({member.email})</small>
                </div>
                <Badge variant="info" style={{ fontSize: "0.68rem" }}>{member.role}</Badge>
              </div>
            ))}
          </div>
        )}

        <div className="input-group">
          <textarea
            ref={textareaRef}
            rows="2"
            className="form-control text-white"
            placeholder="Type comment (Use @name to tag a hiring team member to notify them)..."
            value={content}
            onChange={handleInputChange}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border)",
              fontSize: "0.88rem",
              borderRadius: "var(--radius-sm) 0 0 var(--radius-sm)"
            }}
          />
          <Button 
            type="submit" 
            variant="primary" 
            loading={saving}
            className="d-flex align-items-center justify-content-center px-4"
            style={{ borderRadius: "0 var(--radius-sm) var(--radius-sm) 0" }}
          >
            <FaPaperPlane />
          </Button>
        </div>
      </form>
    </div>
  );
}

export default TeamComments;
