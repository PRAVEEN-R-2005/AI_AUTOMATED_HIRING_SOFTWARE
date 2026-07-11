package com.ats.controller;

import com.ats.entity.JobDescription;
import com.ats.security.CustomUserDetails;
import com.ats.security.Permissions;
import com.ats.service.JobDescriptionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/job-descriptions")
public class JobDescriptionController {

    @Autowired
    private JobDescriptionService jobDescriptionService;

    private CustomUserDetails getAuthenticatedUser() {
        if (SecurityContextHolder.getContext().getAuthentication() == null) return null;
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof CustomUserDetails) {
            return (CustomUserDetails) principal;
        }
        return null;
    }

    @PostMapping("")
    public ResponseEntity<?> createJD(@RequestBody Map<String, String> body, HttpServletRequest request) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.JOB_CREATE)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        JobDescription jd = jobDescriptionService.createJD(
                body.get("title"),
                body.get("skills"),
                body.get("experience"),
                body.get("salary"),
                body.get("location"),
                body.get("description"),
                user,
                request
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Job Description Created Successfully",
                "jdId", jd.getJdId()
        ));
    }

    @GetMapping("")
    public ResponseEntity<?> getAllJD() {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.JOB_VIEW)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        List<JobDescription> list = jobDescriptionService.getAllJD(user);
        return ResponseEntity.ok(list);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateJD(@PathVariable("id") int id, @RequestBody Map<String, String> body, HttpServletRequest request) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.JOB_UPDATE)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        jobDescriptionService.updateJD(
                id,
                body.get("title"),
                body.get("skills"),
                body.get("experience"),
                body.get("salary"),
                body.get("location"),
                body.get("description"),
                user,
                request
        );

        return ResponseEntity.ok(Map.of("message", "Job Description Updated Successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteJD(@PathVariable("id") int id, HttpServletRequest request) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.JOB_DELETE)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        jobDescriptionService.deleteJD(id, user, request);
        return ResponseEntity.ok(Map.of("message", "Job Description Deleted"));
    }

    @PutMapping("/publish/{id}")
    public ResponseEntity<?> publishJD(@PathVariable("id") int id, HttpServletRequest request) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.JOB_UPDATE)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        jobDescriptionService.publishJD(id, user, request);
        return ResponseEntity.ok(Map.of("message", "Published"));
    }

    @PutMapping("/close/{id}")
    public ResponseEntity<?> closeJD(@PathVariable("id") int id, HttpServletRequest request) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.JOB_UPDATE)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        jobDescriptionService.closeJD(id, user, request);
        return ResponseEntity.ok(Map.of("message", "Closed"));
    }

    @GetMapping("/open")
    public ResponseEntity<?> getOpenJD() {
        // Anyone logged in can view open job descriptions (public views)
        List<JobDescription> list = jobDescriptionService.getOpenJD();
        return ResponseEntity.ok(list);
    }

    // ======================================
    // HIRING TEAM ASSIGNMENTS
    // ======================================
    @GetMapping("/{id}/team")
    public ResponseEntity<?> getJobTeam(@PathVariable("id") int id) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.JOB_VIEW)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        List<Map<String, Object>> team = jobDescriptionService.getJobTeam(id, user);
        return ResponseEntity.ok(team);
    }

    @PostMapping("/{id}/team")
    public ResponseEntity<?> assignTeamMember(@PathVariable("id") int id, @RequestBody Map<String, Object> body, HttpServletRequest request) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.JOB_ASSIGN_TEAM)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        Integer userId = (Integer) body.get("userId");
        String role = (String) body.get("role");

        jobDescriptionService.assignTeamMember(id, userId, role, user, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Member assigned to hiring team successfully"));
    }

    @DeleteMapping("/{id}/team/{userId}")
    public ResponseEntity<?> unassignTeamMember(@PathVariable("id") int jdId, @PathVariable("userId") int userId, HttpServletRequest request) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.JOB_ASSIGN_TEAM)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        jobDescriptionService.unassignTeamMember(jdId, userId, user, request);
        return ResponseEntity.ok(Map.of("message", "Member unassigned from hiring team successfully"));
    }
}
