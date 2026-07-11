package com.ats.controller;

import com.ats.entity.Interview;
import com.ats.security.CustomUserDetails;
import com.ats.security.Permissions;
import com.ats.service.InterviewService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/interviews")
public class InterviewController {

    @Autowired
    private InterviewService interviewService;

    private CustomUserDetails getAuthenticatedUser() {
        if (SecurityContextHolder.getContext().getAuthentication() == null) return null;
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof CustomUserDetails) {
            return (CustomUserDetails) principal;
        }
        return null;
    }

    // ====================================
    // CREATE INTERVIEW
    // ====================================
    @PostMapping
    public ResponseEntity<?> createInterview(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.INTERVIEW_CREATE)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        Interview iv = interviewService.createInterview(body, user, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Interview Scheduled Successfully",
                "interviewId", iv.getId()
        ));
    }

    // ====================================
    // GET ALL INTERVIEWS
    // ====================================
    @GetMapping("/all")
    public ResponseEntity<?> getAllInterviews() {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.INTERVIEW_VIEW)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        List<Interview> ivs = interviewService.getAllInterviews(user);
        return ResponseEntity.ok(ivs);
    }

    // ====================================
    // UPDATE STATUS
    // ====================================
    @PutMapping("/status/{id}")
    public ResponseEntity<?> updateInterviewStatus(@PathVariable("id") int id, @RequestBody Map<String, String> body) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.INTERVIEW_UPDATE)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        String status = body.get("status");
        Interview iv = interviewService.updateInterviewStatus(id, status, user);

        return ResponseEntity.ok(Map.of("message", "Interview Status Updated", "status", iv.getStatus()));
    }

    // ====================================
    // SUBMIT FEEDBACK
    // ====================================
    @PutMapping("/feedback/{id}")
    public ResponseEntity<?> submitFeedback(@PathVariable("id") int id, @RequestBody Map<String, Object> body) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.INTERVIEW_FEEDBACK_SUBMIT)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        Object feedbackObj = body.get("feedback");
        Object ratingObj = body.get("rating");

        if (feedbackObj == null || ratingObj == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Evaluation comments and rating are required."));
        }

        String feedback = feedbackObj.toString();
        int rating = Integer.parseInt(ratingObj.toString());

        Interview iv = interviewService.submitFeedback(id, feedback, rating, user);

        return ResponseEntity.ok(Map.of("message", "Feedback and rating scorecard submitted successfully", "status", "Completed"));
    }

    // ====================================
    // GET INTERVIEWS BY EMAIL
    // ====================================
    @GetMapping("/email/{email}")
    public ResponseEntity<?> getInterviewsByEmail(@PathVariable("email") String email) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        List<Interview> ivs = interviewService.getInterviewsByEmail(email, user);
        return ResponseEntity.ok(ivs);
    }
}
