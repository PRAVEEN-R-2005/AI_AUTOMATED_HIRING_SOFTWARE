package com.ats.controller;

import com.ats.entity.Job;
import com.ats.security.CustomUserDetails;
import com.ats.security.Permissions;
import com.ats.service.JobService;
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
public class JobController {

    @Autowired
    private JobService jobService;

    private String saveFile(MultipartFile file) {
        if (file == null || file.isEmpty()) return null;
        try {
            String uploadsDir = "uploads/";
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

    // ======================================
    // CREATE JOB
    // ======================================
    @PostMapping(value = "/api/jobs", consumes = "multipart/form-data")
    public ResponseEntity<?> createJob(
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "skills", required = false) String skills,
            @RequestParam(value = "experience", required = false) String experience,
            @RequestParam(value = "salary", required = false) String salary,
            @RequestParam(value = "location", required = false) String location,
            @RequestParam(value = "employment_type", required = false) String employmentType,
            @RequestParam(value = "jd_file", required = false) MultipartFile jdFile,
            HttpServletRequest request
    ) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.JOB_CREATE)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        String fileName = saveFile(jdFile);
        Job job = jobService.createJob(title, description, skills, experience, salary, location,
                employmentType, fileName, user.getOrganizationId(), user.getId(), user.getEmail(), request);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Job Created Successfully",
                "jobId", job.getId()
        ));
    }

    // ======================================
    // GET ALL JOBS
    // ======================================
    @GetMapping("/api/jobs")
    public ResponseEntity<?> getJobs() {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.JOB_VIEW)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        List<Job> jobs = jobService.getJobs(user.getOrganizationId());
        return ResponseEntity.ok(jobs);
    }

    // ======================================
    // GET OPEN JOBS (Candidate view)
    // ======================================
    @GetMapping("/api/jobs/open")
    public ResponseEntity<?> getOpenJobs() {
        List<Job> jobs = jobService.getOpenJobs();
        return ResponseEntity.ok(jobs);
    }

    // ======================================
    // PUBLISH JOB
    // ======================================
    @PutMapping("/api/jobs/publish/{id}")
    public ResponseEntity<?> publishJob(@PathVariable("id") int id, HttpServletRequest request) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.JOB_PUBLISH)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        jobService.publishJob(id, user.getOrganizationId(), user.getId(), user.getEmail(), request);
        return ResponseEntity.ok(Map.of("message", "Job Status Updated to Open"));
    }

    // ======================================
    // CLOSE JOB
    // ======================================
    @PutMapping("/api/jobs/close/{id}")
    public ResponseEntity<?> closeJob(@PathVariable("id") int id, HttpServletRequest request) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.JOB_UPDATE)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        jobService.closeJob(id, user.getOrganizationId(), user.getId(), user.getEmail(), request);
        return ResponseEntity.ok(Map.of("message", "Job Status Updated to Closed"));
    }

    // ======================================
    // DELETE JOB
    // ======================================
    @DeleteMapping("/api/jobs/{id}")
    public ResponseEntity<?> deleteJob(@PathVariable("id") int id, HttpServletRequest request) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.JOB_DELETE)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        jobService.deleteJob(id, user.getOrganizationId(), user.getId(), user.getEmail(), request);
        return ResponseEntity.ok(Map.of("message", "Job Deleted Successfully"));
    }
}
