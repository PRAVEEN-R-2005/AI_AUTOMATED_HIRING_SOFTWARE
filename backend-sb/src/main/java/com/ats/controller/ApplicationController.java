package com.ats.controller;

import com.ats.entity.Application;
import com.ats.security.CustomUserDetails;
import com.ats.security.Permissions;
import com.ats.service.ApplicationService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.*;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    @Autowired
    private ApplicationService applicationService;

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

    private CustomUserDetails getAuthenticatedUser() {
        if (SecurityContextHolder.getContext().getAuthentication() == null) return null;
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof CustomUserDetails) {
            return (CustomUserDetails) principal;
        }
        return null;
    }

    // ====================================
    // CREATE APPLICATION
    // ====================================
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> createApplication(
            @RequestParam("candidate_name") String candidateName,
            @RequestParam("email") String email,
            @RequestParam("phone") String phone,
            @RequestParam("job_id") int jobId,
            @RequestParam("resume_file") MultipartFile resumeFile,
            HttpServletRequest request
    ) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.JOB_VIEW)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        if (candidateName == null || candidateName.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Candidate name is required"));
        }
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Email is required"));
        }
        if (!email.trim().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Invalid email format"));
        }
        if (phone == null || phone.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Phone number is required"));
        }
        if (!phone.trim().matches("^\\+?[0-9\\s\\-()]{7,20}$")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Invalid phone number format. Please provide a valid phone number."));
        }
        if (resumeFile == null || resumeFile.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Resume file upload is required"));
        }

        String fileName = saveResumeFile(resumeFile);
        if (fileName == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Failed to save uploaded file"));
        }

        Application app = applicationService.createApplication(candidateName, email, phone, jobId, fileName, user, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Application Submitted Successfully",
                "applicationId", app.getId()
        ));
    }

    // ====================================
    // GET ALL APPLICATIONS
    // ====================================
    @GetMapping("/all")
    public ResponseEntity<?> getApplications() {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.APPLICATION_VIEW)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        List<Map<String, Object>> response = applicationService.getApplications(user);
        return ResponseEntity.ok(response);
    }

    // ====================================
    // GET APPLICATIONS BY EMAIL
    // ====================================
    @GetMapping("/email/{email}")
    public ResponseEntity<?> getApplicationByEmail(@PathVariable("email") String email) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        List<Map<String, Object>> response = applicationService.getApplicationsByEmail(email, user);
        return ResponseEntity.ok(response);
    }

    // ====================================
    // UPDATE STATUS
    // ====================================
    @PutMapping("/status/{id}")
    public ResponseEntity<?> updateApplicationStatus(@PathVariable("id") int id, @RequestBody Map<String, String> body, HttpServletRequest request) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.APPLICATION_UPDATE)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        String status = body.get("status");
        Application app = applicationService.updateApplicationStatus(id, status, user, request);
        return ResponseEntity.ok(Map.of("message", "Status Updated", "status", app.getStatus()));
    }

    // ====================================
    // SHORTLIST APPLICATION
    // ====================================
    @PutMapping("/shortlist/{id}")
    public ResponseEntity<?> shortlistApplication(@PathVariable("id") int id, HttpServletRequest request) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.APPLICATION_UPDATE)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        applicationService.shortlistApplication(id, user, request);
        return ResponseEntity.ok(Map.of("message", "Candidate Shortlisted"));
    }

    // ====================================
    // REJECT APPLICATION
    // ====================================
    @PutMapping("/reject/{id}")
    public ResponseEntity<?> rejectApplication(@PathVariable("id") int id, @RequestBody Map<String, String> body, HttpServletRequest request) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.APPLICATION_UPDATE)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        String reason = body.get("reason");
        applicationService.rejectApplication(id, reason, user, request);
        return ResponseEntity.ok(Map.of("message", "Candidate Rejected"));
    }

    // ====================================
    // UPDATE NOTES
    // ====================================
    @PutMapping("/notes/{id}")
    public ResponseEntity<?> updateNotes(@PathVariable("id") int id, @RequestBody Map<String, String> body, HttpServletRequest request) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.APPLICATION_UPDATE)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        String notes = body.get("notes");
        applicationService.updateNotes(id, notes, user, request);
        return ResponseEntity.ok(Map.of("message", "Notes Updated"));
    }

    // ====================================
    // UPDATE MATCH SCORE
    // ====================================
    @PutMapping("/score/{id}")
    public ResponseEntity<?> updateMatchScore(@PathVariable("id") int id, @RequestBody Map<String, Object> body) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.APPLICATION_UPDATE)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        Object scoreObj = body.get("match_score");
        if (scoreObj == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "match_score is required"));
        }
        int score = Integer.parseInt(scoreObj.toString());

        applicationService.updateMatchScore(id, score, user);
        return ResponseEntity.ok(Map.of("message", "Match Score Updated Successfully"));
    }
}
