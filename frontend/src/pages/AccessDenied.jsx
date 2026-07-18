import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { FaLock, FaHome, FaArrowLeft } from "react-icons/fa";

function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div
      className="container-fluid"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a, #1e293b, rgba(239, 68, 68, 0.15))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        className="text-center p-5 text-white"
        style={{
          maxWidth: "500px",
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(239, 68, 68, 0.25)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
        }}
        data-aos="zoom-in"
      >
        <div
          className="mb-4 d-inline-flex align-items-center justify-content-center"
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "rgba(239, 68, 68, 0.15)",
            border: "2px solid #ef4444",
            color: "#ef4444",
            fontSize: "2rem",
            animation: "pulse 2s infinite"
          }}
        >
          <FaLock />
        </div>

        <h2 className="fw-bold mb-2" style={{ fontFamily: "var(--font-sans)", letterSpacing: "-0.02em" }}>
          Access Denied
        </h2>
        <h5 className="text-danger fw-semibold mb-3">403 Forbidden</h5>
        
        <p className="text-light opacity-75 mb-4" style={{ fontSize: "0.95rem", lineHeight: "1.6" }}>
          You do not have the required permissions to view this resource. 
          Please contact your workspace administrator or switch to an authorized account.
        </p>

        <div className="d-flex justify-content-center gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="d-flex align-items-center gap-2 text-white border-secondary"
            style={{ border: "1px solid rgba(255,255,255,0.2)" }}
          >
            <FaArrowLeft /> Go Back
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate("/dashboard")}
            className="d-flex align-items-center gap-2"
          >
            <FaHome /> Dashboard
          </Button>
        </div>

        <style>{`
          @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
            70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          }
        `}</style>
      </div>
    </div>
  );
}

export default AccessDenied;
