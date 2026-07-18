package com.ats.controller;

import com.ats.entity.JobDescription;
import com.ats.security.CustomUserDetails;
import com.ats.security.Permissions;
import com.ats.service.JobDescriptionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/job-descriptions")
public class JobDescriptionController {

    private static final Logger log = LoggerFactory.getLogger(JobDescriptionController.class);


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
            log.warn("Unauthorized attempt to create Job Description");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        log.info("Creating Job Description by user: {}", user.getEmail());
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
            log.warn("Unauthorized attempt to update Job Description id: {}", id);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        log.info("Updating Job Description id: {} by user: {}", id, user.getEmail());
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
            log.warn("Unauthorized attempt to delete Job Description id: {}", id);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        log.info("Deleting Job Description id: {} by user: {}", id, user.getEmail());
        jobDescriptionService.deleteJD(id, user, request);
        return ResponseEntity.ok(Map.of("message", "Job Description Deleted"));
    }

    @PutMapping("/publish/{id}")
    public ResponseEntity<?> publishJD(@PathVariable("id") String idStr, HttpServletRequest request) {
        Integer id;
        try {
            id = Integer.parseInt(idStr);
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid Job ID"));
        }

        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.JOB_UPDATE)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        jobDescriptionService.publishJD(id, user, request);
        return ResponseEntity.ok(Map.of("message", "Published"));
    }

    @PutMapping("/close/{id}")
    public ResponseEntity<?> closeJD(@PathVariable("id") String idStr, HttpServletRequest request) {
        Integer id;
        try {
            id = Integer.parseInt(idStr);
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid Job ID"));
        }

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

        Object userIdObj = body.get("userId");
        if (userIdObj == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "userId is required"));
        }
        Integer userId;
        try {
            userId = Integer.parseInt(userIdObj.toString());
        } catch (NumberFormatException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "userId must be a valid number"));
        }

        String role = (String) body.get("role");
        if (role == null || role.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "role is required"));
        }

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
