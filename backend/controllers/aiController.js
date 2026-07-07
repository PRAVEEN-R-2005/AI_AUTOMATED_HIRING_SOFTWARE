const db = require("../config/db");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const natural = require("natural");

// Static lists of technical skills for extracting additional candidate skills
const COMMON_TECH_SKILLS = [
  "python", "javascript", "java", "c++", "c#", "php", "ruby", "go", "rust", "typescript",
  "html", "css", "react", "angular", "vue", "node.js", "express", "django", "flask",
  "spring", "asp.net", "laravel", "sql", "nosql", "mongodb", "postgresql", "mysql",
  "sqlite", "redis", "elasticsearch", "aws", "azure", "gcp", "docker", "kubernetes",
  "git", "github", "jenkins", "terraform", "ansible", "graphql", "rest api", "linux"
];

// Helper parser to compute matches
const analyzeResumeAgainstJD = async (resumePath, jd) => {
  // 1. Read PDF
  const dataBuffer = fs.readFileSync(resumePath);
  const parsedPdf = await pdfParse(dataBuffer);
  const resumeText = parsedPdf.text || "";
  const resumeTextLower = resumeText.toLowerCase();

  // 2. JD Text
  const jdText = `${jd.title} ${jd.skills} ${jd.description}`.toLowerCase();

  // ====================
  // 1. SKILLS EXTRACTION
  // ====================
  // Extract required skills from JD
  const jdSkills = (jd.skills || "")
    .split(",")
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);

  const matchedSkills = [];
  const missingSkills = [];

  jdSkills.forEach(skill => {
    // Escape special characters for regex
    const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(resumeTextLower) || resumeTextLower.includes(skill)) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  // Extract additional candidate skills
  const additionalSkills = [];
  COMMON_TECH_SKILLS.forEach(skill => {
    if (!jdSkills.includes(skill) && resumeTextLower.includes(skill)) {
      additionalSkills.push(skill);
    }
  });

  const skillsScore = jdSkills.length > 0 ? Math.round((matchedSkills.length / jdSkills.length) * 100) : 100;

  // ====================
  // 2. EXPERIENCE ANALYSIS
  // ====================
  // Parse JD target min experience
  const jdExpMatch = (jd.experience || "").match(/(\d+)/);
  const targetExp = jdExpMatch ? parseInt(jdExpMatch[1], 10) : 0;

  // Parse candidate experience from resume
  // Search for patterns like: "5 years", "3+ years", "10 years of experience"
  const resumeExpMatches = [...resumeTextLower.matchAll(/(\d+)\+?\s*(?:years? of experience|yrs? of exp|years? in|years? exp)/gi)];
  let candidateYears = 0;
  if (resumeExpMatches.length > 0) {
    const years = resumeExpMatches.map(m => parseInt(m[1], 10)).filter(y => y <= 30); // ignore dates
    if (years.length > 0) {
      candidateYears = Math.max(...years);
    }
  } else {
    // Secondary check: look for any number of years
    const secondaryMatches = [...resumeTextLower.matchAll(/(\d+)\+?\s*years?/gi)];
    if (secondaryMatches.length > 0) {
      const years = secondaryMatches.map(m => parseInt(m[1], 10)).filter(y => y <= 30);
      if (years.length > 0) {
        candidateYears = Math.max(...years);
      }
    }
  }

  // Fallback default
  if (candidateYears === 0) candidateYears = 2; // Baseline assumption

  let experienceScore = 100;
  if (targetExp > 0) {
    experienceScore = Math.min(Math.round((candidateYears / targetExp) * 100), 100);
  }

  // ====================
  // 3. EDUCATION ANALYSIS
  // ====================
  // Job requirements education
  const jdHasMaster = /master|m\.s\.|m\.tech/i.test(jdText);
  const jdHasPhD = /phd|doctorate/i.test(jdText);

  // Candidate education
  const resumeHasPhD = /phd|doctorate/i.test(resumeTextLower);
  const resumeHasMaster = /master|m\.s\.|m\.tech/i.test(resumeTextLower);
  const resumeHasBachelor = /bachelor|b\.s\.|b\.tech|degree|graduate/i.test(resumeTextLower);

  let educationScore = 80; // Baseline default
  if (jdHasPhD) {
    if (resumeHasPhD) educationScore = 100;
    else if (resumeHasMaster) educationScore = 70;
    else educationScore = 40;
  } else if (jdHasMaster) {
    if (resumeHasPhD || resumeHasMaster) educationScore = 100;
    else if (resumeHasBachelor) educationScore = 75;
    else educationScore = 50;
  } else {
    // General Bachelor/Degree requirement
    if (resumeHasPhD || resumeHasMaster || resumeHasBachelor) educationScore = 100;
    else educationScore = 70;
  }

  // ====================
  // 4. OVERALL SCORE CALCULATION
  // ====================
  // Weights: Skills 50%, Experience 35%, Education 15%
  const overallScore = Math.round(skillsScore * 0.5 + experienceScore * 0.35 + educationScore * 0.15);

  // ====================
  // 5. CANDIDATE INTELLIGENCE
  // ====================
  const strengths = [];
  if (skillsScore >= 75) strengths.push("Matches a high percentage of required technical skills.");
  if (candidateYears >= targetExp) strengths.push(`Meets or exceeds the required target experience of ${targetExp} years.`);
  if (resumeHasPhD || resumeHasMaster) strengths.push("Possesses advanced academic qualifications (Master's / PhD).");
  if (strengths.length === 0) strengths.push("Has relevant technical skills matching the job description.");

  const considerations = [];
  if (missingSkills.length > 0) {
    considerations.push(`Review missing skill competencies: ${missingSkills.slice(0, 3).join(", ")}`);
  }
  if (candidateYears < targetExp) {
    considerations.push(`Candidate has ${candidateYears} years of experience vs target of ${targetExp} years.`);
  }
  if (!resumeHasPhD && !resumeHasMaster && !resumeHasBachelor) {
    considerations.push("Confirm educational qualifications, degree not explicitly parsed.");
  }
  if (considerations.length === 0) considerations.push("No major gaps identified. Ready for hiring team review.");

  // Recommendation interprepations
  let recommendation = "Review Required";
  if (overallScore >= 75) {
    recommendation = "Strong Match - Recommended for Interview";
  } else if (overallScore >= 50) {
    recommendation = "Potential Match - Additional Review Recommended";
  }

  // AI Assisted Summary
  const formattedMatched = matchedSkills.join(", ") || "none";
  const formattedMissing = missingSkills.join(", ") || "none";
  const aiSummary = `Candidate demonstrates a structured fit score of ${overallScore}% against the job requirements. They present approximately ${candidateYears} years of experience compared to the targeted requisitions. Matched skills include: ${formattedMatched}. Missing skills to clarify: ${formattedMissing}. We recommend moving forward with human-guided review.`;

  return {
    overallScore,
    skillsScore,
    experienceScore,
    educationScore,
    matchedSkills: matchedSkills.join(", "),
    missingSkills: missingSkills.join(", "),
    additionalSkills: additionalSkills.join(", "),
    strengths: strengths.join(" | "),
    considerations: considerations.join(" | "),
    aiSummary,
    recommendation
  };
};

