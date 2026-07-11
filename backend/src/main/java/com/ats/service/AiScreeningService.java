package com.ats.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AiScreeningService {

    private static final List<String> COMMON_TECH_SKILLS = Arrays.asList(
            "python", "javascript", "java", "c++", "c#", "php", "ruby", "go", "rust", "typescript",
            "html", "css", "react", "angular", "vue", "node.js", "express", "django", "flask",
            "spring", "asp.net", "laravel", "sql", "nosql", "mongodb", "postgresql", "mysql",
            "sqlite", "redis", "elasticsearch", "aws", "azure", "gcp", "docker", "kubernetes",
            "git", "github", "jenkins", "terraform", "ansible", "graphql", "rest api", "linux"
    );

    public static class ScreeningResult {
        public int overallScore;
        public int skillsScore;
        public int experienceScore;
        public int educationScore;
        public String matchedSkills;
        public String missingSkills;
        public String additionalSkills;
        public String strengths;
        public String considerations;
        public String aiSummary;
        public String recommendation;
    }

    public ScreeningResult analyzeResumeAgainstJD(String resumePath, String jdTitle, String jdSkillsRaw, String jdDescription) throws Exception {
        System.out.println("[AI Screening] Starting resume analysis for path: " + resumePath);

        // STAGE 1: Read PDF Buffer & parse text
        String resumeText = "";
        File file = new File(resumePath);
        if (!file.exists()) {
            throw new Exception("Resume document file was not found on the storage server.");
        }
        if (!resumePath.toLowerCase().endsWith(".pdf")) {
            throw new Exception("Unsupported file type. Only PDF files are supported for automated AI screening.");
        }

        try (PDDocument document = Loader.loadPDF(file)) {
            PDFTextStripper pdfStripper = new PDFTextStripper();
            resumeText = pdfStripper.getText(document);
        } catch (Exception e) {
            throw new Exception("Could not parse PDF file. The file may be corrupted, password-protected, or scanned as a flat image.");
        }

        if (resumeText == null || resumeText.trim().isEmpty()) {
            throw new Exception("Parsed text is empty. PDF does not contain extractable text (it might be a scanned image or empty document).");
        }

        // STAGE 2: Normalization
        String resumeTextLower = resumeText.toLowerCase();
        String jdText = (jdTitle + " " + jdSkillsRaw + " " + jdDescription).toLowerCase();

        // STAGE 3: Skills & Experience Compatibility Match
        List<String> matchedSkills = new ArrayList<>();
        List<String> missingSkills = new ArrayList<>();
        
        String[] jdSkills = jdSkillsRaw != null ? jdSkillsRaw.split(",") : new String[0];
        int jdSkillsCount = 0;

        for (String skill : jdSkills) {
            String trimmed = skill.trim().toLowerCase();
            if (trimmed.isEmpty()) continue;
            jdSkillsCount++;
            String escaped = Pattern.quote(trimmed);
            Pattern p = Pattern.compile("\\b" + escaped + "\\b", Pattern.CASE_INSENSITIVE);
            if (p.matcher(resumeTextLower).find() || resumeTextLower.contains(trimmed)) {
                matchedSkills.add(trimmed);
            } else {
                missingSkills.add(trimmed);
            }
        }

        List<String> additionalSkills = new ArrayList<>();
        for (String skill : COMMON_TECH_SKILLS) {
            boolean isJdSkill = false;
            for (String js : jdSkills) {
                if (js.trim().toLowerCase().equals(skill)) {
                    isJdSkill = true;
                    break;
                }
            }
            if (!isJdSkill && resumeTextLower.contains(skill)) {
                additionalSkills.add(skill);
            }
        }

        int skillsScore = jdSkillsCount > 0 ? (int) Math.round(((double) matchedSkills.size() / jdSkillsCount) * 100) : 100;

        // Experience
        int targetExp = 0;
        Pattern pExp = Pattern.compile("(\\d+)");
        Matcher mExp = pExp.matcher(jdDescription != null ? jdDescription : "");
        if (mExp.find()) {
            targetExp = Integer.parseInt(mExp.group(1));
        }

        Pattern pResumeExp = Pattern.compile("(\\d+)\\+?\\s*(?:years? of experience|yrs? of exp|years? in|years? exp)", Pattern.CASE_INSENSITIVE);
        Matcher mResumeExp = pResumeExp.matcher(resumeTextLower);
        int candidateYears = 0;
        while (mResumeExp.find()) {
            int yrs = Integer.parseInt(mResumeExp.group(1));
            if (yrs <= 30 && yrs > candidateYears) {
                candidateYears = yrs;
            }
        }

        if (candidateYears == 0) {
            Pattern pResumeExpSec = Pattern.compile("(\\d+)\\+?\\s*years?", Pattern.CASE_INSENSITIVE);
            Matcher mResumeExpSec = pResumeExpSec.matcher(resumeTextLower);
            while (mResumeExpSec.find()) {
                int yrs = Integer.parseInt(mResumeExpSec.group(1));
                if (yrs <= 30 && yrs > candidateYears) {
                    candidateYears = yrs;
                }
            }
        }

        if (candidateYears == 0) {
            candidateYears = 2; // fallback default
        }

        int experienceScore = 100;
        if (targetExp > 0) {
            experienceScore = Math.min((int) Math.round(((double) candidateYears / targetExp) * 100), 100);
        }

        // Education
        boolean jdHasMaster = Pattern.compile("master|m\\.s\\.|m\\.tech", Pattern.CASE_INSENSITIVE).matcher(jdText).find();
        boolean jdHasPhD = Pattern.compile("phd|doctorate", Pattern.CASE_INSENSITIVE).matcher(jdText).find();

        boolean resumeHasPhD = Pattern.compile("phd|doctorate", Pattern.CASE_INSENSITIVE).matcher(resumeTextLower).find();
        boolean resumeHasMaster = Pattern.compile("master|m\\.s\\.|m\\.tech", Pattern.CASE_INSENSITIVE).matcher(resumeTextLower).find();
        boolean resumeHasBachelor = Pattern.compile("bachelor|b\\.s\\.|b\\.tech|degree|graduate", Pattern.CASE_INSENSITIVE).matcher(resumeTextLower).find();

        int educationScore = 80;
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

        int overallScore = (int) Math.round(skillsScore * 0.5 + experienceScore * 0.35 + educationScore * 0.15);

        // STAGE 4: Compiling Strengths & Recommendations
        List<String> strengths = new ArrayList<>();
        if (skillsScore >= 75) strengths.add("Matches a high percentage of required technical skills.");
        if (candidateYears >= targetExp) strengths.add("Meets or exceeds the required target experience of " + targetExp + " years.");
        if (resumeHasPhD || resumeHasMaster) strengths.add("Possesses advanced academic qualifications (Master's / PhD).");
        if (strengths.isEmpty()) strengths.add("Has relevant technical skills matching the job description.");

        List<String> considerations = new ArrayList<>();
        if (!missingSkills.isEmpty()) {
            considerations.add("Review missing skill competencies: " + String.join(", ", missingSkills.subList(0, Math.min(3, missingSkills.size()))));
        }
        if (candidateYears < targetExp) {
            considerations.add("Candidate has " + candidateYears + " years of experience vs target of " + targetExp + " years.");
        }
        if (!resumeHasPhD && !resumeHasMaster && !resumeHasBachelor) {
            considerations.add("Confirm educational qualifications, degree not explicitly parsed.");
        }
        if (considerations.isEmpty()) considerations.add("No major gaps identified. Ready for hiring team review.");

        String recommendation = "Review Required";
        if (overallScore >= 75) {
            recommendation = "Strong Match - Recommended for Interview";
        } else if (overallScore >= 50) {
            recommendation = "Potential Match - Additional Review Recommended";
        }

        String formattedMatched = String.join(", ", matchedSkills);
        if (formattedMatched.isEmpty()) formattedMatched = "none";
        String formattedMissing = String.join(", ", missingSkills);
        if (formattedMissing.isEmpty()) formattedMissing = "none";

        String aiSummary = String.format("Candidate demonstrates a structured fit score of %d%% against the job requirements. " +
                "They present approximately %d years of experience compared to the targeted requisitions. " +
                "Matched skills include: %s. Missing skills to clarify: %s. We recommend moving forward with human-guided review.",
                overallScore, candidateYears, formattedMatched, formattedMissing);

        ScreeningResult result = new ScreeningResult();
        result.overallScore = overallScore;
        result.skillsScore = skillsScore;
        result.experienceScore = experienceScore;
        result.educationScore = educationScore;
        result.matchedSkills = String.join(", ", matchedSkills);
        result.missingSkills = String.join(", ", missingSkills);
        result.additionalSkills = String.join(", ", additionalSkills);
        result.strengths = String.join(" | ", strengths);
        result.considerations = String.join(" | ", considerations);
        result.aiSummary = aiSummary;
        result.recommendation = recommendation;

        return result;
    }
}
