package com.ats.controller;

import com.ats.security.CustomUserDetails;
import com.ats.security.Permissions;
import com.ats.service.TeamService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/team")
public class TeamController {

    @Autowired
    private TeamService teamService;

    private CustomUserDetails getAuthenticatedUser() {
        if (SecurityContextHolder.getContext().getAuthentication() == null) return null;
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof CustomUserDetails) {
            return (CustomUserDetails) principal;
        }
        return null;
    }

    // ====================================
    // GET MEMBERS
    // ====================================
    @GetMapping("/members")
    public ResponseEntity<?> getMembers(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "status", required = false) String status
    ) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.TEAM_VIEW)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        List<Map<String, Object>> members = teamService.getMembers(search, role, status, user);
        return ResponseEntity.ok(members);
    }

    // ====================================
    // UPDATE MEMBER ROLE
    // ====================================
    @PutMapping("/members/{id}/role")
    public ResponseEntity<?> updateMemberRole(@PathVariable("id") int membershipId, @RequestBody Map<String, String> body, HttpServletRequest request) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.TEAM_UPDATE_ROLE)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        String role = body.get("role");
        teamService.updateMemberRole(membershipId, role, user, request);

        return ResponseEntity.ok(Map.of("message", "Role updated successfully"));
    }

    // ====================================
    // UPDATE MEMBER STATUS
    // ====================================
    @PutMapping("/members/{id}/status")
    public ResponseEntity<?> updateMemberStatus(@PathVariable("id") int membershipId, @RequestBody Map<String, String> body, HttpServletRequest request) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.TEAM_DEACTIVATE)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        String status = body.get("status");
        teamService.updateMemberStatus(membershipId, status, user, request);

        return ResponseEntity.ok(Map.of("message", "Status updated successfully"));
    }

    // ====================================
    // INVITE MEMBER (POST)
    // ====================================
    @PostMapping("/invite")
    public ResponseEntity<?> inviteMember(@RequestBody Map<String, String> body, HttpServletRequest request) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.TEAM_INVITE)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        Map<String, Object> result = teamService.inviteMember(body, user, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    // ====================================
    // GET INVITATIONS
    // ====================================
    @GetMapping("/invitations")
    public ResponseEntity<?> getInvitations() {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.TEAM_VIEW)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        List<Map<String, Object>> invites = teamService.getInvitations(user);
        return ResponseEntity.ok(invites);
    }

    // ====================================
    // REVOKE INVITATION
    // ====================================
    @DeleteMapping("/invitations/{id}")
    public ResponseEntity<?> revokeInvitation(@PathVariable("id") int id, HttpServletRequest request) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.TEAM_INVITE)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        teamService.revokeInvitation(id, user, request);
        return ResponseEntity.ok(Map.of("message", "Invitation revoked successfully"));
    }

    // ====================================
    // GET INTERVIEWERS
    // ====================================
    @GetMapping("/interviewers")
    public ResponseEntity<?> getInterviewers() {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.TEAM_VIEW)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        List<Map<String, Object>> interviewers = teamService.getInterviewers(user);
        return ResponseEntity.ok(interviewers);
    }
}
