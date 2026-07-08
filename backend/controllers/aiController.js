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

const normalizeAnalysisForPersistence = (analysis, defaultStatus = "Pending") => {
  const overallFit = analysis.overallFit ?? analysis.weightedCompatibility ?? analysis.compatibilityScore ?? analysis.matchPercentage ?? analysis.overallScore ?? null;
  const matchScore = analysis.matchScore ?? analysis.match_score ?? overallFit ?? analysis.overallScore ?? null;
  const recommendation = analysis.recommendation || analysis.recommendationText || "Review Required";
  const screeningStatus = analysis.screeningStatus || (matchScore !== null ? "Completed" : defaultStatus);

  return {
    overallFit,
    overallScore: analysis.overallScore ?? overallFit ?? matchScore ?? null,
    matchScore,
    recommendation,
    screeningStatus,
    technicalSkillsFit: analysis.technicalSkillsFit ?? analysis.skillsScore ?? null,
    experienceDurationAlignment: analysis.experienceDurationAlignment ?? analysis.experienceScore ?? null,
    academicQualificationFit: analysis.academicQualificationFit ?? analysis.educationScore ?? null,
    matchedSkills: analysis.matchedSkills ?? analysis.matched_skills ?? "",
    missingSkills: analysis.missingSkills ?? analysis.missing_skills ?? "",
    additionalSkills: analysis.additionalSkills ?? analysis.additional_skills ?? "",
    strengths: analysis.strengths ?? "",
    considerations: analysis.considerations ?? "",
    aiSummary: analysis.aiSummary ?? analysis.ai_summary ?? ""
  };
};

