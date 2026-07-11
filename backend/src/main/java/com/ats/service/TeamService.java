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

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class TeamService {

    @Autowired
    private MembershipRepository membershipRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private InvitationRepository invitationRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private AuditLogger auditLogger;

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public List<Map<String, Object>> getMembers(String search, String role, String status, CustomUserDetails user) {
        Integer orgId = user.getOrganizationId();
        List<Membership> memberships = membershipRepository.findByUserId(user.getId()); // loose mock context filter
        
        List<Membership> allMembers = membershipRepository.findAll().stream()
                .filter(m -> m.getOrganization().getId().equals(orgId))
                .collect(Collectors.toList());

        List<Map<String, Object>> results = new ArrayList<>();
        for (Membership m : allMembers) {
            User u = m.getUser();
            if (u == null) continue;

            // Search filter
            if (search != null && !search.trim().isEmpty()) {
                String s = search.trim().toLowerCase();
                boolean matchesName = u.getName() != null && u.getName().toLowerCase().contains(s);
                boolean matchesEmail = u.getEmail() != null && u.getEmail().toLowerCase().contains(s);
                if (!matchesName && !matchesEmail) {
                    continue;
                }
            }

            // Role filter
            if (role != null && !"All".equalsIgnoreCase(role) && !m.getRole().equalsIgnoreCase(role)) {
                continue;
            }

            // Status filter
            if (status != null && !"All".equalsIgnoreCase(status) && !m.getStatus().equalsIgnoreCase(status)) {
                continue;
            }

            Map<String, Object> map = new HashMap<>();
            map.put("membership_id", m.getId());
            map.put("user_id", u.getId());
            map.put("name", u.getName());
            map.put("email", u.getEmail());
            map.put("role", m.getRole());
            map.put("status", m.getStatus());
            map.put("joined_at", m.getJoinedAt());
            results.add(map);
        }

        // Sort descending by membership ID
        results.sort((a, b) -> ((Integer) b.get("membership_id")).compareTo((Integer) a.get("membership_id")));
        return results;
    }

    public void updateMemberRole(int membershipId, String role, CustomUserDetails user, HttpServletRequest request) {
        List<String> allowedRoles = Arrays.asList("Admin", "Recruiter", "Hiring Manager", "Interviewer");
        if (!allowedRoles.contains(role)) {
            throw new IllegalArgumentException("Invalid role");
        }

        Membership member = membershipRepository.findById(membershipId)
                .orElseThrow(() -> new ResourceNotFoundException("Membership not found"));

        if (!member.getOrganization().getId().equals(user.getOrganizationId())) {
            throw new AccessDeniedException("Access Denied: Cross-organization modification blocked");
        }

        String oldRole = member.getRole();
        int memberUserId = member.getUser().getId();

        if ("Admin".equalsIgnoreCase(oldRole) && !"Admin".equalsIgnoreCase(role)) {
            // Verify last active Admin safety
            long count = membershipRepository.findAll().stream()
                    .filter(m -> m.getOrganization().getId().equals(user.getOrganizationId())
                            && "Admin".equalsIgnoreCase(m.getRole())
                            && "ACTIVE".equalsIgnoreCase(m.getStatus()))
                    .count();
            if (count <= 1) {
                throw new IllegalArgumentException("Access Denied: Cannot change the role of the last active Admin");
            }
        }

        member.setRole(role);
        membershipRepository.save(member);

        auditLogger.logEvent(request, user.getOrganizationId(), user.getId(), user.getUsername().split("@")[0], user.getEmail(),
                "TEAM", "MEMBER_ROLE_CHANGED", "USER", memberUserId, "SUCCESS", Map.of("memberUserId", memberUserId, "oldRole", oldRole, "newRole", role));
    }

    public void updateMemberStatus(int membershipId, String status, CustomUserDetails user, HttpServletRequest request) {
        List<String> allowedStatus = Arrays.asList("ACTIVE", "DEACTIVATED");
        if (!allowedStatus.contains(status.toUpperCase())) {
            throw new IllegalArgumentException("Invalid status value");
        }

        Membership member = membershipRepository.findById(membershipId)
                .orElseThrow(() -> new ResourceNotFoundException("Membership not found"));

        if (!member.getOrganization().getId().equals(user.getOrganizationId())) {
            throw new AccessDeniedException("Access Denied: Cross-organization modification blocked");
        }

        if (member.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Access Denied: You cannot modify your own membership status");
        }

        String oldStatus = member.getStatus();
        int memberUserId = member.getUser().getId();

        if ("Admin".equalsIgnoreCase(member.getRole()) && "DEACTIVATED".equalsIgnoreCase(status)) {
            // Verify last active Admin safety
            long count = membershipRepository.findAll().stream()
                    .filter(m -> m.getOrganization().getId().equals(user.getOrganizationId())
                            && "Admin".equalsIgnoreCase(m.getRole())
                            && "ACTIVE".equalsIgnoreCase(m.getStatus()))
                    .count();
            if (count <= 1) {
                throw new IllegalArgumentException("Access Denied: Cannot deactivate the last active Admin");
            }
        }

        member.setStatus(status.toUpperCase());
        membershipRepository.save(member);

        auditLogger.logEvent(request, user.getOrganizationId(), user.getId(), user.getUsername().split("@")[0], user.getEmail(),
                "TEAM", "MEMBER_STATUS_CHANGED", "USER", memberUserId, "SUCCESS", Map.of("memberUserId", memberUserId, "oldStatus", oldStatus, "newStatus", status.toUpperCase()));
    }

    public Map<String, Object> inviteMember(Map<String, String> body, CustomUserDetails user, HttpServletRequest request) {
        String inviteEmail = body.get("email");
        String role = body.get("role");

        if (inviteEmail == null || inviteEmail.trim().isEmpty() || role == null) {
            throw new IllegalArgumentException("Email and role are required");
        }

        final String targetEmail = inviteEmail.trim().toLowerCase();
        if (!targetEmail.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new IllegalArgumentException("Invalid email format");
        }

        List<String> allowedRoles = Arrays.asList("Admin", "Recruiter", "Hiring Manager", "Interviewer");
        if (!allowedRoles.contains(role)) {
            throw new IllegalArgumentException("Invalid role");
        }

        // Check if user is already a member
        Optional<User> existingUserOpt = userRepository.findByEmail(targetEmail);
        if (existingUserOpt.isPresent()) {
            boolean isMember = membershipRepository.findByUserId(existingUserOpt.get().getId()).stream()
                    .anyMatch(m -> m.getOrganization().getId().equals(user.getOrganizationId()));
            if (isMember) {
                throw new IllegalArgumentException("User is already a member of this workspace");
            }
        }

        // Check if there is a pending invite
        long pendingCount = invitationRepository.findAll().stream()
                .filter(i -> i.getOrganization().getId().equals(user.getOrganizationId())
                        && i.getEmail().equalsIgnoreCase(targetEmail)
                        && "PENDING".equalsIgnoreCase(i.getStatus())
                        && i.getExpiresAt().isAfter(LocalDateTime.now()))
                .count();

        if (pendingCount > 0) {
            throw new IllegalArgumentException("A pending invitation has already been sent to this email address.");
        }

        String rawToken = generateSecureToken();
        String tokenHash = hashToken(rawToken);
        LocalDateTime expiresAt = LocalDateTime.now().plusDays(7);

        Organization org = organizationRepository.findById(user.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));
        User inviter = userRepository.findById(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Inviter User not found"));

        Invitation invite = new Invitation();
        invite.setOrganization(org);
        invite.setEmail(inviteEmail);
        invite.setRole(role);
        invite.setTokenHash(tokenHash);
        invite.setInvitedBy(inviter);
        invite.setStatus("PENDING");
        invite.setExpiresAt(expiresAt);

        invitationRepository.save(invite);

        auditLogger.logEvent(request, user.getOrganizationId(), user.getId(), user.getUsername().split("@")[0], user.getEmail(),
                "TEAM", "INVITATION_SENT", "INVITATION", invite.getId(), "SUCCESS", Map.of("invitedEmail", inviteEmail, "invitedRole", role));

        // For frontend integration, return the token so it can build the registration link
        return Map.of(
                "success", true,
                "message", "Invitation generated successfully",
                "invitation", Map.of(
                        "email", inviteEmail,
                        "role", role,
                        "token", rawToken,
                        "expiresAt", expiresAt
                )
        );
    }

    public List<Map<String, Object>> getInvitations(CustomUserDetails user) {
        List<Invitation> invites = invitationRepository.findAll().stream()
                .filter(i -> i.getOrganization().getId().equals(user.getOrganizationId()))
                .collect(Collectors.toList());

        List<Map<String, Object>> results = new ArrayList<>();
        for (Invitation i : invites) {
            // Auto-expire
            if ("PENDING".equalsIgnoreCase(i.getStatus()) && i.getExpiresAt().isBefore(LocalDateTime.now())) {
                i.setStatus("EXPIRED");
                invitationRepository.save(i);
            }

            Map<String, Object> map = new HashMap<>();
            map.put("id", i.getId());
            map.put("email", i.getEmail());
            map.put("role", i.getRole());
            map.put("status", i.getStatus());
            map.put("expires_at", i.getExpiresAt());
            map.put("created_at", i.getCreatedAt());
            map.put("invited_by_name", i.getInvitedBy() != null ? i.getInvitedBy().getName() : "System");
            results.add(map);
        }

        results.sort((a, b) -> ((Integer) b.get("id")).compareTo((Integer) a.get("id")));
        return results;
    }

    public void revokeInvitation(int id, CustomUserDetails user, HttpServletRequest request) {
        Invitation invite = invitationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation not found"));

        if (!invite.getOrganization().getId().equals(user.getOrganizationId())) {
            throw new AccessDeniedException("Access Denied: Cross-organization invitation modification blocked");
        }

        if (!"PENDING".equalsIgnoreCase(invite.getStatus())) {
            throw new IllegalArgumentException("Only pending invitations can be revoked");
        }

        invite.setStatus("REVOKED");
        invitationRepository.save(invite);

        auditLogger.logEvent(request, user.getOrganizationId(), user.getId(), user.getUsername().split("@")[0], user.getEmail(),
                "TEAM", "INVITATION_REVOKED", "INVITATION", id, "SUCCESS", Map.of("invitedEmail", invite.getEmail()));
    }

    public List<Map<String, Object>> getInterviewers(CustomUserDetails user) {
        List<Membership> memberships = membershipRepository.findActiveInterviewers(user.getOrganizationId());
        List<Map<String, Object>> results = new ArrayList<>();
        for (Membership m : memberships) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", m.getUser().getId());
            map.put("name", m.getUser().getName());
            map.put("email", m.getUser().getEmail());
            map.put("role", m.getRole());
            results.add(map);
        }
        return results;
    }
}
