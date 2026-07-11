package com.ats.service;

import com.ats.entity.*;
import com.ats.repository.*;
import com.ats.security.JwtTokenProvider;
import com.ats.exception.EmailAlreadyExistsException;
import com.ats.dto.LoginRequest;
import com.ats.dto.RegisterRequest;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private MembershipRepository membershipRepository;

    @Autowired
    private InvitationRepository invitationRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private AuditLogger auditLogger;

    @Value("${app.demo-mode:true}")
    private boolean demoMode;

    @Value("${app.node-env:development}")
    private String nodeEnv;

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

    public Map<String, Object> registerUser(RegisterRequest request, HttpServletRequest servletRequest) {
        String name = request.getName().trim();
        String email = request.getEmail().trim().toLowerCase();
        String password = request.getPassword();
        String role = request.getRole();
        String invitationToken = request.getInvitationToken();

        if (password.length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters long");
        }

        String hashedPassword = passwordEncoder.encode(password);

        if (invitationToken != null && !invitationToken.trim().isEmpty()) {
            // ACCEPTING AN INVITATION FLOW
            String tokenHash = hashToken(invitationToken);
            Invitation invitation = invitationRepository.findByTokenHashAndStatus(tokenHash, "PENDING")
                    .orElseThrow(() -> new IllegalArgumentException("Invalid or expired invitation token"));

            if (invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
                invitation.setStatus("EXPIRED");
                invitationRepository.save(invitation);
                throw new IllegalArgumentException("This invitation has expired. Please contact your administrator.");
            }

            String finalEmail = invitation.getEmail();
            String finalRole = invitation.getRole();
            Organization organization = invitation.getOrganization();

            if (userRepository.findByEmail(finalEmail).isPresent()) {
                throw new EmailAlreadyExistsException("An account with this email already exists");
            }

            // Create User
            User newUser = new User(name, finalEmail, hashedPassword, finalRole);
            newUser = userRepository.save(newUser);

            // Create Membership
            Membership membership = new Membership(newUser, organization, finalRole);
            membershipRepository.save(membership);

            // Mark Invitation as Accepted
            invitation.setStatus("ACCEPTED");
            invitation.setAcceptedAt(LocalDateTime.now());
            invitationRepository.save(invitation);

            // Create Activity
            Activity activity = new Activity(null, null, "Member Joined", name + " joined the workspace via invitation", organization.getId());
            activityRepository.save(activity);

            // Log Audit
            auditLogger.logEvent(servletRequest, organization.getId(), newUser.getId(), name, finalEmail, "TEAM", "INVITATION_ACCEPTED", "USER", newUser.getId(), "SUCCESS", Map.of("email", finalEmail, "role", finalRole));

            return Map.of(
                    "success", true,
                    "message", "User Registered and Workspace Membership Created Successfully"
            );
        } else {
            // NORMAL REGISTRATION FLOW
            if (role == null) {
                throw new IllegalArgumentException("Role is required");
            }

            if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
                throw new IllegalArgumentException("Invalid email format");
            }

            List<String> allowedRoles = Arrays.asList("Admin", "HR", "Candidate", "Recruiter");
            if (!allowedRoles.contains(role)) {
                throw new IllegalArgumentException("Invalid role");
            }

            if ("Hiring Manager".equals(role) || "Interviewer".equals(role)) {
                throw new IllegalArgumentException("Hiring Managers and Interviewers must be invited to join a workspace");
            }

            if (userRepository.findByEmail(email).isPresent()) {
                throw new EmailAlreadyExistsException("An account with this email already exists");
            }

            // Create User
            User newUser = new User(name, email, hashedPassword, role);
            newUser = userRepository.save(newUser);

            if ("Admin".equals(role) || "HR".equals(role) || "Recruiter".equals(role)) {
                String orgName = name + "'s Workspace";
                String orgSlug = name.toLowerCase().replaceAll("[^a-z0-9]+", "-") + "-" + System.currentTimeMillis() % 10000;

                Organization organization = new Organization(orgName, orgSlug);
                organization = organizationRepository.save(organization);

                String orgRole = "HR".equals(role) ? "Recruiter" : role;
                Membership membership = new Membership(newUser, organization, orgRole);
                membershipRepository.save(membership);

                auditLogger.logEvent(servletRequest, organization.getId(), newUser.getId(), name, email, "AUTHENTICATION", "USER_REGISTERED", "USER", newUser.getId(), "SUCCESS", Map.of("email", email, "role", role, "organizationName", orgName));

                return Map.of(
                        "success", true,
                        "message", "User Registered and Workspace Initialized Successfully"
                );
            } else {
                // Candidate
                auditLogger.logEvent(servletRequest, null, newUser.getId(), name, email, "AUTHENTICATION", "USER_REGISTERED", "USER", newUser.getId(), "SUCCESS", Map.of("email", email, "role", role));
                return Map.of(
                        "success", true,
                        "message", "User Registered Successfully"
                );
            }
        }
    }

    public Map<String, Object> loginUser(LoginRequest request, HttpServletRequest servletRequest) {
        String email = request.getEmail().trim().toLowerCase();
        String password = request.getPassword().trim();

        // Backend bypass for demo mode
        boolean isDemoBypassAllowed = demoMode && !"production".equalsIgnoreCase(nodeEnv);
        if (isDemoBypassAllowed &&
                (("admin@gmail.com".equals(email) && "admin123".equals(password)) ||
                 ("hr@gmail.com".equals(email) && "123456".equals(password)) ||
                 ("candidate@gmail.com".equals(email) && "123456".equals(password)))) {

            String role = "Candidate";
            Integer orgId = null;
            int userId = 3;
            if ("admin@gmail.com".equals(email)) {
                role = "Admin";
                orgId = 1;
                userId = 1;
            } else if ("hr@gmail.com".equals(email)) {
                role = "Recruiter";
                orgId = 1;
                userId = 2;
            }

            String token = tokenProvider.generateToken(userId, role, email, orgId);

            auditLogger.logEvent(servletRequest, orgId, userId, email.split("@")[0], email,
                    "AUTHENTICATION", "LOGIN_SUCCESS", "USER", userId, "SUCCESS", Map.of("email", email, "role", role, "note", "Demo Bypass Credential Used"));

            return Map.of(
                    "success", true,
                    "message", "Login Successful",
                    "token", token,
                    "role", role,
                    "email", email,
                    "organization_id", orgId != null ? orgId : ""
            );
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    auditLogger.logEvent(servletRequest, null, null, null, email, "AUTHENTICATION", "LOGIN_FAILURE", "USER", null, "FAILURE", Map.of("email", email, "reason", "User Not Found"));
                    return new IllegalArgumentException("User Not Found");
                });

        if (!passwordEncoder.matches(password, user.getPassword())) {
            auditLogger.logEvent(servletRequest, null, user.getId(), user.getName(), email, "AUTHENTICATION", "LOGIN_FAILURE", "USER", user.getId(), "FAILURE", Map.of("email", email, "reason", "Incorrect password"));
            throw new IllegalArgumentException("Invalid Password");
        }

        // Fetch organization details
        List<Membership> memberships = membershipRepository.findByUserId(user.getId());
        String activeRole = user.getRole();
        Integer orgId = null;

        if (!memberships.isEmpty()) {
            Membership membership = memberships.get(0);
            if (!"Candidate".equals(user.getRole()) && !"ACTIVE".equals(membership.getStatus())) {
                auditLogger.logEvent(servletRequest, membership.getOrganization().getId(), user.getId(), user.getName(), email, "AUTHENTICATION", "LOGIN_FAILURE", "USER", user.getId(), "FAILURE", Map.of("email", email, "reason", "Membership is deactivated"));
                throw new AccessDeniedException("Access Denied: Your account is deactivated.");
            }
            activeRole = membership.getRole();
            orgId = membership.getOrganization().getId();
        }

        String token = tokenProvider.generateToken(user.getId(), activeRole, email, orgId);

        auditLogger.logEvent(servletRequest, orgId, user.getId(), user.getName(), email,
                "AUTHENTICATION", "LOGIN_SUCCESS", "USER", user.getId(), "SUCCESS", Map.of("email", email, "role", activeRole));

        return Map.of(
                "success", true,
                "message", "Login Successful",
                "token", token,
                "role", activeRole,
                "email", email,
                "organization_id", orgId != null ? orgId : ""
        );
    }
}