// Helper parser to compute matches
const analyzeResumeAgainstJD = async (resumePath, jd) => {
  console.log(`[AI Screening] Starting resume analysis for path: ${resumePath}`);

  // STAGE 1: Read PDF Buffer & parse text
  let resumeText = "";
  try {
    const ext = path.extname(resumePath).toLowerCase();
    if (ext !== ".pdf") {
      throw new Error(`Unsupported file type (${ext}). Only PDF files are supported for automated AI screening.`);
    }
    const dataBuffer = fs.readFileSync(resumePath);
    const parser = new pdfParse.PDFParse({ data: dataBuffer });
    const parsedPdf = await parser.getText();
    resumeText = parsedPdf.text || "";
    await parser.destroy();
    console.log("[AI Screening] Stage 1 (PDF Parsing) successful.");
  } catch (parseErr) {
    console.error("[AI Screening] Stage 1 (PDF Parsing) failed:", parseErr);
    throw new Error(parseErr.message.includes("Unsupported file type")
      ? parseErr.message
      : "Could not parse PDF file. The file may be corrupted, password-protected, or scanned as a flat image.");
  }

  // STAGE 2: Normalization
  let resumeTextLower = "";
  let jdText = "";
  try {
    if (!resumeText || !resumeText.trim()) {
      throw new Error("Parsed text is empty. PDF does not contain extractable text (it might be a scanned image or empty document).");
    }
    resumeTextLower = resumeText.toLowerCase();
    jdText = `${jd.title || ""} ${jd.skills || ""} ${jd.description || ""}`.toLowerCase();
    console.log("[AI Screening] Stage 2 (Text Normalization) successful.");
  } catch (normErr) {
    console.error("[AI Screening] Stage 2 (Text Normalization) failed:", normErr);
    throw normErr;
  }

  // STAGE 3: Skills & Experience Compatibility Match
  let skillsScore, experienceScore, educationScore, overallScore;
  let matchedSkills, missingSkills, additionalSkills;
  let candidateYears, targetExp;
  try {
    // Skills
    const jdSkills = (jd.skills || "")
      .split(",")
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    matchedSkills = [];
    missingSkills = [];

    jdSkills.forEach(skill => {
      const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(resumeTextLower) || resumeTextLower.includes(skill)) {
        matchedSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    });

    additionalSkills = [];
    COMMON_TECH_SKILLS.forEach(skill => {
      if (!jdSkills.includes(skill) && resumeTextLower.includes(skill)) {
        additionalSkills.push(skill);
      }
    });

    skillsScore = jdSkills.length > 0 ? Math.round((matchedSkills.length / jdSkills.length) * 100) : 100;

    // Experience
    const jdExpMatch = (jd.experience || "").match(/(\d+)/);
    targetExp = jdExpMatch ? parseInt(jdExpMatch[1], 10) : 0;

    const resumeExpMatches = [...resumeTextLower.matchAll(/(\d+)\+?\s*(?:years? of experience|yrs? of exp|years? in|years? exp)/gi)];
    candidateYears = 0;
    if (resumeExpMatches.length > 0) {
      const years = resumeExpMatches.map(m => parseInt(m[1], 10)).filter(y => y <= 30);
      if (years.length > 0) {
        candidateYears = Math.max(...years);
      }
    } else {
      const secondaryMatches = [...resumeTextLower.matchAll(/(\d+)\+?\s*years?/gi)];
      if (secondaryMatches.length > 0) {
        const years = secondaryMatches.map(m => parseInt(m[1], 10)).filter(y => y <= 30);
        if (years.length > 0) {
          candidateYears = Math.max(...years);
        }
      }
    }

    if (candidateYears === 0) candidateYears = 2;

    experienceScore = 100;
    if (targetExp > 0) {
      experienceScore = Math.min(Math.round((candidateYears / targetExp) * 100), 100);
    }

    // Education
    const jdHasMaster = /master|m\.s\.|m\.tech/i.test(jdText);
    const jdHasPhD = /phd|doctorate/i.test(jdText);

    const resumeHasPhD = /phd|doctorate/i.test(resumeTextLower);
    const resumeHasMaster = /master|m\.s\.|m\.tech/i.test(resumeTextLower);
    const resumeHasBachelor = /bachelor|b\.s\.|b\.tech|degree|graduate/i.test(resumeTextLower);

    educationScore = 80;
    if (jdHasPhD) {
      if (resumeHasPhD) educationScore = 100;
      else if (resumeHasMaster) educationScore = 70;
      else educationScore = 40;
    } else if (jdHasMaster) {
      if (resumeHasPhD || resumeHasMaster) educationScore = 100;
      else if (resumeHasBachelor) educationScore = 75;
      else educationScore = 50;
    } else {
      if (resumeHasPhD || resumeHasMaster || resumeHasBachelor) educationScore = 100;
      else educationScore = 70;
    }

    overallScore = Math.round(skillsScore * 0.5 + experienceScore * 0.35 + educationScore * 0.15);
    console.log("[AI Screening] Stage 3 (Compatibility Match) successful.");
  } catch (compErr) {
    console.error("[AI Screening] Stage 3 (Compatibility Match) failed:", compErr);
    throw compErr;
  }

  // STAGE 4: Compiling Strengths & Recommendations
  try {
    const strengths = [];
    if (skillsScore >= 75) strengths.push("Matches a high percentage of required technical skills.");
    if (candidateYears >= targetExp) strengths.push(`Meets or exceeds the required target experience of ${targetExp} years.`);
    const resumeHasPhD = /phd|doctorate/i.test(resumeTextLower);
    const resumeHasMaster = /master|m\.s\.|m\.tech/i.test(resumeTextLower);
    const resumeHasBachelor = /bachelor|b\.s\.|b\.tech|degree|graduate/i.test(resumeTextLower);
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

    let recommendation = "Review Required";
    if (overallScore >= 75) {
      recommendation = "Strong Match - Recommended for Interview";
    } else if (overallScore >= 50) {
      recommendation = "Potential Match - Additional Review Recommended";
    }

    const formattedMatched = matchedSkills.join(", ") || "none";
    const formattedMissing = missingSkills.join(", ") || "none";
    const aiSummary = `Candidate demonstrates a structured fit score of ${overallScore}% against the job requirements. They present approximately ${candidateYears} years of experience compared to the targeted requisitions. Matched skills include: ${formattedMatched}. Missing skills to clarify: ${formattedMissing}. We recommend moving forward with human-guided review.`;

    console.log("[AI Screening] Stage 4 (Strengths & Recommendations Compile) successful.");

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
  } catch (recErr) {
    console.error("[AI Screening] Stage 4 (Strengths & Recommendations Compile) failed:", recErr);
    throw recErr;
  }
};

