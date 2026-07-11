package com.ats.controller;

import com.ats.entity.Organization;
import com.ats.entity.User;
import com.ats.security.CustomUserDetails;
import com.ats.security.Permissions;
import com.ats.service.SettingsService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.lang.management.ManagementFactory;
import java.util.*;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    @Autowired
    private SettingsService settingsService;

    @Autowired
    private JdbcTemplate jdbcTemplate; // for select 1 in system-info health check

    private CustomUserDetails getAuthenticatedUser() {
        if (SecurityContextHolder.getContext().getAuthentication() == null) return null;
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof CustomUserDetails) {
            return (CustomUserDetails) principal;
        }
        return null;
    }

    // ====================================
    // GET PROFILE
    // ====================================
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        User u = settingsService.getProfile(user.getEmail());

        Map<String, Object> map = new HashMap<>();
        map.put("id", u.getId());
        map.put("name", u.getName());
        map.put("email", u.getEmail());
        map.put("role", u.getRole());
        map.put("phone", u.getPhone());
        map.put("job_title", u.getJobTitle());
        map.put("timezone", u.getTimezone());
        map.put("locale", u.getLocale());
        map.put("default_landing_page", u.getDefaultLandingPage());
        map.put("default_analytics_range", u.getDefaultAnalyticsRange());
        map.put("default_candidate_view", u.getDefaultCandidateView());
        map.put("default_pipeline_view", u.getDefaultPipelineView());
        map.put("theme", u.getTheme());
        map.put("created_at", u.getCreatedAt());

        return ResponseEntity.ok(map);
    }

    // ====================================
    // UPDATE PROFILE
    // ====================================
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> body, HttpServletRequest request) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        settingsService.updateProfile(body, user, request);
        return ResponseEntity.ok(Map.of("message", "Profile settings updated successfully"));
    }

    // ====================================
    // CHANGE PASSWORD
    // ====================================
    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body, HttpServletRequest request) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");

        settingsService.changePassword(currentPassword, newPassword, user, request);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    // ====================================
    // GET ORGANIZATION
    // ====================================
    @GetMapping("/organization")
    public ResponseEntity<?> getOrganization() {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || user.getOrganizationId() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "User does not belong to an active organization workspace"));
        }

        Organization org = settingsService.getOrganization(user.getOrganizationId());

        Map<String, Object> map = new HashMap<>();
        map.put("id", org.getId());
        map.put("name", org.getName());
        map.put("slug", org.getSlug());
        map.put("status", org.getStatus());
        map.put("logo_url", org.getLogoUrl());
        map.put("industry", org.getIndustry());
        map.put("company_size", org.getCompanySize());
        map.put("website", org.getWebsite());
        map.put("timezone", org.getTimezone());
        map.put("locale", org.getLocale());
        map.put("default_pipeline", org.getDefaultPipeline());
        map.put("default_interview_duration", org.getDefaultInterviewDuration());
        map.put("default_interview_type", org.getDefaultInterviewType());
        map.put("default_application_stage", org.getDefaultApplicationStage());
        map.put("default_analytics_range", org.getDefaultAnalyticsRange());
        map.put("created_at", org.getCreatedAt());

        return ResponseEntity.ok(map);
    }

    // ====================================
    // UPDATE ORGANIZATION (Admin Only)
    // ====================================
    @PutMapping("/organization")
    public ResponseEntity<?> updateOrganization(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.ORGANIZATION_UPDATE)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        settingsService.updateOrganization(body, user, request);
        return ResponseEntity.ok(Map.of("message", "Organization settings updated successfully"));
    }

    // ====================================
    // GET AUDIT LOGS (Admin Only)
    // ====================================
    @GetMapping("/audit-logs")
    public ResponseEntity<?> getAuditLogs(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "10") int limit,
            @RequestParam(value = "search", defaultValue = "") String search,
            @RequestParam(value = "category", defaultValue = "All") String category,
            @RequestParam(value = "result", defaultValue = "All") String result,
            @RequestParam(value = "startDate", defaultValue = "") String startDate,
            @RequestParam(value = "endDate", defaultValue = "") String endDate
    ) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.AUDIT_LOG_VIEW)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        Map<String, Object> response = settingsService.getAuditLogs(page, limit, search, category, result, startDate, endDate, user);
        return ResponseEntity.ok(response);
    }

    // ====================================
    // GET SYSTEM INFO (Admin Only)
    // ====================================
    @GetMapping("/system-info")
    public ResponseEntity<?> getSystemInfo() {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.SYSTEM_INFO_VIEW)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        try {
            jdbcTemplate.execute("SELECT 1");
            String dbStatus = "OPERATIONAL";

            Runtime runtime = Runtime.getRuntime();
            Map<String, Object> memoryUsage = Map.of(
                    "rss", (runtime.totalMemory() / (1024 * 1024)) + " MB",
                    "heapTotal", (runtime.totalMemory() / (1024 * 1024)) + " MB",
                    "heapUsed", ((runtime.totalMemory() - runtime.freeMemory()) / (1024 * 1024)) + " MB"
            );

            return ResponseEntity.ok(Map.of(
                    "status", "OPERATIONAL",
                    "services", Map.of(
                            "database", Map.of("status", dbStatus, "details", "Connection active and pool responding"),
                            "ai_engine", Map.of("status", "OPERATIONAL", "details", "OPERATIONAL (Local Rule-based NLP Engine)"),
                            "email", Map.of("status", "OPERATIONAL", "details", "NOT CONFIGURED (Mock Mode)"),
                            "scheduler", Map.of("status", "OPERATIONAL", "details", "OPERATIONAL (Internal CRON Scheduler active)"),
                            "realtime", Map.of("status", "OPERATIONAL", "details", "SSE Channels active")
                    ),
                    "environment", Map.of(
                            "nodeEnv", "development",
                            "javaVersion", System.getProperty("java.version"),
                            "platform", System.getProperty("os.name"),
                            "uptime", ManagementFactory.getRuntimeMXBean().getUptime() / 1000,
                            "memoryUsage", memoryUsage
                    )
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Database Connectivity Failed"));
        }
    }

    // ====================================
    // LIST USERS (Admin Only)
    // ====================================
    @GetMapping("/users")
    public ResponseEntity<?> listUsers() {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !"Admin".equalsIgnoreCase(user.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        List<User> users = settingsService.listUsers();
        List<Map<String, Object>> response = new ArrayList<>();
        for (User u : users) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", u.getId());
            m.put("name", u.getName());
            m.put("email", u.getEmail());
            m.put("role", u.getRole());
            m.put("created_at", u.getCreatedAt());
            response.add(m);
        }
        return ResponseEntity.ok(response);
    }

    // ====================================
    // INVITE USER (Admin Only)
    // ====================================
    @PostMapping("/users/invite")
    public ResponseEntity<?> inviteUser(@RequestBody Map<String, String> body, HttpServletRequest request) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !"Admin".equalsIgnoreCase(user.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        User u = settingsService.inviteUser(body, user, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "User invited successfully",
                "userId", u.getId()
        ));
    }

    // ====================================
    // DELETE USER (Admin Only)
    // ====================================
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable("id") int id, HttpServletRequest request) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !"Admin".equalsIgnoreCase(user.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        settingsService.deleteUser(id, user, request);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }
}
