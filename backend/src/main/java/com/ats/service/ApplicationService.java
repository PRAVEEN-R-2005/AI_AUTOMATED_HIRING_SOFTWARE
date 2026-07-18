package com.ats.service;

import com.ats.entity.*;
import com.ats.repository.*;
import com.ats.security.CustomUserDetails;
import com.ats.security.Permissions;
import com.ats.exception.ResourceNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class ApplicationService {

    private static final Logger log = LoggerFactory.getLogger(ApplicationService.class);

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private JobDescriptionRepository jobDescriptionRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private JobAssignmentRepository jobAssignmentRepository;

    @Autowired
    private InterviewRepository interviewRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private AuditLogger auditLogger;

    @Autowired
    private Notifier notifier;

    private void deleteFile(String filename) {
        try {
            File file = new File("uploads/resumes/" + filename);
            if (file.exists()) {
                file.delete();
            }
        } catch (Exception e) {
            log.error("Error deleting file: {}", e.getMessage(), e);
        }
    }

    public Application verifyAppAccess(int appId, CustomUserDetails user) {
        Application app = applicationRepository.findById(appId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (app.getOrganizationId() != null && !app.getOrganizationId().equals(user.getOrganizationId())) {
            throw new AccessDeniedException("Access Denied: Cross-organization access blocked");
        }

        String role = user.getRole();
        if ("Admin".equalsIgnoreCase(role) || "HR".equalsIgnoreCase(role) || "Recruiter".equalsIgnoreCase(role)) {
            return app;
        }

        if ("Hiring Manager".equalsIgnoreCase(role)) {
            boolean isAssigned = jobAssignmentRepository.findByJobId(app.getJobDescription().getJdId()).stream()
                    .anyMatch(a -> a.getUser().getId().equals(user.getId()) && "Hiring Manager".equalsIgnoreCase(a.getAssignedRole()));
            if (!isAssigned) {
                throw new AccessDeniedException("Access Denied: You are not assigned to this job");
            }
            return app;
        } else if ("Interviewer".equalsIgnoreCase(role)) {
            boolean hasInterview = interviewRepository.findByOrganizationIdOrderByIdDesc(user.getOrganizationId()).stream()
                    .anyMatch(iv -> (appId == iv.getCandidateId() || appId == iv.getApplicationId())
                            && user.getEmail().equalsIgnoreCase(iv.getInterviewer()));
            if (!hasInterview) {
                throw new AccessDeniedException("Access Denied: You do not have scheduled interviews with this candidate");
            }
            return app;
        } else if ("Candidate".equalsIgnoreCase(role)) {
            if (app.getEmail() == null || !app.getEmail().equalsIgnoreCase(user.getEmail())) {
                throw new AccessDeniedException("Access Denied: You do not own this application");
            }
            return app;
        } else {
            throw new AccessDeniedException("Access Denied: Invalid role permissions");
        }
    }

    public Application createApplication(String candidateName, String email, String phone, int jobId,
                                         String fileName, CustomUserDetails user, HttpServletRequest request) {
        JobDescription jd = jobDescriptionRepository.findById(jobId)
                .orElseThrow(() -> {
                    if (fileName != null) deleteFile(fileName);
                    return new ResourceNotFoundException("Job Requisition not found");
                });

        Integer orgId = jd.getOrganizationId();
        if (orgId == null) orgId = 1;

        Application app = new Application();
        app.setCandidateName(candidateName);
        app.setEmail(email != null ? email.trim() : null);
        app.setPhone(phone);
        app.setJobDescription(jd);
        app.setResumeFile(fileName);
        app.setStatus("Pending");
        app.setOrganizationId(orgId);
        app.setScreeningStatus("PENDING");

        app = applicationRepository.save(app);

        // Notify recruiters of new application
        notifier.notifyRecruiters(orgId, "NEW_APPLICATION", "NORMAL", "New Application Received",
                String.format("Candidate %s has applied for the job: %s", candidateName, jd.getTitle()));

        auditLogger.logEvent(request, orgId, user.getId(), candidateName, email,
                "APPLICATION", "APPLICATION_STATUS_CHANGED", "APPLICATION", app.getId(), "SUCCESS", Map.of("status", "Pending", "job_id", jobId));

        return app;
    }

    public List<Map<String, Object>> getApplications(CustomUserDetails user) {
        String role = user.getRole();
        List<Application> apps;

        if ("Admin".equalsIgnoreCase(role) || "HR".equalsIgnoreCase(role) || "Recruiter".equalsIgnoreCase(role)) {
            apps = applicationRepository.findByOrganizationIdOrderByIdDesc(user.getOrganizationId());
        } else if ("Hiring Manager".equalsIgnoreCase(role)) {
            apps = applicationRepository.findByOrganizationIdOrderByIdDesc(user.getOrganizationId()).stream()
                    .filter(app -> jobAssignmentRepository.findByJobId(app.getJobDescription().getJdId()).stream()
                            .anyMatch(a -> a.getUser().getId().equals(user.getId()) && "Hiring Manager".equalsIgnoreCase(a.getAssignedRole())))
                    .collect(Collectors.toList());
        } else if ("Interviewer".equalsIgnoreCase(role)) {
            apps = applicationRepository.findByOrganizationIdOrderByIdDesc(user.getOrganizationId()).stream()
                    .filter(app -> interviewRepository.findByOrganizationIdOrderByIdDesc(user.getOrganizationId()).stream()
                            .anyMatch(iv -> (app.getId().equals(iv.getApplicationId()) || app.getId().equals(iv.getCandidateId()))
                                    && user.getEmail().equalsIgnoreCase(iv.getInterviewer())))
                    .collect(Collectors.toList());
        } else {
            throw new AccessDeniedException("Access Denied: Invalid role permissions");
        }

        return apps.stream().map(app -> normalizeApplication(app, user)).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getApplicationsByEmail(String email, CustomUserDetails user) {
        if ("Candidate".equalsIgnoreCase(user.getRole()) && !user.getEmail().equalsIgnoreCase(email)) {
            throw new AccessDeniedException("Access Denied: You are not authorized to view applications for this email");
        }

        List<Application> apps = applicationRepository.findByEmailOrderByIdDesc(email);
        return apps.stream().map(app -> normalizeApplication(app, user)).collect(Collectors.toList());
    }

    public Application updateApplicationStatus(int id, String status, CustomUserDetails user, HttpServletRequest request) {
        List<String> validStages = Arrays.asList("Pending", "Screening", "Shortlisted", "Interview", "Hired", "Rejected");
        if (!validStages.contains(status)) {
            throw new IllegalArgumentException("Invalid status stage value.");
        }

        Application app = verifyAppAccess(id, user);
        String oldStatus = app.getStatus();
        app.setStatus(status);
        app = applicationRepository.save(app);

        // Save stage change activity
        Activity activity = new Activity();
        activity.setApplicationId(id);
        activity.setCandidateName(app.getCandidateName() != null ? app.getCandidateName() : "Applicant");
        activity.setAction("Stage Transition");
        activity.setDetails(String.format("Moved from %s to %s", oldStatus, status));
        activity.setOrganizationId(user.getOrganizationId());
        activityRepository.save(activity);

        // Notify recruiters
        notifier.notifyRecruiters(app.getOrganizationId(), "PIPELINE_STAGE_CHANGED", "NORMAL", "Pipeline Stage Transition",
                String.format("Candidate %s moved from %s to %s", app.getCandidateName() != null ? app.getCandidateName() : "Applicant", oldStatus, status));

        // Audit log
        auditLogger.logEvent(request, user.getOrganizationId(), user.getId(), user.getUsername().split("@")[0], user.getEmail(),
                "APPLICATION", "APPLICATION_STATUS_CHANGED", "APPLICATION", id, "SUCCESS", Map.of("oldStatus", oldStatus, "newStatus", status));

        return app;
    }

    public void shortlistApplication(int id, CustomUserDetails user, HttpServletRequest request) {
        Application app = verifyAppAccess(id, user);
        String oldStatus = app.getStatus();
        app.setStatus("Shortlisted");
        applicationRepository.save(app);

        // Save activity
        Activity activity = new Activity();
        activity.setApplicationId(id);
        activity.setCandidateName(app.getCandidateName() != null ? app.getCandidateName() : "Applicant");
        activity.setAction("Shortlist");
        activity.setDetails("Candidate shortlisted for interview stages");
        activity.setOrganizationId(user.getOrganizationId());
        activityRepository.save(activity);

        // Notify recruiters
        notifier.notifyRecruiters(app.getOrganizationId(), "PIPELINE_STAGE_CHANGED", "HIGH", "Candidate Shortlisted",
                String.format("Candidate %s has been shortlisted for interview rounds.", app.getCandidateName() != null ? app.getCandidateName() : "Applicant"));

        // Audit log
        auditLogger.logEvent(request, user.getOrganizationId(), user.getId(), user.getUsername().split("@")[0], user.getEmail(),
                "APPLICATION", "CANDIDATE_SHORTLISTED", "APPLICATION", id, "SUCCESS", Map.of("oldStatus", oldStatus, "newStatus", "Shortlisted"));
    }

    public void rejectApplication(int id, String reason, CustomUserDetails user, HttpServletRequest request) {
        Application app = verifyAppAccess(id, user);
        String oldStatus = app.getStatus();
        app.setStatus("Rejected");
        app.setRejectionReason(reason);
        applicationRepository.save(app);

        // Save activity
        Activity activity = new Activity();
        activity.setApplicationId(id);
        activity.setCandidateName(app.getCandidateName() != null ? app.getCandidateName() : "Applicant");
        activity.setAction("Rejection");
        activity.setDetails(reason != null ? reason : "No rejection reason logged");
        activity.setOrganizationId(user.getOrganizationId());
        activityRepository.save(activity);

        // Notify recruiters
        notifier.notifyRecruiters(app.getOrganizationId(), "CANDIDATE_REJECTED", "NORMAL", "Candidate Rejected",
                String.format("Candidate %s marked Rejected. Reason: %s", app.getCandidateName() != null ? app.getCandidateName() : "Applicant", reason != null ? reason : "None provided"));

        // Audit log
        auditLogger.logEvent(request, user.getOrganizationId(), user.getId(), user.getUsername().split("@")[0], user.getEmail(),
                "APPLICATION", "APPLICATION_STATUS_CHANGED", "APPLICATION", id, "SUCCESS", Map.of("oldStatus", oldStatus, "newStatus", "Rejected", "reason", reason != null ? reason : ""));
    }

    public void updateNotes(int id, String notes, CustomUserDetails user, HttpServletRequest request) {
        Application app = verifyAppAccess(id, user);
        app.setRecruiterNotes(notes);
        applicationRepository.save(app);

        auditLogger.logEvent(request, user.getOrganizationId(), user.getId(), user.getUsername().split("@")[0], user.getEmail(),
                "CANDIDATE", "CANDIDATE_UPDATED", "APPLICATION", id, "SUCCESS", Map.of("field", "recruiter_notes"));
    }

    public void updateMatchScore(int id, int score, CustomUserDetails user) {
        Application app = verifyAppAccess(id, user);
        app.setMatchScore(score);
        applicationRepository.save(app);
    }

    private Map<String, Object> normalizeApplication(Application app, CustomUserDetails user) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", app.getId());
        map.put("candidate_name", app.getCandidateName());
        map.put("email", app.getEmail());
        map.put("phone", app.getPhone());
        map.put("job_id", app.getJobDescription() != null ? app.getJobDescription().getJdId() : null);
        map.put("job_title", app.getJobDescription() != null ? app.getJobDescription().getTitle() : null);
        map.put("resume_file", app.getResumeFile());
        map.put("status", app.getStatus());
        map.put("match_score", app.getMatchScore());
        map.put("overallFit", app.getMatchScore());
        map.put("overallScore", app.getMatchScore());
        map.put("screeningStatus", app.getScreeningStatus() != null ? app.getScreeningStatus() : (app.getMatchScore() != null ? "Completed" : "Pending"));
        map.put("created_at", app.getCreatedAt());

        // Rich AI metadata
        map.put("skills_score", app.getSkillsScore());
        map.put("experience_score", app.getExperienceScore());
        map.put("education_score", app.getEducationScore());
        map.put("matched_skills", app.getMatchedSkills());
        map.put("missing_skills", app.getMissingSkills());
        map.put("additional_skills", app.getAdditionalSkills());
        map.put("candidate_strengths", app.getCandidateStrengths());
        map.put("review_considerations", app.getReviewConsiderations());
        map.put("ai_summary", app.getAiSummary());
        map.put("recommendation", app.getRecommendation());

        // Mask sensitive internal data for Candidate role
        if (!"Candidate".equalsIgnoreCase(user.getRole())) {
            map.put("recruiter_notes", app.getRecruiterNotes());
            map.put("rejection_reason", app.getRejectionReason());
        }

        return map;
    }
}
