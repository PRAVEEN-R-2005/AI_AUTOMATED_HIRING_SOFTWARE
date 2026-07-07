import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import {
  FaRobot,
  FaCheckCircle,
  FaUsers,
  FaChartLine,
  FaBriefcase,
  FaBars,
  FaTimes,
  FaRegQuestionCircle,
  FaTrophy,
  FaChevronDown,
  FaArrowRight,
  FaQuoteLeft
} from "react-icons/fa";

function Home() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const stats = [
    { label: "Resumes Evaluated", value: "142,500+" },
    { label: "Matches Scored", value: "98.2%" },
    { label: "Hiring Time Saved", value: "65%" },
    { label: "Positions Closed", value: "12,400+" }
  ];

  const features = [
    {
      icon: <FaRobot />,
      title: "AI Resume Screening",
      description: "Automatically parse, categorize, and extract structured qualifications from raw PDF resumes."
    },
    {
      icon: <FaChartLine />,
      title: "Smart Candidate Matching",
      description: "Directly compare candidate qualifications against job description criteria using linguistic analysis."
    },
    {
      icon: <FaUsers />,
      title: "Centralized Applicant Tracking",
      description: "Manage candidate pipelines from initial application to final interview stages from a single dashboard."
    },
    {
      icon: <FaTrophy />,
      title: "Candidate Ranking",
      description: "Sort and shortlist candidates by computed match scores to quickly focus on the most relevant applicants."
    },
    {
      icon: <FaBriefcase />,
      title: "Interview Management",
      description: "Schedule, coordinate, and track candidate interview outcomes with centralized calendars."
    },
    {
      icon: <FaCheckCircle />,
      title: "Recruitment Analytics",
      description: "Gain complete transparency into pipeline bottlenecks, application rates, and role match distributions."
    }
  ];

  const steps = [
    { step: "01", title: "Create a Job", desc: "Define job roles, experience parameters, and required skill tags." },
    { step: "02", title: "Receive Applications", desc: "Candidates upload resumes directly to position slots." },
    { step: "03", title: "AI Screen", desc: "The software parses content and calculates candidate matching metrics." },
    { step: "04", title: "Shortlist & Interview", desc: "Identify top candidate ranks, log calendar slots, and review resumes." }
  ];

  const roles = [
    {
      title: "For Recruitment Teams",
      desc: "Prune screening backlogs, bypass text screening fatigue, and prioritize hiring reviews using clear metrics.",
      bullets: ["65% average screening time reduction", "Consolidated pipeline dashboard", "Automated candidate scorecard comparisons"],
      cta: "Post Your First Position",
      link: "/register"
    },
    {
      title: "For Job Candidates",
      desc: "Apply to postings cleanly, manage your resume storage profile, and track your interview evaluations in real-time.",
      bullets: ["Simple resume-parse profile setups", "Interactive application pipeline tracking", "Consolidated interview scheduling"],
      cta: "Explore Opportunities",
      link: "/login"
    }
  ];

  const faqs = [
    {
      q: "What is the AI Automated Hiring Software?",
      a: "It is an intelligent applicant tracking system (ATS) designed to streamline the resume evaluation process. It parses candidate profiles, matches them against job descriptions, and organizes the complete recruitment funnel."
    },
    {
      q: "How does the AI resume matching work?",
      a: "The platform reads candidate resumes, extracts professional experience and skill definitions, and calculates a semantic match score against target job requisites."
    },
    {
      q: "Does the AI make final hiring decisions?",
      a: "No. The system is built as a decision-support assistant. It scores and ranks profiles to optimize recruiter search flow, but final shortlisting, interviewing, and hiring decisions remain fully under recruiter control."
    },
    {
      q: "Is candidate privacy protected?",
      a: "Yes. The application handles resume parse data securely, isolates candidate profile records, and ensures recruiters only access information for relevant position screening."
    }
  ];

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div style={{ backgroundColor: "var(--bg)", minHeight: "100vh", overflowX: "hidden" }}>
      
      {/* 1. PUBLIC NAVBAR */}
      <nav
        className="navbar navbar-expand-lg sticky-top border-bottom"
        style={{
          height: "70px",
          backgroundColor: "rgba(15, 23, 42, 0.9)",
          backdropFilter: "blur(12px)",
          borderColor: "rgba(255,255,255,0.08)",
          zIndex: 1100
        }}
      >
        <div className="container d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2" style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
            <FaRobot className="text-primary animate-pulse" size={28} />
            <span className="fw-bold text-white fs-5" style={{ fontFamily: "var(--font-sans)", letterSpacing: "-0.02em" }}>
              Smart ATS
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="d-none d-lg-flex align-items-center gap-4">
            <a href="#features" className="text-light text-decoration-none opacity-75 hover-opacity-100" style={{ fontSize: "0.9rem" }}>Features</a>
            <a href="#workflow" className="text-light text-decoration-none opacity-75 hover-opacity-100" style={{ fontSize: "0.9rem" }}>How It Works</a>
            <a href="#demo" className="text-light text-decoration-none opacity-75 hover-opacity-100" style={{ fontSize: "0.9rem" }}>AI Screening</a>
            <a href="#benefits" className="text-light text-decoration-none opacity-75 hover-opacity-100" style={{ fontSize: "0.9rem" }}>Benefits</a>
            <a href="#faq" className="text-light text-decoration-none opacity-75 hover-opacity-100" style={{ fontSize: "0.9rem" }}>FAQ</a>
          </div>

          <div className="d-none d-lg-flex align-items-center gap-3">
            <Button variant="ghost" className="text-white text-decoration-none" onClick={() => navigate("/login")}>
              Login
            </Button>
            <Button variant="primary" onClick={() => navigate("/register")}>
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Toggler */}
          <button
            type="button"
            className="btn d-lg-none text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div
            className="w-100 position-absolute border-bottom d-lg-none"
            style={{
              top: "70px",
              left: 0,
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              backdropFilter: "blur(12px)",
              borderColor: "rgba(255,255,255,0.08)",
              padding: "20px 24px"
            }}
          >
            <div className="d-flex flex-column gap-3 mb-4">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-light text-decoration-none opacity-75" style={{ fontSize: "1rem" }}>Features</a>
              <a href="#workflow" onClick={() => setMobileMenuOpen(false)} className="text-light text-decoration-none opacity-75" style={{ fontSize: "1rem" }}>How It Works</a>
              <a href="#demo" onClick={() => setMobileMenuOpen(false)} className="text-light text-decoration-none opacity-75" style={{ fontSize: "1rem" }}>AI Screening</a>
              <a href="#benefits" onClick={() => setMobileMenuOpen(false)} className="text-light text-decoration-none opacity-75" style={{ fontSize: "1rem" }}>Benefits</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-light text-decoration-none opacity-75" style={{ fontSize: "1rem" }}>FAQ</a>
            </div>
            <div className="d-flex flex-column gap-2">
              <Button variant="outline" className="w-100 text-white" onClick={() => { setMobileMenuOpen(false); navigate("/login"); }}>
                Login
              </Button>
              <Button variant="primary" className="w-100" onClick={() => { setMobileMenuOpen(false); navigate("/register"); }}>
                Get Started
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* 2. HERO SECTION */}
      <section
        className="py-5"
        style={{
          background: "radial-gradient(circle at 80% 20%, rgba(37, 99, 235, 0.15), transparent 50%), linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
          color: "#fff"
        }}
      >
        <div className="container py-5">
          <div className="row align-items-center g-5">
            <div className="col-lg-6" data-aos="fade-right">
              <div className="badge-custom badge-custom-primary mb-3">AI Recruitment Engine v2.0</div>
              <h1 className="fw-bold display-4 mb-3" style={{ fontFamily: "var(--font-sans)", lineHeight: 1.15 }}>
                Smarter Hiring. <br />
                <span className="text-primary">Powered by Artificial Intelligence.</span>
              </h1>
              <p className="text-light opacity-75 fs-5 mb-4" style={{ lineHeight: 1.6 }}>
                Streamline recruitment, analyze resumes, identify top candidates, and manage the complete hiring process from one intelligent platform.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Button variant="primary" size="lg" className="d-flex align-items-center gap-2" onClick={() => navigate("/register")}>
                  Start Hiring <FaArrowRight size={14} />
                </Button>
                <Button variant="outline" size="lg" className="text-white" style={{ borderColor: "rgba(255,255,255,0.2)" }} onClick={() => navigate("/login")}>
                  Explore Jobs
                </Button>
              </div>
            </div>

            {/* Visual Preview */}
            <div className="col-lg-6" data-aos="fade-left">
              <Card
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "var(--radius-lg)"
                }}
              >
                <CardContent className="p-4 text-white">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-muted-custom text-uppercase fw-semibold" style={{ fontSize: "0.75rem" }}>
                      Recent Resume Parsing Analysis
                    </span>
                    <Badge variant="success">87% AI Match</Badge>
                  </div>
                  <h4 className="fw-bold mb-1">Alex Morgan</h4>
                  <p className="text-muted-custom mb-3" style={{ fontSize: "0.85rem" }}>Senior Software Engineer Requisition</p>
                  
                  <div className="row g-2 mb-3" style={{ fontSize: "0.85rem" }}>
                    <div className="col-6">
                      <div className="p-2 rounded bg-dark bg-opacity-20 border border-secondary border-opacity-10">
                        <span className="text-muted d-block" style={{ fontSize: "0.75rem" }}>Experience score</span>
                        <strong className="text-white">92% Match</strong>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-2 rounded bg-dark bg-opacity-20 border border-secondary border-opacity-10">
                        <span className="text-muted d-block" style={{ fontSize: "0.75rem" }}>Skill alignment</span>
                        <strong className="text-white">89% Match</strong>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <h6 className="fw-semibold text-secondary-custom mb-1" style={{ fontSize: "0.8rem" }}>Identified Skills</h6>
                    <div className="d-flex flex-wrap gap-1">
                      <Badge variant="primary" style={{ fontSize: "0.7rem", padding: "2px 6px" }}>React</Badge>
                      <Badge variant="primary" style={{ fontSize: "0.7rem", padding: "2px 6px" }}>Node.js</Badge>
                      <Badge variant="primary" style={{ fontSize: "0.7rem", padding: "2px 6px" }}>SQL</Badge>
                      <Badge variant="primary" style={{ fontSize: "0.7rem", padding: "2px 6px" }}>REST APIs</Badge>
                    </div>
                  </div>

                  <div className="mb-0 p-3 rounded" style={{ background: "rgba(37,99,235,0.08)", borderLeft: "4px solid var(--primary)" }}>
                    <p className="mb-0 text-white-50" style={{ fontSize: "0.825rem", fontStyle: "italic" }}>
                      "Candidate presents extensive experience in JavaScript frameworks and scalable API microservice pipelines. Match recommendation: Review immediately."
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PLATFORM VALUE SECTION */}
      <section className="py-5" style={{ background: "#0b0f19", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
        <div className="container py-4">
          <div className="text-center mb-5" data-aos="fade-up">
            <h2 className="fw-bold text-white mb-2" style={{ fontFamily: "var(--font-sans)" }}>
              Built to Make Hiring Faster and Smarter
            </h2>
            <p className="text-muted mx-auto" style={{ maxWidth: "600px", fontSize: "0.95rem" }}>
              Our platform coordinates automated evaluation pipelines to help teams bypass scanning fatigue and lock onto talent records.
            </p>
          </div>

          <div className="row g-4 justify-content-center">
            {stats.map((st, i) => (
              <div className="col-6 col-md-3 text-center" key={i} data-aos="zoom-in" data-delay={i * 100}>
                <h2 className="fw-bold text-primary mb-1 display-5">{st.value}</h2>
                <span className="text-light opacity-75 text-uppercase fw-semibold" style={{ fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                  {st.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FEATURES SECTION */}
      <section id="features" className="py-5 text-white" style={{ background: "#0f172a" }}>
        <div className="container py-5">
          <div className="text-center mb-5" data-aos="fade-up">
            <span className="text-primary text-uppercase fw-semibold" style={{ fontSize: "0.75rem", letterSpacing: "0.1em" }}>Core Capabilities</span>
            <h2 className="fw-bold mt-2 display-6" style={{ fontFamily: "var(--font-sans)" }}>
              Everything You Need for Smarter Recruitment
            </h2>
            <p className="text-muted-custom mx-auto mt-2" style={{ maxWidth: "600px", fontSize: "0.95rem" }}>
              A suite of resume parsing, scoring systems, and application stages built to optimize your recruitment cycle.
            </p>
          </div>

          <div className="row g-4">
            {features.map((feat, i) => (
              <div className="col-md-4" key={i} data-aos="fade-up" data-delay={i * 100}>
                <Card
                  style={{
                    height: "100%",
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                    transition: "transform var(--transition-normal)"
                  }}
                  className="hover-translate"
                >
                  <CardContent className="p-4 d-flex flex-column gap-3">
                    <div
                      className="d-flex align-items-center justify-content-center rounded"
                      style={{
                        width: "48px",
                        height: "48px",
                        backgroundColor: "var(--primary-light)",
                        color: "var(--primary)",
                        fontSize: "1.25rem"
                      }}
                    >
                      {feat.icon}
                    </div>
                    <div>
                      <h4 className="fw-bold mb-2" style={{ fontSize: "1.15rem", color: "var(--text-primary)" }}>{feat.title}</h4>
                      <p className="text-muted-custom mb-0" style={{ fontSize: "0.9rem", lineHeight: 1.5 }}>
                        {feat.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS SECTION */}
      <section id="workflow" className="py-5" style={{ background: "#0b0f19" }}>
        <div className="container py-5 text-white">
          <div className="text-center mb-5" data-aos="fade-up">
            <span className="text-primary text-uppercase fw-semibold" style={{ fontSize: "0.75rem", letterSpacing: "0.1em" }}>Operational Timeline</span>
            <h2 className="fw-bold mt-2 display-6" style={{ fontFamily: "var(--font-sans)" }}>
              From Job Posting to Hiring
            </h2>
            <p className="text-muted mx-auto mt-2" style={{ maxWidth: "600px", fontSize: "0.95rem" }}>
              Step-by-step coordination of application entries, parsing calculations, and final interviews.
            </p>
          </div>

          <div className="row g-4">
            {steps.map((st, i) => (
              <div className="col-md-3" key={i} data-aos="fade-up" data-delay={i * 100}>
                <div className="p-4 rounded border border-secondary border-opacity-10 bg-dark bg-opacity-30 h-100 d-flex flex-column gap-3">
                  <div className="display-4 fw-bold text-primary opacity-50" style={{ fontFamily: "var(--font-sans)", lineHeight: 1 }}>
                    {st.step}
                  </div>
                  <div>
                    <h5 className="fw-bold text-white mb-2">{st.title}</h5>
                    <p className="text-muted mb-0" style={{ fontSize: "0.875rem", lineHeight: 1.5 }}>{st.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. AI RECRUITMENT INSIGHT SECTION */}
      <section id="demo" className="py-5" style={{ background: "#0f172a", borderTop: "1px solid rgba(255,255,255,0.03)" }}>
        <div className="container py-5 text-white">
          <div className="row align-items-center g-5">
            <div className="col-lg-6" data-aos="fade-right">
              <span className="text-primary text-uppercase fw-semibold" style={{ fontSize: "0.75rem", letterSpacing: "0.1em" }}>Decision Support Systems</span>
              <h2 className="fw-bold mt-2 display-6" style={{ fontFamily: "var(--font-sans)" }}>
                Make Better Decisions with Structured AI Insights
              </h2>
              <p className="text-muted mt-3" style={{ fontSize: "0.95rem", lineHeight: 1.6 }}>
                The algorithm automatically analyzes resume files to identify relevant experience and skill configurations.
              </p>
              <div className="my-4 p-3 rounded" style={{ background: "rgba(239,68,68,0.05)", borderLeft: "4px solid var(--error)" }}>
                <strong className="text-danger d-block mb-1" style={{ fontSize: "0.85rem" }}>Important Disclaimer</strong>
                <p className="mb-0 text-white-50" style={{ fontSize: "0.825rem" }}>
                  AI insights support recruiters and hiring teams. Final hiring decisions and candidates evaluations remain under human control.
                </p>
              </div>
            </div>

            {/* Demonstration Card */}
            <div className="col-lg-6" data-aos="fade-left">
              <Card style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <CardContent className="p-4">
                  <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
                    <div className="d-flex align-items-center gap-3">
                      <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 text-primary" style={{ width: "40px", height: "40px" }}>
                        <FaRobot />
                      </div>
                      <div>
                        <h5 className="fw-bold text-white mb-0">Alex Morgan</h5>
                        <small className="text-muted">Senior Software Engineer Requisition</small>
                      </div>
                    </div>
                    <Badge variant="success">87% Match</Badge>
                  </div>

                  <div className="d-flex flex-column gap-3" style={{ fontSize: "0.875rem" }}>
                    <div>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted">Skills match</span>
                        <strong className="text-white">92%</strong>
                      </div>
                      <div className="progress" style={{ height: "6px", background: "var(--border)" }}>
                        <div className="progress-bar bg-success" style={{ width: "92%" }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted">Experience score</span>
                        <strong className="text-white">84%</strong>
                      </div>
                      <div className="progress" style={{ height: "6px", background: "var(--border)" }}>
                        <div className="progress-bar bg-success" style={{ width: "84%" }}></div>
                      </div>
                    </div>

                    <div>
                      <h6 className="fw-semibold text-secondary-custom mb-1">Matched Professional Skills</h6>
                      <div className="d-flex flex-wrap gap-1 mt-1">
                        <span className="badge bg-secondary text-white-50">Python</span>
                        <span className="badge bg-secondary text-white-50">React</span>
                        <span className="badge bg-secondary text-white-50">REST APIs</span>
                        <span className="badge bg-secondary text-white-50">PostgreSQL</span>
                      </div>
                    </div>

                    <div>
                      <h6 className="fw-semibold text-danger mb-1">Missing Skill tags</h6>
                      <div className="d-flex flex-wrap gap-1 mt-1">
                        <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-20">AWS</span>
                      </div>
                    </div>

                    <div className="p-3 bg-dark bg-opacity-30 rounded border border-secondary border-opacity-10">
                      <strong className="text-white d-block mb-1" style={{ fontSize: "0.8rem" }}>AI Summary Recommendation</strong>
                      <p className="mb-0 text-muted" style={{ fontSize: "0.775rem", fontStyle: "italic" }}>
                        Strong technical candidate with solid software development records. Recommend for immediate recruiter phone screening.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* 7. RECRUITER & CANDIDATE BENEFITS */}
      <section id="benefits" className="py-5" style={{ background: "#0b0f19" }}>
        <div className="container py-5 text-white">
          <div className="row g-5">
            {roles.map((rl, idx) => (
              <div className="col-lg-6" key={idx} data-aos="fade-up" data-delay={idx * 100}>
                <div className="p-4 p-md-5 rounded h-100 d-flex flex-column gap-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <h3 className="fw-bold text-white mb-2" style={{ fontFamily: "var(--font-sans)" }}>{rl.title}</h3>
                  <p className="text-muted" style={{ fontSize: "0.95rem", lineHeight: 1.6 }}>{rl.desc}</p>
                  
                  <ul className="d-flex flex-column gap-2 my-2 ps-0 list-unstyled" style={{ fontSize: "0.9rem" }}>
                    {rl.bullets.map((b, i) => (
                      <li key={i} className="d-flex align-items-center gap-2">
                        <FaCheckCircle className="text-success" size={14} />
                        <span className="text-light opacity-75">{b}</span>
                      </li>
                    ))}
                  </ul>

                  <Button variant={idx === 0 ? "primary" : "outline"} className={idx === 0 ? "w-100 mt-auto" : "w-100 mt-auto text-white"} onClick={() => navigate(rl.link)}>
                    {rl.cta}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. DESIGNED FOR EVERY ROLE SECTION */}
      <section className="py-5" style={{ background: "#0f172a" }}>
        <div className="container py-5 text-white">
          <div className="text-center mb-5" data-aos="fade-up">
            <span className="text-primary text-uppercase fw-semibold" style={{ fontSize: "0.75rem", letterSpacing: "0.1em" }}>Target Users</span>
            <h2 className="fw-bold mt-2 display-6" style={{ fontFamily: "var(--font-sans)" }}>
              Designed for Every Hiring Role
            </h2>
          </div>

          <div className="row g-4 justify-content-center">
            <div className="col-md-4">
              <div className="p-4 rounded h-100 bg-dark bg-opacity-20 border border-secondary border-opacity-10 text-center">
                <FaUsers size={40} className="text-primary mb-3" />
                <h5 className="fw-bold">HR Teams</h5>
                <p className="text-muted mb-0 mt-2" style={{ fontSize: "0.875rem" }}>
                  Manage multiple open postings and track resumes across diverse hiring teams efficiently.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="p-4 rounded h-100 bg-dark bg-opacity-20 border border-secondary border-opacity-10 text-center">
                <FaRobot size={40} className="text-primary mb-3" />
                <h5 className="fw-bold">Hiring Managers</h5>
                <p className="text-muted mb-0 mt-2" style={{ fontSize: "0.875rem" }}>
                  Quickly review top candidates using computed matching details without reading endless logs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FAQ ACCORDION SECTION */}
      <section id="faq" className="py-5" style={{ background: "#0b0f19" }}>
        <div className="container py-5 text-white">
          <div className="text-center mb-5" data-aos="fade-up">
            <FaRegQuestionCircle className="text-primary mb-2" size={32} />
            <h2 className="fw-bold display-6" style={{ fontFamily: "var(--font-sans)" }}>
              Frequently Asked Questions
            </h2>
          </div>

          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="d-flex flex-column gap-3">
                {faqs.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="rounded border border-secondary border-opacity-10"
                      style={{ background: "rgba(255,255,255,0.02)", overflow: "hidden" }}
                      data-aos="fade-up"
                    >
                      <button
                        type="button"
                        className="w-100 d-flex justify-content-between align-items-center p-4 text-start text-white border-0 bg-transparent"
                        onClick={() => toggleFaq(idx)}
                        aria-expanded={isOpen}
                      >
                        <span className="fw-semibold text-light">{faq.q}</span>
                        <FaChevronDown
                          size={14}
                          className="transition-all"
                          style={{
                            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                            color: "var(--primary)"
                          }}
                        />
                      </button>
                      
                      {isOpen && (
                        <div className="px-4 pb-4 border-top border-secondary border-opacity-5">
                          <p className="text-muted mb-0 mt-3" style={{ fontSize: "0.925rem", lineHeight: 1.6 }}>
                            {faq.a}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. FINAL CTA SECTION */}
      <section className="py-5" style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderTop: "1px solid rgba(255,255,255,0.03)" }}>
        <div className="container py-5 text-center text-white" data-aos="zoom-in">
          <h2 className="fw-bold display-5 mb-3" style={{ fontFamily: "var(--font-sans)" }}>
            Ready to Build a Smarter Hiring Process?
          </h2>
          <p className="text-light opacity-75 mx-auto mb-4" style={{ maxWidth: "600px", fontSize: "1.1rem" }}>
            Post open roles, screen resume packages, and organize your candidate tracking workflows from one central workspace.
          </p>
          <div className="d-flex justify-content-center gap-3">
            <Button variant="primary" size="lg" onClick={() => navigate("/register")}>
              Get Started Now
            </Button>
            <Button variant="outline" size="lg" className="text-white" style={{ borderColor: "rgba(255,255,255,0.2)" }} onClick={() => navigate("/login")}>
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* 11. PUBLIC FOOTER */}
      <footer className="py-5 text-white" style={{ background: "#070a13", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="container">
          <div className="row g-4 mb-4">
            <div className="col-md-6 col-lg-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <FaRobot className="text-primary" size={24} />
                <span className="fw-bold text-white fs-5" style={{ fontFamily: "var(--font-sans)" }}>
                  Smart ATS
                </span>
              </div>
              <p className="text-muted" style={{ fontSize: "0.85rem", lineHeight: 1.6 }}>
                AI-powered recruitment suite designed to automate screening, match candidate profiles, and organize applicant processes.
              </p>
            </div>
            
            <div className="col-6 col-md-3 col-lg-2">
              <h6 className="fw-bold text-white text-uppercase mb-3" style={{ fontSize: "0.8rem", letterSpacing: "0.05em" }}>Product</h6>
              <ul className="list-unstyled d-flex flex-column gap-2" style={{ fontSize: "0.85rem" }}>
                <li><a href="#features" className="text-muted text-decoration-none hover-text-white">Features</a></li>
                <li><a href="#workflow" className="text-muted text-decoration-none hover-text-white">How It Works</a></li>
                <li><a href="#demo" className="text-muted text-decoration-none hover-text-white">AI Screening</a></li>
              </ul>
            </div>

            <div className="col-6 col-md-3 col-lg-2">
              <h6 className="fw-bold text-white text-uppercase mb-3" style={{ fontSize: "0.8rem", letterSpacing: "0.05em" }}>Platform</h6>
              <ul className="list-unstyled d-flex flex-column gap-2" style={{ fontSize: "0.85rem" }}>
                <li><span className="text-muted cursor-pointer hover-text-white" onClick={() => navigate("/login")}>Login</span></li>
                <li><span className="text-muted cursor-pointer hover-text-white" onClick={() => navigate("/register")}>Register</span></li>
              </ul>
            </div>
          </div>

          <hr style={{ borderColor: "rgba(255,255,255,0.08)" }} />

          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3 mt-4" style={{ fontSize: "0.8rem" }}>
            <span className="text-muted">&copy; {new Date().getFullYear()} Smart ATS Recruitment Platform. All rights reserved.</span>
            <div className="d-flex gap-4">
              <span className="text-muted hover-text-white cursor-pointer">Privacy Policy</span>
              <span className="text-muted hover-text-white cursor-pointer">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default Home;