// =====================================
// RUN AI ENGINE FOR EXISTING APPLICATION
// =====================================
const runAI = async (req, res) => {
  try {
    const id = req.params.id; // application ID

    db.query(
      "SELECT * FROM applications WHERE id = ?",
      [id],
      async (err, apps) => {
        if (err || !apps || apps.length === 0) {
          console.error("Application not found:", err);
          return res.status(404).json({ message: "Application not found" });
        }

        const app = apps[0];
        const resumeFile = app.resume_file;
        const jobId = app.job_id;

        db.query(
          "SELECT * FROM job_descriptions WHERE jd_id = ?",
          [jobId],
          async (err, jds) => {
            if (err || !jds || jds.length === 0) {
              return res.status(404).json({ message: "Job description not found" });
            }

            const jd = jds[0];
            const resumePath = path.join(__dirname, "..", "uploads", "resumes", resumeFile);

            if (!fs.existsSync(resumePath)) {
              return res.status(404).json({ message: `Resume file not found on disk: ${resumeFile}` });
            }

            try {
              const analysis = await analyzeResumeAgainstJD(resumePath, jd);

              // Update application record with match insights
              // Shortlist if overall >= 75, reject if <= 40, else keep Pending/Under Review
              let status = app.status;
              if (analysis.overallScore >= 75) status = "Shortlisted";
              else if (analysis.overallScore < 40) status = "Rejected";

              db.query(
                `UPDATE applications 
                 SET match_score=?, status=?, skills_score=?, experience_score=?, education_score=?, 
                     matched_skills=?, missing_skills=?, additional_skills=?, candidate_strengths=?, 
                     review_considerations=?, ai_summary=?, recommendation=? 
                 WHERE id=?`,
                [
                  analysis.overallScore,
                  status,
                  analysis.skillsScore,
                  analysis.experienceScore,
                  analysis.educationScore,
                  analysis.matchedSkills,
                  analysis.missingSkills,
                  analysis.additionalSkills,
                  analysis.strengths,
                  analysis.considerations,
                  analysis.aiSummary,
                  analysis.recommendation,
                  id
                ],
                (err, result) => {
                  if (err) {
                    console.error("Database update failed:", err);
                    return res.status(500).json({ message: "Database Error" });
                  }

                  res.status(200).json({
                    message: "AI Screening complete",
                    ...analysis,
                    status
                  });
                }
              );
            } catch (err) {
              console.error("Screening calculation failed:", err);
              res.status(500).json({ message: "Screening execution failed", error: err.message });
            }
          }
        );
      }
    );
  } catch (error) {
    console.error("AI controller error:", error);
    res.status(500).json({ message: "AI process failed", error: error.message });
  }
};

