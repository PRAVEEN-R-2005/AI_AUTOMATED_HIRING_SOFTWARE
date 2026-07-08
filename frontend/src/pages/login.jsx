import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Card, CardContent } from "../components/ui/Card";
import {
  FaRobot,
  FaCheckCircle,
  FaUsers,
  FaChartLine,
  FaBriefcase
} from "react-icons/fa";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [wakingUp, setWakingUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setWakingUp(false);

    const wakingUpTimer = setTimeout(() => {
      setWakingUp(true);
    }, 5000);

    try {
      const response = await api.post("/api/auth/login", {
        email,
        password
      }, { timeout: 60000 });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", response.data.role);
      localStorage.setItem("email", response.data.email);

      if (response.data.role === "Candidate") {
        navigate("/student-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      // Fallback for Vercel Demo / Offline Mode!
      const normalizedEmail = email?.trim().toLowerCase();
      const normalizedPassword = password?.trim();
      if (
        (normalizedEmail === "admin@gmail.com" && normalizedPassword === "admin123") ||
        (normalizedEmail === "hr@gmail.com" && normalizedPassword === "123456") ||
        (normalizedEmail === "candidate@gmail.com" && normalizedPassword === "123456")
      ) {
        let role = "Candidate";
        if (normalizedEmail === "admin@gmail.com") role = "Admin";
        else if (normalizedEmail === "hr@gmail.com") role = "HR";

        localStorage.setItem("token", "mock-demo-token");
        localStorage.setItem("role", role);
        localStorage.setItem("email", normalizedEmail);

        if (role === "Candidate") {
          navigate("/student-dashboard");
        } else {
          navigate("/dashboard");
        }
        return;
      }

      if (error.code === 'ECONNABORTED' || !error.response) {
        alert("Waking up server, this can take up to a minute on first request. Please try again shortly.");
      } else {
        alert(error.response.data?.message || "Invalid Credentials");
      }
    } finally {
      clearTimeout(wakingUpTimer);
      setWakingUp(false);
      setLoading(false);
    }
  };

  const demoLogin = async (emailValue, passwordValue) => {
    setLoading(true);
    setWakingUp(false);

    const wakingUpTimer = setTimeout(() => {
      setWakingUp(true);
    }, 5000);

    try {
      const response = await api.post("/api/auth/login", {
        email: emailValue,
        password: passwordValue
      }, { timeout: 60000 });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", response.data.role);
      localStorage.setItem("email", response.data.email);

      if (response.data.role === "Candidate") {
        navigate("/student-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      // Fallback for Vercel Demo / Offline Mode!
      const normalizedEmail = emailValue?.trim().toLowerCase();
      const normalizedPassword = passwordValue?.trim();
      if (
        (normalizedEmail === "admin@gmail.com" && normalizedPassword === "admin123") ||
        (normalizedEmail === "hr@gmail.com" && normalizedPassword === "123456") ||
        (normalizedEmail === "candidate@gmail.com" && normalizedPassword === "123456")
      ) {
        let role = "Candidate";
        if (normalizedEmail === "admin@gmail.com") role = "Admin";
        else if (normalizedEmail === "hr@gmail.com") role = "HR";

        localStorage.setItem("token", "mock-demo-token");
        localStorage.setItem("role", role);
        localStorage.setItem("email", normalizedEmail);

        if (role === "Candidate") {
          navigate("/student-dashboard");
        } else {
          navigate("/dashboard");
        }
        return;
      }

      if (error.code === 'ECONNABORTED' || !error.response) {
        alert("Waking up server, this can take up to a minute on first request. Please try again shortly.");
      } else {
        alert(error.response.data?.message || "Demo Login Failed");
      }
    } finally {
      clearTimeout(wakingUpTimer);
      setWakingUp(false);
      setLoading(false);
    }
  };

  return (
    <div
      className="container-fluid"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a, #1e293b, #2563eb)",
        display: "flex",
        alignItems: "center"
      }}
    >
      <div className="container">
        <div className="row align-items-center min-vh-100 py-5">
          {/* LEFT SIDE */}
          <div className="col-md-7 text-white pe-lg-5 mb-5 mb-md-0" data-aos="fade-right">
            <FaRobot size={64} className="mb-4 text-info" />
            <h1 className="fw-bold display-4 mb-2" style={{ fontFamily: "var(--font-sans)" }}>
              AI Hiring Suite
            </h1>
            <h4 className="text-light opacity-75 mb-4">
              Smart Recruitment & Applicant Tracking System
            </h4>
            <div className="d-flex flex-column gap-3 mt-4">
              <h5 className="d-flex align-items-center gap-2">
                <FaCheckCircle className="text-success" />
                AI Resume Parsing
              </h5>
              <h5 className="d-flex align-items-center gap-2">
                <FaChartLine className="text-success" />
                Match Score Generation
              </h5>
              <h5 className="d-flex align-items-center gap-2">
                <FaUsers className="text-success" />
                Candidate Ranking
              </h5>
              <h5 className="d-flex align-items-center gap-2">
                <FaBriefcase className="text-success" />
                Interview Scheduling
              </h5>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="col-md-5 d-flex justify-content-center" data-aos="fade-left">
            <Card
              style={{
                width: "100%",
                maxWidth: "450px",
                background: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "var(--radius-lg)"
              }}
            >
              <CardContent className="p-4 p-md-5 text-white">
                <h2 className="text-center fw-bold mb-4" style={{ fontFamily: "var(--font-sans)" }}>
                  Sign In
                </h2>

                <form onSubmit={handleLogin}>
                  <Input
                    id="email"
                    type="email"
                    label="Email Address"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}
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
                      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", paddingRight: "45px" }}
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

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-100 mt-2"
                    loading={loading}
                  >
                    Sign In
                  </Button>

                  {wakingUp && (
                    <div className="alert alert-info py-2 px-3 mt-3 mb-0 text-center" style={{ fontSize: "0.85rem", background: "rgba(13, 202, 240, 0.15)", border: "1px solid rgba(13, 202, 240, 0.3)", color: "#0dcaf0" }}>
                      Waking up server, this can take up to a minute on first request
                    </div>
                  )}

                  <div className="my-4 text-center">
                    <hr style={{ borderColor: "rgba(255,255,255,0.15)" }} />
                    <span className="bg-transparent px-2 text-light opacity-50" style={{ fontSize: "0.85rem" }}>
                      Or Continue With
                    </span>
                  </div>

                  <div className="d-flex flex-column gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-100"
                      style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}
                      onClick={() => demoLogin("admin@gmail.com", "admin123")}
                    >
                      Admin Demo Account
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      className="w-100"
                      style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}
                      onClick={() => demoLogin("hr@gmail.com", "123456")}
                    >
                      HR Demo Account
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      className="w-100"
                      style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}
                      onClick={() => demoLogin("candidate@gmail.com", "123456")}
                    >
                      Candidate Demo Account
                    </Button>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-100 mt-4 text-light text-decoration-none"
                    style={{ color: "rgba(255,255,255,0.75)" }}
                    onClick={() => navigate("/register")}
                  >
                    Don't have an account? Register
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
