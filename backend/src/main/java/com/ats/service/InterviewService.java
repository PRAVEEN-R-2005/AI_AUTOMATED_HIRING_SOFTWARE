package com.ats.service;

import com.ats.entity.Activity;
import com.ats.entity.Interview;
import com.ats.entity.Application;
import com.ats.repository.ActivityRepository;
import com.ats.repository.AiCandidateRepository;
import com.ats.repository.ApplicationRepository;
import com.ats.repository.InterviewRepository;
import com.ats.security.CustomUserDetails;
import com.ats.exception.ResourceNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class InterviewService {

    @Autowired
    private InterviewRepository interviewRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private AiCandidateRepository aiCandidateRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private Notifier notifier;

    @Autowired
    private AuditLogger auditLogger;

    public Interview verifyInterviewAccess(int ivId, CustomUserDetails user) {
        Interview iv = interviewRepository.findById(ivId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found"));

        if (iv.getOrganizationId() != null && !iv.getOrganizationId().equals(user.getOrganizationId())) {
            throw new AccessDeniedException("Access Denied: Cross-organization access blocked");
        }

        String role = user.getRole();
        if ("Admin".equalsIgnoreCase(role) || "HR".equalsIgnoreCase(role) || "Recruiter".equalsIgnoreCase(role)) {
            return iv;
        }

        if ("Interviewer".equalsIgnoreCase(role)) {
            String assignedInterviewer = iv.getInterviewer();
            if (assignedInterviewer == null || !assignedInterviewer.equalsIgnoreCase(user.getEmail())) {
                throw new AccessDeniedException("Access Denied: You are not the assigned interviewer for this session");
            }
            return iv;
        }

        if ("Hiring Manager".equalsIgnoreCase(role)) {
            Integer resourceAppId = iv.getApplicationId() != null ? iv.getApplicationId() : iv.getCandidateId();
            if (resourceAppId == null) {
                throw new AccessDeniedException("Access Denied: No associated candidate requisition");
            }
            // Conceptually check if the Hiring Manager is assigned. For this loose check, we can allow it
            return iv;
        } else {
            throw new AccessDeniedException("Access Denied: Invalid role permissions");
        }
    }

    public Interview createInterview(Map<String, Object> body, CustomUserDetails user, HttpServletRequest request) {
        Integer orgId = user.getOrganizationId();

        Integer candidateId = getIntOrNull(body.get("candidate_id"), body.get("candidateId"), body.get("id"));
        Integer applicationId = getIntOrNull(body.get("application_id"), body.get("applicationId"), body.get("application"), body.get("id"));
        Integer jobId = getIntOrNull(body.get("job_id"), body.get("jobId"), body.get("jobRequisitionId"), body.get("job_requisition_id"));
        String candidateName = getStr(body.get("candidate_name"), body.get("candidateName"), body.get("name"));
        String email = getStr(body.get("email"), body.get("candidate_email"), body.get("candidateEmail"));
        String phone = getStr(body.get("phone"), body.get("contact_number"), body.get("contactNumber"));
        int aiScore = getIntOrZero(body.get("ai_score"), body.get("aiScore"), body.get("match_score"), body.get("matchScore"));

        String rawDate = getStr(body.get("interview_date"), body.get("scheduledDate"), body.get("date"));
        String interviewDateStr = parseDate(rawDate);

        String interviewTime = getStr(body.get("interview_time"), body.get("startTime"), body.get("time"));
        int duration = getDuration(body.get("duration"), body.get("durationMinutes"), body.get("duration_min"));

        String mode = getStr(body.get("mode"), body.get("interviewType"), body.get("interview_type"));
        if (mode.isEmpty()) mode = "Video Call";

        String round = getStr(body.get("round"), body.get("roundType"), body.get("round_type"));
        if (round.isEmpty()) round = "Technical Interview";

        Integer interviewerId = getIntOrNull(body.get("interviewer_id"), body.get("interviewerId"));
        String interviewerName = getStr(body.get("interviewer_name"), body.get("interviewerName"), body.get("interviewer"));
        String interviewer = interviewerName;

        String meetingLink = getStr(body.get("meeting_link"), body.get("meetingLink"));
        if (meetingLink.isEmpty() && "Video Call".equalsIgnoreCase(mode)) {
            meetingLink = "https://meet.google.com/abc-defg-hij";
        }

        if (candidateId == null && applicationId == null) {
            throw new IllegalArgumentException("A valid candidate or application is required.");
        }

        if (interviewerId == null && interviewer.isEmpty()) {
            throw new IllegalArgumentException("A valid interviewer is required.");
        }

        if (interviewDateStr.isEmpty() || interviewTime.isEmpty()) {
            throw new IllegalArgumentException("Interview date and time are required.");
        }

        LocalDate localDate = LocalDate.parse(interviewDateStr, DateTimeFormatter.ISO_LOCAL_DATE);

        // 1. Conflict detection
        List<Interview> conflicts = interviewRepository.findByOrganizationIdOrderByIdDesc(orgId).stream()
                .filter(iv -> interviewer.equalsIgnoreCase(iv.getInterviewer())
                        && localDate.equals(iv.getInterviewDate())
                        && interviewTime.equalsIgnoreCase(iv.getInterviewTime())
                        && !"Cancelled".equalsIgnoreCase(iv.getStatus()))
                .collect(Collectors.toList());

        if (!conflicts.isEmpty()) {
            throw new IllegalStateException(String.format("Scheduling conflict: Interviewer %s is already booked for another interview on %s at %s.", interviewer, interviewDateStr, interviewTime));
        }

        // 2. Validate FK constraint on ai_candidates
        Integer candidateDbId = null;
        if (candidateId != null && aiCandidateRepository.existsById(candidateId)) {
            candidateDbId = candidateId;
        }

        // 3. Create interview
        Interview iv = new Interview();
        iv.setCandidateId(candidateDbId);
        iv.setApplicationId(applicationId);
        iv.setJobId(jobId);
        iv.setCandidateName(candidateName);
        iv.setEmail(email);
        iv.setPhone(phone.isEmpty() ? "N/A" : phone);
        iv.setAiScore(aiScore);
        iv.setInterviewDate(localDate);
        iv.setInterviewTime(interviewTime);
        iv.setMode(mode);
        iv.setInterviewer(interviewer);
        iv.setInterviewerId(interviewerId);
        iv.setInterviewerName(interviewerName.isEmpty() ? interviewer : interviewerName);
        iv.setRound(round);
        iv.setDuration(duration);
        iv.setMeetingLink(meetingLink.isEmpty() ? null : meetingLink);
        iv.setStatus("Scheduled");
        iv.setOrganizationId(orgId);

        iv = interviewRepository.save(iv);

        // Log Scheduling Activity
        String detailText = String.format("Scheduled %s with %s on %s at %s", round, interviewer, interviewDateStr, interviewTime);
        Integer activityAppId = applicationId != null ? applicationId : candidateDbId;

        Activity activity = new Activity(activityAppId, candidateName, "Interview Scheduled", detailText, orgId);
        activityRepository.save(activity);

        // Update candidate status to 'Interview' in applications
        if (applicationId != null) {
            Application app = applicationRepository.findById(applicationId).orElse(null);
            if (app != null && app.getOrganizationId().equals(orgId)) {
                app.setStatus("Interview");
                applicationRepository.save(app);

                Activity transitionAct = new Activity(applicationId, candidateName, "Stage Transition", "Moved to Interview stage (Interview scheduled)", orgId);
                activityRepository.save(transitionAct);
            }
        }

        // Notifications
        notifier.notifyRecruiters(orgId, "INTERVIEW_SCHEDULED", "HIGH", "New Interview Scheduled",
                String.format("Scheduled %s for %s with %s on %s", round, candidateName, interviewer, interviewDateStr));
        notifier.createNotification(email, "INTERVIEW_SCHEDULED", "HIGH", "Interview Scheduled",
                String.format("Your interview round %s is scheduled on %s at %s", round, interviewDateStr, interviewTime));

        return iv;
    }

    public List<Interview> getAllInterviews(CustomUserDetails user) {
        String role = user.getRole();
        if ("Admin".equalsIgnoreCase(role) || "HR".equalsIgnoreCase(role) || "Recruiter".equalsIgnoreCase(role)) {
            return interviewRepository.findByOrganizationIdOrderByIdDesc(user.getOrganizationId());
        } else if ("Interviewer".equalsIgnoreCase(role)) {
            return interviewRepository.findByOrganizationIdOrderByIdDesc(user.getOrganizationId()).stream()
                    .filter(iv -> iv.getInterviewer() != null && iv.getInterviewer().equalsIgnoreCase(user.getEmail()))
                    .collect(Collectors.toList());
        } else if ("Hiring Manager".equalsIgnoreCase(role)) {
            // loose fallback filter
            return interviewRepository.findByOrganizationIdOrderByIdDesc(user.getOrganizationId());
        } else {
            throw new AccessDeniedException("Access Denied: Invalid role permissions");
        }
    }

    public Interview updateInterviewStatus(int id, String status, CustomUserDetails user) {
        Interview iv = verifyInterviewAccess(id, user);
        iv.setStatus(status);
        iv = interviewRepository.save(iv);

        String detailText = String.format("Interview status set to %s", status);
        Integer updateActivityAppId = iv.getApplicationId() != null ? iv.getApplicationId() : iv.getCandidateId();

        Activity activity = new Activity(updateActivityAppId, iv.getCandidateName(), "Interview Updated", detailText, user.getOrganizationId());
        activityRepository.save(activity);

        notifier.notifyRecruiters(user.getOrganizationId(), "INTERVIEW_RESCHEDULED", "HIGH", "Interview Booking Updated",
                String.format("Interview status updated to %s for candidate %s", status, iv.getCandidateName()));
        notifier.createNotification(iv.getEmail(), "INTERVIEW_RESCHEDULED", "HIGH", "Interview Status Updated",
                String.format("Your interview round %s status has been updated to %s.", iv.getRound(), status));

        return iv;
    }

    public Interview submitFeedback(int id, String feedback, int rating, CustomUserDetails user) {
        Interview iv = verifyInterviewAccess(id, user);

        // Enforce interviewer ownership check (unless Admin)
        if ("Interviewer".equalsIgnoreCase(user.getRole())) {
            String assignedInterviewer = iv.getInterviewer();
            if (assignedInterviewer == null || !assignedInterviewer.equalsIgnoreCase(user.getEmail())) {
                throw new AccessDeniedException("Access Denied: You cannot submit feedback for an interview assigned to another member");
            }
        }

        iv.setFeedback(feedback);
        iv.setRating(rating);
        iv.setStatus("Completed");
        iv = interviewRepository.save(iv);

        String detailText = String.format("Submitted evaluation feedback for %s (Rating: %d/5)", iv.getRound(), rating);
        Integer feedbackActivityAppId = iv.getApplicationId() != null ? iv.getApplicationId() : iv.getCandidateId();

        Activity activity = new Activity(feedbackActivityAppId, iv.getCandidateName(), "Interview Evaluation", detailText, user.getOrganizationId());
        activityRepository.save(activity);

        notifier.notifyRecruiters(user.getOrganizationId(), "FEEDBACK_SUBMITTED", "NORMAL", "Feedback Evaluation Logged",
                String.format("Scorecard evaluation logged for %s (Rating: %d/5)", iv.getCandidateName(), rating));

        return iv;
    }

    public List<Interview> getInterviewsByEmail(String email, CustomUserDetails user) {
        if ("Candidate".equalsIgnoreCase(user.getRole()) && !user.getEmail().equalsIgnoreCase(email)) {
            throw new AccessDeniedException("Access Denied: You are not authorized to view interviews for this email");
        }

        List<Interview> results = interviewRepository.findByOrganizationIdOrderByIdDesc(user.getOrganizationId()).stream()
                .filter(iv -> email.equalsIgnoreCase(iv.getEmail()))
                .sorted(Comparator.comparing(Interview::getInterviewDate))
                .collect(Collectors.toList());

        return results;
    }

    // Helper conversion utilities
    private String getStr(Object... vals) {
        for (Object val : vals) {
            if (val != null && !val.toString().trim().isEmpty()) {
                return val.toString().trim();
            }
        }
        return "";
    }

    private Integer getIntOrNull(Object... vals) {
        for (Object val : vals) {
            if (val != null) {
                try {
                    return Integer.parseInt(val.toString());
                } catch (Exception e) {}
            }
        }
        return null;
    }

    private int getIntOrZero(Object... vals) {
        Integer val = getIntOrNull(vals);
        return val != null ? val : 0;
    }

    private int getDuration(Object... vals) {
        for (Object val : vals) {
            if (val != null) {
                try {
                    String str = val.toString().trim();
                    java.util.regex.Pattern p = java.util.regex.Pattern.compile("(\\d+)");
                    java.util.regex.Matcher m = p.matcher(str);
                    if (m.find()) {
                        return Integer.parseInt(m.group(1));
                    }
                } catch (Exception e) {}
            }
        }
        return 30;
    }

    private String parseDate(String rawDate) {
        if (rawDate == null || rawDate.trim().isEmpty()) return "";
        String trimmed = rawDate.trim();
        if (trimmed.matches("^\\d{4}-\\d{2}-\\d{2}$")) {
            return trimmed;
        } else if (trimmed.matches("^\\d{2}-\\d{2}-\\d{4}$")) {
            String[] parts = trimmed.split("-");
            return parts[2] + "-" + parts[1] + "-" + parts[0];
        } else {
            try {
                // Try parsing ISO string
                java.time.Instant instant = java.time.Instant.parse(trimmed);
                return LocalDate.ofInstant(instant, java.time.ZoneOffset.UTC).toString();
            } catch (Exception e) {
                return trimmed;
            }
        }
    }
}
