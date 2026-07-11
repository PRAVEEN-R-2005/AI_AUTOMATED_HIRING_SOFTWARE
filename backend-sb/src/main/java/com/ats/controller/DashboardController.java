package com.ats.controller;

import com.ats.security.CustomUserDetails;
import com.ats.security.Permissions;
import com.ats.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    private CustomUserDetails getAuthenticatedUser() {
        if (SecurityContextHolder.getContext().getAuthentication() == null) return null;
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof CustomUserDetails) {
            return (CustomUserDetails) principal;
        }
        return null;
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getDashboardStats() {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.ANALYTICS_VIEW)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        Map<String, Object> stats = dashboardService.getDashboardStats(user);
        return ResponseEntity.ok(stats);
    }
}