// =====================================
// RUN AI ENGINE FOR EXISTING APPLICATION
// =====================================
const runAI = async (req, res) => {
  const reqId = req.headers["x-request-id"] || Math.random().toString(36).substring(7);
  const timestamp = new Date().toISOString();
  try {
    const id = req.params.id; // application ID

    db.query(
      "SELECT * FROM applications WHERE id = ?",
      [id],
      async (err, apps) => {
        if (err || !apps || apps.length === 0) {
          console.error(`[AI Screening Failure] [ID: ${reqId}] [Time: ${timestamp}] Application ID ${id} not found in database:`, err);
          return res.status(404).json({ success: false, message: "Candidate or application not found" });
        }

        const app = apps[0];
        const resumeFile = app.resume_file;
        const jobId = app.job_id;

        if (!resumeFile) {
          console.error(`[AI Screening Failure] [ID: ${reqId}] [Time: ${timestamp}] Application ID ${id} has no resume file on record.`);
          return res.status(400).json({ success: false, message: "Candidate application record does not contain an uploaded resume file." });
        }

        db.query(
          "SELECT * FROM job_descriptions WHERE jd_id = ?",
          [jobId],
          async (err, jds) => {
            if (err || !jds || jds.length === 0) {
              console.error(`[AI Screening Failure] [ID: ${reqId}] [Time: ${timestamp}] Job Requisition ID ${jobId} not found.`);
              return res.status(404).json({ success: false, message: "Associated job description not found." });
            }

            const jd = jds[0];
            const resumePath = path.join(__dirname, "..", "uploads", "resumes", resumeFile);

            if (!fs.existsSync(resumePath)) {
              console.error(`[AI Screening Failure] [ID: ${reqId}] [Time: ${timestamp}] Resume file not found on disk at: ${resumePath}`);
              return res.status(404).json({ success: false, message: "Resume document file was not found on the storage server." });
            }

            try {
              const analysis = await analyzeResumeAgainstJD(resumePath, jd);
              const normalizedAnalysis = normalizeAnalysisForPersistence(analysis, "Pending");

              let status = app.status;
              if (["Pending", "Screening"].includes(app.status)) {
                status = normalizedAnalysis.overallScore >= 75 ? "Shortlisted" : normalizedAnalysis.overallScore < 40 ? "Rejected" : "Screening";
              }

              db.query(
                `UPDATE applications 
                 SET match_score=?, status=?, screening_status=?, skills_score=?, experience_score=?, education_score=?, 
                     matched_skills=?, missing_skills=?, additional_skills=?, candidate_strengths=?, 
                     review_considerations=?, ai_summary=?, recommendation=? 
                 WHERE id=?`,
                [
                  normalizedAnalysis.matchScore,
                  status,
                  normalizedAnalysis.screeningStatus,
                  normalizedAnalysis.technicalSkillsFit,
                  normalizedAnalysis.experienceDurationAlignment,
                  normalizedAnalysis.academicQualificationFit,
                  normalizedAnalysis.matchedSkills,
                  normalizedAnalysis.missingSkills,
                  normalizedAnalysis.additionalSkills,
                  normalizedAnalysis.strengths,
                  normalizedAnalysis.considerations,
                  normalizedAnalysis.aiSummary,
                  normalizedAnalysis.recommendation,
                  id
                ],
                (err, result) => {
                  if (err) {
                    console.error(`[AI Screening Failure] [ID: ${reqId}] [Time: ${timestamp}] Database update failed:`, err);
                    return res.status(500).json({ message: "Failed to persist screening insights in database." });
                  }

                  res.status(200).json({
                    message: "AI Screening complete",
                    applicationId: Number(id),
                    ...normalizedAnalysis,
                    status,
                    screeningStatus: normalizedAnalysis.screeningStatus
                  });
                }
              );
            } catch (err) {
              console.error(`[AI Screening Failure] [ID: ${reqId}] [Time: ${timestamp}] Screening calculation failed:`, err);
              res.status(500).json({ message: err.message || "Screening execution failed." });
            }
          }
        );
      }
    );
  } catch (error) {
    console.error(`[AI Screening Failure] [ID: ${reqId}] [Time: ${timestamp}] Outer controller crash:`, error);
    res.status(500).json({ message: error.message || "AI process failed." });
  }
};

