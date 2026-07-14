package com.ats.controller;

import com.ats.security.CustomUserDetails;
import com.ats.security.Permissions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/hr")
public class HrController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private CustomUserDetails getAuthenticatedUser() {
        if (SecurityContextHolder.getContext().getAuthentication() == null) return null;
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof CustomUserDetails) {
            return (CustomUserDetails) principal;
        }
        return null;
    }

    private static class ScopeResult {
        public String whereClause;
        public List<Object> params;
    }

    private ScopeResult getCandidateScope(CustomUserDetails user) {
        String role = user.getRole();
        Integer orgIdObj = user.getOrganizationId();
        if (orgIdObj == null) {
            ScopeResult res = new ScopeResult();
            res.params = new ArrayList<>();
            res.whereClause = "1=0"; // No org context — return empty results
            return res;
        }
        int orgId = orgIdObj;
        
        ScopeResult res = new ScopeResult();
        res.params = new ArrayList<>();
        res.params.add(orgId);

        if ("Admin".equalsIgnoreCase(role) || "HR".equalsIgnoreCase(role) || "Recruiter".equalsIgnoreCase(role)) {
            res.whereClause = "a.organization_id = ?";
        } else if ("Hiring Manager".equalsIgnoreCase(role)) {
            res.whereClause = "a.organization_id = ? AND a.job_id IN (SELECT job_id FROM job_assignments WHERE user_id = ? AND assigned_role = 'Hiring Manager')";
            res.params.add(user.getId());
        } else if ("Interviewer".equalsIgnoreCase(role)) {
            res.whereClause = "a.organization_id = ? AND a.id IN (SELECT COALESCE(application_id, candidate_id) FROM interviews WHERE organization_id = ? AND interviewer = ?)";
            res.params.add(orgId);
            res.params.add(user.getEmail());
        } else {
            res.whereClause = "a.organization_id = ? AND 1=0";
        }
        return res;
    }

    @GetMapping("/top-candidates")
    public ResponseEntity<?> getTopCandidates() {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.CANDIDATE_VIEW)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        try {
            ScopeResult scope = getCandidateScope(user);
            String sql = "SELECT a.id, a.candidate_name AS name, a.email, a.phone, a.status, a.match_score, a.resume_file, a.created_at, " +
                    "j.title AS job_title, a.recruiter_notes, a.rejection_reason " +
                    "FROM applications a LEFT JOIN job_descriptions j ON a.job_id = j.jd_id " +
                    "WHERE " + scope.whereClause + " ORDER BY a.match_score DESC";
            
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, scope.params.toArray());
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Database Error"));
        }
    }

    @GetMapping("/candidate/{id}")
    public ResponseEntity<?> getCandidateById(@PathVariable("id") int id) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.CANDIDATE_VIEW)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        try {
            String sql = "SELECT a.id, a.candidate_name AS name, a.email, a.phone, a.status, a.match_score, a.resume_file, a.created_at, " +
                    "j.title AS job_title, a.recruiter_notes, a.rejection_reason, a.job_id " +
                    "FROM applications a LEFT JOIN job_descriptions j ON a.job_id = j.jd_id " +
                    "WHERE a.id = ? AND a.organization_id = ?";
            
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, id, user.getOrganizationId());
            if (results.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Candidate not found"));
            }

            Map<String, Object> candidate = results.get(0);
            String role = user.getRole();

            if ("Hiring Manager".equalsIgnoreCase(role)) {
                String assignmentCheck = "SELECT id FROM job_assignments WHERE job_id = ? AND user_id = ? AND assigned_role = 'Hiring Manager'";
                List<Map<String, Object>> checks = jdbcTemplate.queryForList(assignmentCheck, candidate.get("job_id"), user.getId());
                if (checks.isEmpty()) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied: You are not assigned to this job"));
                }
                return ResponseEntity.ok(results);
            } else if ("Interviewer".equalsIgnoreCase(role)) {
                String interviewCheck = "SELECT id FROM interviews WHERE (candidate_id = ? OR application_id = ?) AND interviewer = ? AND organization_id = ?";
                List<Map<String, Object>> checks = jdbcTemplate.queryForList(interviewCheck, id, id, user.getEmail(), user.getOrganizationId());
                if (checks.isEmpty()) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied: You do not have scheduled interviews with this candidate"));
                }
                Map<String, Object> maskedCandidate = new HashMap<>(candidate);
                maskedCandidate.put("recruiter_notes", null);
                return ResponseEntity.ok(Collections.singletonList(maskedCandidate));
            } else {
                return ResponseEntity.ok(results);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Database Error"));
        }
    }

    @GetMapping("/all-candidates")
    public ResponseEntity<?> getAllCandidates() {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.CANDIDATE_VIEW)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        try {
            ScopeResult scope = getCandidateScope(user);
            String sql = "SELECT a.id, a.candidate_name AS name, a.email, a.phone, a.status, a.match_score, a.resume_file, a.created_at, " +
                    "j.title AS job_title, a.recruiter_notes, a.rejection_reason " +
                    "FROM applications a LEFT JOIN job_descriptions j ON a.job_id = j.jd_id " +
                    "WHERE " + scope.whereClause + " ORDER BY a.id DESC";

            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, scope.params.toArray());
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Database Error"));
        }
    }

    @GetMapping("/activities")
    public ResponseEntity<?> getActivities() {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.ANALYTICS_VIEW)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        try {
            String sql = "SELECT * FROM activities WHERE organization_id = ? ORDER BY id DESC LIMIT 50";
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, user.getOrganizationId());
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Database Error"));
        }
    }
}
