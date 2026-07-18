import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import { Card, CardContent } from "../components/ui/Card";
import { FaUserCircle } from "react-icons/fa";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Candidate");
  const [loading, setLoading] = useState(false);
  const [wakingUp, setWakingUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async (e) => {
    if (e) e.preventDefault();

    if (!name.trim() || !email.trim() || !password || !role) {
      alert("All fields are required");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    setWakingUp(false);

    const wakingUpTimer = setTimeout(() => {
      setWakingUp(true);
    }, 5000);

    try {
      const response = await api.post("/api/auth/register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      }, { timeout: 60000 });

      alert(response.data.message || "Registration Successful!");
      navigate("/login");
    } catch (error) {
      if (error.code === 'ECONNABORTED' || !error.response) {
        alert("Waking up server, this can take up to a minute on first request. Please try again shortly.");
      } else if (error.response && error.response.data) {
        alert(error.response.data.message || "Registration Failed");
      } else {
        alert("Server Error");
      }
    } finally {
      clearTimeout(wakingUpTimer);
      setWakingUp(false);
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: "Candidate", label: "Candidate (Apply & Track Jobs)" },
    { value: "HR", label: "HR Recruiter (Manage Jobs & Screen Resumes)" },
    { value: "Admin", label: "Admin User (Manage Platform Settings)" }
  ];

  return (
    <div
      className="container-fluid"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a, #1e293b, #2563eb)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: "500px",
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: "var(--radius-lg)",
        }}
        data-aos="zoom-in"
      >
        <CardContent className="p-4 p-md-5 text-white">
          <div className="text-center mb-4">
            <FaUserCircle size={56} className="text-info mb-2" />
            <h2 className="fw-bold mb-1" style={{ fontFamily: "var(--font-sans)" }}>
              Create Account
            </h2>
            <p className="text-light opacity-75 mb-0" style={{ fontSize: "0.9rem" }}>
              Join the intelligent AI hiring network
            </p>
          </div>

          <form onSubmit={handleRegister}>
            <Input
              id="name"
              type="text"
              label="Full Name"
              placeholder="Alex Morgan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#fff",
              }}
            />

            <Input
              id="email"
              type="email"
              label="Email Address"
              placeholder="alex@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#fff",
              }}
            />

            <div className="position-relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                label="Password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                helperText="Must be at least 6 characters long"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#fff",
                  paddingRight: "45px",
                }}
              />
              <button
                type="button"
                className="btn-custom btn-custom-ghost p-1 position-absolute text-light"
                style={{
                  right: "10px",
                  top: "38px",
                  border: "none",
                  background: "transparent",
                  fontSize: "0.85rem",
                  color: "rgba(255,255,255,0.6)",
                }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <Select
              id="role"
              label="Select Platform Role"
              options={roleOptions}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              disabled={loading}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#fff",
              }}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-100 mt-4"
              loading={loading}
            >
              Sign Up
            </Button>

            {wakingUp && (
              <div className="alert alert-info py-2 px-3 mt-3 mb-0 text-center" style={{ fontSize: "0.85rem", background: "rgba(13, 202, 240, 0.15)", border: "1px solid rgba(13, 202, 240, 0.3)", color: "#0dcaf0" }}>
                Waking up server, this can take up to a minute on first request
              </div>
            )}

            <Button
              type="button"
              variant="ghost"
              className="w-100 mt-3 text-light text-decoration-none"
              style={{ color: "rgba(255,255,255,0.75)" }}
              onClick={() => navigate("/login")}
              disabled={loading}
            >
              Already have an account? Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default Register;