// =====================================
// UPLOAD NEW RESUME AND RUN AI ENGINE
// =====================================
const uploadAndRunAI = async (req, res) => {
  try {
    const { jobId } = req.body;
    if (!jobId) {
      return res.status(400).json({ message: "Job ID is required" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "Resume file upload is required" });
    }

    const filename = req.file.filename;

    db.query(
      "SELECT * FROM job_descriptions WHERE jd_id = ?",
      [jobId],
      async (err, jds) => {
        if (err || !jds || jds.length === 0) {
          return res.status(404).json({ message: "Job description not found" });
        }

        const jd = jds[0];
        const resumePath = path.join(__dirname, "..", "uploads", "resumes", filename);

        try {
          const analysis = await analyzeResumeAgainstJD(resumePath, jd);

          // Save a Quick Screen record to applications
          let status = "Pending";
          if (analysis.overallScore >= 75) status = "Shortlisted";
          else if (analysis.overallScore < 40) status = "Rejected";

          db.query(
            `INSERT INTO applications 
             (candidate_name, email, phone, job_id, resume_file, status, match_score, skills_score, 
              experience_score, education_score, matched_skills, missing_skills, additional_skills, 
              candidate_strengths, review_considerations, ai_summary, recommendation) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              "Quick Screen Profile",
              "quick.screen@recruitment.com",
              "N/A",
              jobId,
              filename,
              status,
              analysis.overallScore,
              analysis.skillsScore,
              analysis.experienceScore,
              analysis.educationScore,
              analysis.matchedSkills,
              analysis.missingSkills,
              analysis.additionalSkills,
              analysis.strengths,
              analysis.considerations,
              analysis.aiSummary,
              analysis.recommendation
            ],
            (err, result) => {
              if (err) {
                console.error("Failed to insert quick screen application:", err);
                return res.status(500).json({ message: "Database Error" });
              }

              res.status(200).json({
                message: "AI Screening Complete",
                applicationId: result.insertId,
                ...analysis,
                status
              });
            }
          );
        } catch (err) {
          console.error("Calculation failed:", err);
          res.status(500).json({ message: "Calculation execution failed" });
        }
      }
    );
  } catch (error) {
    console.error("Upload screening error:", error);
    res.status(500).json({ message: "Upload screening process failed" });
  }
};

module.exports = {
  runAI,
  uploadAndRunAI
};
