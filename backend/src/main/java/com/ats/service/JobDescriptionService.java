package com.ats.service;

import com.ats.entity.*;
import com.ats.repository.*;
import com.ats.security.CustomUserDetails;
import com.ats.exception.ResourceNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class JobDescriptionService {

    @Autowired
    private JobDescriptionRepository jobDescriptionRepository;

    @Autowired
    private JobAssignmentRepository jobAssignmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private AuditLogger auditLogger;

    private JobDescription verifyOwnership(int id, CustomUserDetails user) {
        JobDescription jd = jobDescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job Description Not Found"));

        if (jd.getOrganizationId() != null && !jd.getOrganizationId().equals(user.getOrganizationId())) {
            throw new AccessDeniedException("Access Denied: Cross-organization access blocked");
        }

        boolean isOwner = user.getEmail().equalsIgnoreCase(jd.getCreatedBy());
        boolean isAdmin = "Admin".equalsIgnoreCase(user.getRole());

        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("Access Denied: Unauthorized to modify this resource");
        }

        return jd;
    }

    public JobDescription createJD(String title, String skills, String experience, String salary,
                                   String location, String description, CustomUserDetails user, HttpServletRequest request) {
        JobDescription jd = new JobDescription();
        jd.setTitle(title);
        jd.setSkills(skills);
        jd.setExperience(experience);
        jd.setSalary(salary);
        jd.setLocation(location);
        jd.setDescription(description);
        jd.setCreatedBy(user.getEmail());
        jd.setOrganizationId(user.getOrganizationId());
        jd.setStatus("Pending");

        jd = jobDescriptionRepository.save(jd);

        String username = user.getEmail() != null ? user.getEmail().split("@")[0] : "system";
        auditLogger.logEvent(request, user.getOrganizationId(), user.getId(), username, user.getEmail(),
                "JOB", "JOB_CREATED", "JOB", jd.getJdId(), "SUCCESS",
                Map.of("title", title, "location", location != null ? location : ""));

        return jd;
    }

    public List<JobDescription> getAllJD(CustomUserDetails user) {
        String role = user.getRole();
        Integer orgId = user.getOrganizationId();

        if ("Interviewer".equalsIgnoreCase(role)) {
            throw new AccessDeniedException("Access Denied: Interviewers cannot view the jobs list");
        }

        if ("Admin".equalsIgnoreCase(role) || "HR".equalsIgnoreCase(role) || "Recruiter".equalsIgnoreCase(role)) {
            return jobDescriptionRepository.findByOrganizationIdOrderByJdIdDesc(orgId);
        } else if ("Hiring Manager".equalsIgnoreCase(role)) {
            return jobDescriptionRepository.findByOrganizationIdOrderByJdIdDesc(orgId).stream()
                    .filter(jd -> jobAssignmentRepository.findByJobId(jd.getJdId()).stream()
                            .anyMatch(ja -> ja.getUser().getId().equals(user.getId()) && "Hiring Manager".equalsIgnoreCase(ja.getAssignedRole())))
                    .collect(Collectors.toList());
        } else {
            throw new AccessDeniedException("Access Denied: Invalid role permissions");
        }
    }

    public JobDescription updateJD(int id, String title, String skills, String experience, String salary,
                                   String location, String description, CustomUserDetails user, HttpServletRequest request) {
        JobDescription jd = verifyOwnership(id, user);
        jd.setTitle(title);
        jd.setSkills(skills);
        jd.setExperience(experience);
        jd.setSalary(salary);
        jd.setLocation(location);
        jd.setDescription(description);

        jd = jobDescriptionRepository.save(jd);

        String username = user.getEmail() != null ? user.getEmail().split("@")[0] : "system";
        auditLogger.logEvent(request, user.getOrganizationId(), user.getId(), username, user.getEmail(),
                "JOB", "JOB_UPDATED", "JOB", id, "SUCCESS", Map.of("jobId", id));

        return jd;
    }

    public void deleteJD(int id, CustomUserDetails user, HttpServletRequest request) {
        JobDescription jd = verifyOwnership(id, user);
        jobDescriptionRepository.delete(jd);

        String username = user.getEmail() != null ? user.getEmail().split("@")[0] : "system";
        auditLogger.logEvent(request, user.getOrganizationId(), user.getId(), username, user.getEmail(),
                "JOB", "JOB_DELETED", "JOB", id, "SUCCESS", Map.of("jobId", id));
    }

    public void publishJD(int id, CustomUserDetails user, HttpServletRequest request) {
        JobDescription jd = verifyOwnership(id, user);
        jd.setStatus("Open");
        jobDescriptionRepository.save(jd);

        String username = user.getEmail() != null ? user.getEmail().split("@")[0] : "system";
        auditLogger.logEvent(request, user.getOrganizationId(), user.getId(), username, user.getEmail(),
                "JOB", "JOB_PUBLISHED", "JOB", id, "SUCCESS", Map.of("jobId", id));
    }

    public void closeJD(int id, CustomUserDetails user, HttpServletRequest request) {
        JobDescription jd = verifyOwnership(id, user);
        jd.setStatus("Closed");
        jobDescriptionRepository.save(jd);

        String username = user.getEmail() != null ? user.getEmail().split("@")[0] : "system";
        auditLogger.logEvent(request, user.getOrganizationId(), user.getId(), username, user.getEmail(),
                "JOB", "JOB_CLOSED", "JOB", id, "SUCCESS", Map.of("jobId", id));
    }

    public List<JobDescription> getOpenJD() {
        return jobDescriptionRepository.findAll().stream()
                .filter(jd -> "Open".equalsIgnoreCase(jd.getStatus()))
                .sorted((a, b) -> b.getJdId().compareTo(a.getJdId()))
                .collect(Collectors.toList());
    }

    // ======================================
    // HIRING TEAM ASSIGNMENTS
    // ======================================
    public List<Map<String, Object>> getJobTeam(int jdId, CustomUserDetails user) {
        // Validate JD exists in org
        JobDescription jd = jobDescriptionRepository.findById(jdId)
                .orElseThrow(() -> new ResourceNotFoundException("Job Description Not Found"));

        if (jd.getOrganizationId() != null && !jd.getOrganizationId().equals(user.getOrganizationId())) {
            throw new AccessDeniedException("Access Denied: Cross-organization access blocked");
        }

        List<JobAssignment> assignments = jobAssignmentRepository.findByJobId(jdId);
        List<Map<String, Object>> list = new ArrayList<>();
        for (JobAssignment ja : assignments) {
            User u = ja.getUser();
            Map<String, Object> map = new HashMap<>();
            map.put("id", ja.getId());
            map.put("user_id", u.getId());
            map.put("name", u.getName());
            map.put("email", u.getEmail());
            map.put("role", ja.getAssignedRole());
            list.add(map);
        }
        return list;
    }

    public void assignTeamMember(int jdId, Integer userId, String role, CustomUserDetails user, HttpServletRequest request) {
        JobDescription jd = jobDescriptionRepository.findById(jdId)
                .orElseThrow(() -> new ResourceNotFoundException("Job Description Not Found"));

        if (jd.getOrganizationId() != null && !jd.getOrganizationId().equals(user.getOrganizationId())) {
            throw new AccessDeniedException("Access Denied: Cross-organization access blocked");
        }

        User u = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Hiring Team member not found"));

        // Check if already assigned
        boolean exists = jobAssignmentRepository.findByJobId(jdId).stream()
                .anyMatch(ja -> ja.getUser().getId().equals(userId));
        if (exists) {
            throw new IllegalArgumentException("User is already assigned to this hiring team requisition");
        }

        JobAssignment ja = new JobAssignment();
        ja.setJobId(jdId);
        ja.setUser(u);
        ja.setAssignedRole(role);

        jobAssignmentRepository.save(ja);

        String username = user.getEmail() != null ? user.getEmail().split("@")[0] : "system";
        auditLogger.logEvent(request, user.getOrganizationId(), user.getId(), username, user.getEmail(),
                "TEAM", "MEMBER_ASSIGNED", "JOB", jdId, "SUCCESS", Map.of("assignedUserId", userId, "assignedRole", role));
    }

    public void unassignTeamMember(int jdId, Integer userId, CustomUserDetails user, HttpServletRequest request) {
        JobDescription jd = jobDescriptionRepository.findById(jdId)
                .orElseThrow(() -> new ResourceNotFoundException("Job Description Not Found"));

        if (jd.getOrganizationId() != null && !jd.getOrganizationId().equals(user.getOrganizationId())) {
            throw new AccessDeniedException("Access Denied: Cross-organization access blocked");
        }

        List<JobAssignment> list = jobAssignmentRepository.findByJobId(jdId).stream()
                .filter(ja -> ja.getUser().getId().equals(userId))
                .collect(Collectors.toList());

        if (list.isEmpty()) {
            throw new ResourceNotFoundException("Assignment not found");
        }

        jobAssignmentRepository.deleteAll(list);

        String username = user.getEmail() != null ? user.getEmail().split("@")[0] : "system";
        auditLogger.logEvent(request, user.getOrganizationId(), user.getId(), username, user.getEmail(),
                "TEAM", "MEMBER_UNASSIGNED", "JOB", jdId, "SUCCESS", Map.of("unassignedUserId", userId));
    }
}
