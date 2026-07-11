package com.ats.controller;

import com.ats.entity.Application;
import com.ats.entity.JobDescription;
import com.ats.repository.ApplicationRepository;
import com.ats.repository.JobDescriptionRepository;
import com.ats.security.CustomUserDetails;
import com.ats.security.Permissions;
import com.ats.service.AiScreeningService;
import com.ats.service.AiScreeningService.ScreeningResult;
import com.ats.exception.ResourceNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.*;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private JobDescriptionRepository jobDescriptionRepository;

    @Autowired
    private AiScreeningService aiScreeningService;

    private CustomUserDetails getAuthenticatedUser() {
        if (SecurityContextHolder.getContext().getAuthentication() == null) return null;
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof CustomUserDetails) {
            return (CustomUserDetails) principal;
        }
        return null;
    }

    private Map<String, Object> buildScreeningResponse(String message, int appId, String status, ScreeningResult analysis) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("message", message);
        map.put("applicationId", appId);
        map.put("overallFit", analysis.overallScore);
        map.put("overallScore", analysis.overallScore);
        map.put("matchScore", analysis.overallScore);
        map.put("recommendation", analysis.recommendation);
        map.put("screeningStatus", "Completed");
        map.put("technicalSkillsFit", analysis.skillsScore);
        map.put("experienceDurationAlignment", analysis.experienceScore);
        map.put("academicQualificationFit", analysis.educationScore);
        map.put("matchedSkills", analysis.matchedSkills);
        map.put("missingSkills", analysis.missingSkills);
        map.put("additionalSkills", analysis.additionalSkills);
        map.put("strengths", analysis.strengths);
        map.put("considerations", analysis.considerations);
        map.put("aiSummary", analysis.aiSummary);
        map.put("status", status);
        return map;
    }

    private String saveResumeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) return null;
        try {
            String uploadsDir = "uploads/resumes/";
            File dir = new File(uploadsDir);
            if (!dir.exists()) dir.mkdirs();

            String originalName = file.getOriginalFilename();
            String ext = "";
            if (originalName != null && originalName.contains(".")) {
                ext = originalName.substring(originalName.lastIndexOf("."));
            }
            String fileName = UUID.randomUUID().toString() + ext;
            File target = new File(dir, fileName);
            file.transferTo(target);
            return fileName;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    // =====================================
    // RUN AI ENGINE FOR EXISTING APPLICATION
    // =====================================
    @PutMapping("/run/{id}")
    public ResponseEntity<?> runAI(@PathVariable("id") int id, HttpServletRequest request) throws Exception {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        boolean isHR = "HR".equalsIgnoreCase(user.getRole()) || "Admin".equalsIgnoreCase(user.getRole()) || "Recruiter".equalsIgnoreCase(user.getRole());
        boolean isCandidate = "Candidate".equalsIgnoreCase(user.getRole());

        if (!isHR && !isCandidate) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied: Invalid role permissions"));
        }

        Application app = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate or application not found"));

        Integer orgId = app.getOrganizationId();

        if (isCandidate) {
            String appEmail = app.getEmail();
            if (appEmail == null || !appEmail.equalsIgnoreCase(user.getEmail())) {
                throw new AccessDeniedException("Access Denied: You do not own this application.");
            }
        } else {
            if (orgId != null && !orgId.equals(user.getOrganizationId())) {
                throw new AccessDeniedException("Access Denied: Cross-organization access blocked.");
            }
        }

        String resumeFile = app.getResumeFile();
        if (app.getJobDescription() == null) {
            throw new ResourceNotFoundException("Associated job description not found.");
        }
        int jobId = app.getJobDescription().getJdId();

        if (resumeFile == null || resumeFile.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "message", "Candidate application record does not contain an uploaded resume file."));
        }

        JobDescription jd = jobDescriptionRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Associated job description not found."));

        if (!isCandidate && jd.getOrganizationId() != null && !jd.getOrganizationId().equals(user.getOrganizationId())) {
            throw new AccessDeniedException("Access Denied: Cross-organization access blocked.");
        }

        String resumePath = "uploads/resumes/" + resumeFile;

        ScreeningResult analysis = aiScreeningService.analyzeResumeAgainstJD(
                resumePath,
                jd.getTitle(),
                jd.getSkills(),
                jd.getDescription()
        );

        String currentStatus = app.getStatus();
        String newStatus = currentStatus;
        if ("Pending".equalsIgnoreCase(currentStatus) || "Screening".equalsIgnoreCase(currentStatus)) {
            newStatus = analysis.overallScore >= 75 ? "Shortlisted" : analysis.overallScore < 40 ? "Rejected" : "Screening";
        }

        app.setMatchScore(analysis.overallScore);
        app.setStatus(newStatus);
        app.setScreeningStatus("Completed");
        app.setSkillsScore(analysis.skillsScore);
        app.setExperienceScore(analysis.experienceScore);
        app.setEducationScore(analysis.educationScore);
        app.setMatchedSkills(analysis.matchedSkills);
        app.setMissingSkills(analysis.missingSkills);
        app.setAdditionalSkills(analysis.additionalSkills);
        app.setCandidateStrengths(analysis.strengths);
        app.setReviewConsiderations(analysis.considerations);
        app.setAiSummary(analysis.aiSummary);
        app.setRecommendation(analysis.recommendation);

        applicationRepository.save(app);

        return ResponseEntity.ok(buildScreeningResponse("AI Screening complete", id, newStatus, analysis));
    }

    // =====================================
    // UPLOAD NEW RESUME AND RUN AI ENGINE
    // =====================================
    @PostMapping(value = "/upload-run", consumes = "multipart/form-data")
    public ResponseEntity<?> uploadAndRunAI(
            @RequestParam("jobId") int jobId,
            @RequestParam("resume_file") MultipartFile resumeFile,
            HttpServletRequest request
    ) throws Exception {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.AI_ANALYSIS_RUN)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        if (resumeFile == null || resumeFile.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Resume file upload is required"));
        }

        JobDescription jd = jobDescriptionRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job description not found"));

        if (jd.getOrganizationId() != null && !jd.getOrganizationId().equals(user.getOrganizationId())) {
            throw new AccessDeniedException("Access Denied: Cross-organization access blocked.");
        }

        String filename = saveResumeFile(resumeFile);
        if (filename == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Failed to save resume file."));
        }

        String resumePath = "uploads/resumes/" + filename;

        ScreeningResult analysis = aiScreeningService.analyzeResumeAgainstJD(
                resumePath,
                jd.getTitle(),
                jd.getSkills(),
                jd.getDescription()
        );

        String status = "Pending";
        if (analysis.overallScore >= 75) status = "Shortlisted";
        else if (analysis.overallScore < 40) status = "Rejected";

        Application app = new Application();
        app.setCandidateName("Quick Screen Profile");
        app.setEmail("quick.screen@recruitment.com");
        app.setPhone("N/A");
        app.setJobDescription(jd);
        app.setResumeFile(filename);
        app.setStatus(status);
        app.setScreeningStatus("Completed");
        app.setMatchScore(analysis.overallScore);
        app.setSkillsScore(analysis.skillsScore);
        app.setExperienceScore(analysis.experienceScore);
        app.setEducationScore(analysis.educationScore);
        app.setMatchedSkills(analysis.matchedSkills);
        app.setMissingSkills(analysis.missingSkills);
        app.setAdditionalSkills(analysis.additionalSkills);
        app.setCandidateStrengths(analysis.strengths);
        app.setReviewConsiderations(analysis.considerations);
        app.setAiSummary(analysis.aiSummary);
        app.setRecommendation(analysis.recommendation);
        app.setOrganizationId(user.getOrganizationId());

        app = applicationRepository.save(app);

        return ResponseEntity.ok(buildScreeningResponse("AI Screening Complete", app.getId(), status, analysis));
    }
}