// =====================================
// UPLOAD NEW RESUME AND RUN AI ENGINE
// =====================================
const uploadAndRunAI = async (req, res) => {
  const reqId = req.headers["x-request-id"] || Math.random().toString(36).substring(7);
  const timestamp = new Date().toISOString();
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
          console.error(`[AI Screening Failure] [ID: ${reqId}] [Time: ${timestamp}] Job Requisition ID ${jobId} not found.`);
          return res.status(404).json({ message: "Job description not found" });
        }

        const jd = jds[0];
        const resumePath = path.join(__dirname, "..", "uploads", "resumes", filename);

        try {
          const analysis = await analyzeResumeAgainstJD(resumePath, jd);
          const normalizedAnalysis = normalizeAnalysisForPersistence(analysis, "Pending");

          // Save a Quick Screen record to applications
          let status = "Pending";
          if (normalizedAnalysis.overallScore >= 75) status = "Shortlisted";
          else if (normalizedAnalysis.overallScore < 40) status = "Rejected";

          db.query(
            `INSERT INTO applications 
             (candidate_name, email, phone, job_id, resume_file, status, screening_status, match_score, skills_score, 
              experience_score, education_score, matched_skills, missing_skills, additional_skills, 
              candidate_strengths, review_considerations, ai_summary, recommendation) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              "Quick Screen Profile",
              "quick.screen@recruitment.com",
              "N/A",
              jobId,
              filename,
              status,
              normalizedAnalysis.screeningStatus,
              normalizedAnalysis.matchScore,
              normalizedAnalysis.technicalSkillsFit,
              normalizedAnalysis.experienceDurationAlignment,
              normalizedAnalysis.academicQualificationFit,
              normalizedAnalysis.matchedSkills,
              normalizedAnalysis.missingSkills,
              normalizedAnalysis.additionalSkills,
              normalizedAnalysis.strengths,
              normalizedAnalysis.considerations,
              normalizedAnalysis.aiSummary,
              normalizedAnalysis.recommendation
            ],
            (err, result) => {
              if (err) {
                console.error(`[AI Screening Failure] [ID: ${reqId}] [Time: ${timestamp}] Quick screen DB insert failed:`, err);
                return res.status(500).json({ message: "Failed to create quick screen applicant record." });
              }

              res.status(200).json({
                message: "AI Screening Complete",
                applicationId: result.insertId,
                ...normalizedAnalysis,
                status,
                screeningStatus: normalizedAnalysis.screeningStatus
              });
            }
          );
        } catch (err) {
          console.error(`[AI Screening Failure] [ID: ${reqId}] [Time: ${timestamp}] Upload screening calculation failed:`, err);
          res.status(500).json({ message: err.message || "Upload screening calculation failed." });
        }
      }
    );
  } catch (error) {
    console.error(`[AI Screening Failure] [ID: ${reqId}] [Time: ${timestamp}] Upload controller crash:`, error);
    res.status(500).json({ message: error.message || "Upload screening process failed." });
  }
};

module.exports = {
  normalizeAnalysisForPersistence,
  runAI,
  uploadAndRunAI
};
