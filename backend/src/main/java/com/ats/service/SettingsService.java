package com.ats.service;

import com.ats.entity.*;
import com.ats.repository.*;
import com.ats.security.CustomUserDetails;
import com.ats.exception.ResourceNotFoundException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class SettingsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuditLogger auditLogger;

    @PersistenceContext
    private EntityManager entityManager;

    private static final ObjectMapper objectMapper = new ObjectMapper();

    public User getProfile(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public void updateProfile(Map<String, String> body, CustomUserDetails user, HttpServletRequest request) {
        String name = body.get("name");
        String phone = body.get("phone");
        String jobTitle = body.get("job_title");
        String timezone = body.get("timezone");
        String locale = body.get("locale");
        String defaultLandingPage = body.get("default_landing_page");
        String defaultAnalyticsRange = body.get("default_analytics_range");
        String defaultCandidateView = body.get("default_candidate_view");
        String defaultPipelineView = body.get("default_pipeline_view");
        String theme = body.get("theme");

        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Name is required");
        }
        if (name.trim().length() < 2 || name.trim().length() > 100) {
            throw new IllegalArgumentException("Name must be between 2 and 100 characters");
        }
        if (phone != null && phone.trim().length() > 20) {
            throw new IllegalArgumentException("Phone number cannot exceed 20 characters");
        }

        List<String> allowedLandingPages = Arrays.asList("/dashboard", "/jobs", "/applications", "/candidates", "/interviews", "/analytics", "/team", "/settings", "/student-dashboard", "/available-jobs", "/my-applications");
        if (defaultLandingPage != null && !allowedLandingPages.contains(defaultLandingPage)) {
            throw new IllegalArgumentException("Invalid default landing page route");
        }

        List<String> allowedRanges = Arrays.asList("7_days", "30_days", "90_days");
        if (defaultAnalyticsRange != null && !allowedRanges.contains(defaultAnalyticsRange)) {
            throw new IllegalArgumentException("Invalid default analytics date range");
        }

        if (theme != null && !"light".equalsIgnoreCase(theme) && !"dark".equalsIgnoreCase(theme)) {
            throw new IllegalArgumentException("Theme must be either light or dark");
        }

        User u = userRepository.findByEmail(user.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        u.setName(name.trim());
        u.setPhone(phone != null ? phone.trim() : null);
        u.setJobTitle(jobTitle != null ? jobTitle.trim() : null);
        u.setTimezone(timezone != null ? timezone : "UTC");
        u.setLocale(locale != null ? locale : "en-US");
        u.setDefaultLandingPage(defaultLandingPage != null ? defaultLandingPage : "/dashboard");
        u.setDefaultAnalyticsRange(defaultAnalyticsRange != null ? defaultAnalyticsRange : "30_days");
        u.setDefaultCandidateView(defaultCandidateView != null ? defaultCandidateView : "list");
        u.setDefaultPipelineView(defaultPipelineView != null ? defaultPipelineView : "kanban");
        u.setTheme(theme != null ? theme : "light");

        userRepository.save(u);

        auditLogger.logEvent(request, user.getOrganizationId(), user.getId(), user.getUsername().split("@")[0], user.getEmail(),
                "SETTINGS", "USER_PROFILE_UPDATED", "USER", user.getId(), "SUCCESS", Map.of("name", name.trim(), "email", user.getEmail()));
    }

    public void changePassword(String currentPassword, String newPassword, CustomUserDetails user, HttpServletRequest request) {
        if (currentPassword == null || newPassword == null) {
            throw new IllegalArgumentException("Both current and new password are required");
        }
        if (newPassword.length() < 6) {
            throw new IllegalArgumentException("New password must be at least 6 characters");
        }

        User u = userRepository.findByEmail(user.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(currentPassword, u.getPassword())) {
            auditLogger.logEvent(request, user.getOrganizationId(), user.getId(), user.getUsername().split("@")[0], user.getEmail(),
                    "SECURITY", "PASSWORD_CHANGE_FAILED", "USER", user.getId(), "FAILURE", Map.of("reason", "Incorrect current password"));
            throw new IllegalArgumentException("Current password is incorrect");
        }

        u.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(u);

        auditLogger.logEvent(request, user.getOrganizationId(), user.getId(), user.getUsername().split("@")[0], user.getEmail(),
                "SECURITY", "PASSWORD_CHANGED", "USER", user.getId(), "SUCCESS", Map.of());
    }

    public Organization getOrganization(Integer orgId) {
        if (orgId == null) {
            throw new IllegalArgumentException("User does not belong to an active organization workspace");
        }
        return organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization workspace not found"));
    }

    public void updateOrganization(Map<String, Object> body, CustomUserDetails user, HttpServletRequest request) {
        int orgId = user.getOrganizationId();
        String name = (String) body.get("name");
        String slug = (String) body.get("slug");
        String logoUrl = (String) body.get("logo_url");
        String industry = (String) body.get("industry");
        String companySize = (String) body.get("company_size");
        String website = (String) body.get("website");
        String timezone = (String) body.get("timezone");
        String locale = (String) body.get("locale");
        String defaultPipeline = (String) body.get("default_pipeline");
        Object durationObj = body.get("default_interview_duration");
        String defaultInterviewType = (String) body.get("default_interview_type");
        String defaultApplicationStage = (String) body.get("default_application_stage");
        String defaultAnalyticsRange = (String) body.get("default_analytics_range");

        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Organization name is required");
        }
        if (slug == null || slug.trim().isEmpty()) {
            throw new IllegalArgumentException("Organization slug is required");
        }

        String cleanSlug = slug.trim().toLowerCase();
        if (!cleanSlug.matches("^[a-z0-9-]+$")) {
            throw new IllegalArgumentException("Slug must contain only lowercase alphanumeric characters and hyphens");
        }

        if (website != null && !website.trim().isEmpty()) {
            if (!website.trim().matches("^(https?://)?([\\da-z\\.-]+)\\.([a-z\\.]{2,6})([/\\w \\.-]*)*\\/?$")) {
                throw new IllegalArgumentException("Invalid company website URL format");
            }
        }

        // Uniqueness check
        Optional<Organization> existing = organizationRepository.findBySlug(cleanSlug);
        if (existing.isPresent() && !existing.get().getId().equals(orgId)) {
            throw new IllegalStateException("This workspace slug is already taken");
        }

        int duration = 30;
        if (durationObj != null) {
            try {
                duration = Integer.parseInt(durationObj.toString());
            } catch (Exception e) {}
        }

        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        org.setName(name.trim());
        org.setSlug(cleanSlug);
        org.setLogoUrl(logoUrl != null ? logoUrl.trim() : null);
        org.setIndustry(industry != null ? industry.trim() : null);
        org.setCompanySize(companySize != null ? companySize.trim() : null);
        org.setWebsite(website != null ? website.trim() : null);
        org.setTimezone(timezone != null ? timezone : "UTC");
        org.setLocale(locale != null ? locale : "en-US");
        org.setDefaultPipeline(defaultPipeline != null ? defaultPipeline : "Standard");
        org.setDefaultInterviewDuration(duration);
        org.setDefaultInterviewType(defaultInterviewType != null ? defaultInterviewType : "Video");
        org.setDefaultApplicationStage(defaultApplicationStage != null ? defaultApplicationStage : "Applied");
        org.setDefaultAnalyticsRange(defaultAnalyticsRange != null ? defaultAnalyticsRange : "30_days");

        organizationRepository.save(org);

        auditLogger.logEvent(request, orgId, user.getId(), user.getUsername().split("@")[0], user.getEmail(),
                "ORGANIZATION", "ORGANIZATION_UPDATED", "ORGANIZATION", orgId, "SUCCESS", Map.of("name", name.trim(), "slug", cleanSlug));
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getAuditLogs(int page, int limit, String search, String category, String result,
                                           String startDate, String endDate, CustomUserDetails user) {
        int offset = (page - 1) * limit;
        String whereClause = "WHERE organization_id = :orgId";

        if (category != null && !"All".equalsIgnoreCase(category)) {
            whereClause += " AND event_category = :category";
        }
        if (result != null && !"All".equalsIgnoreCase(result)) {
            whereClause += " AND result = :result";
        }
        if (startDate != null && !startDate.trim().isEmpty()) {
            whereClause += " AND created_at >= :startDate";
        }
        if (endDate != null && !endDate.trim().isEmpty()) {
            whereClause += " AND created_at <= :endDate";
        }
        if (search != null && !search.trim().isEmpty()) {
            whereClause += " AND (actor_name LIKE :search OR actor_email LIKE :search OR action LIKE :search OR resource_type LIKE :search)";
        }

        String countSql = "SELECT COUNT(*) FROM audit_logs " + whereClause;
        Query countQuery = entityManager.createNativeQuery(countSql);
        countQuery.setParameter("orgId", user.getOrganizationId());
        
        if (category != null && !"All".equalsIgnoreCase(category)) countQuery.setParameter("category", category);
        if (result != null && !"All".equalsIgnoreCase(result)) countQuery.setParameter("result", result);
        if (startDate != null && !startDate.trim().isEmpty()) countQuery.setParameter("startDate", startDate.trim());
        if (endDate != null && !endDate.trim().isEmpty()) countQuery.setParameter("endDate", endDate.trim());
        if (search != null && !search.trim().isEmpty()) countQuery.setParameter("search", "%" + search.trim() + "%");

        int total = ((Number) countQuery.getSingleResult()).intValue();

        String querySql = "SELECT id, actor_id, actor_name, actor_email, event_category, action, resource_type, resource_id, result, ip_address, user_agent, metadata, created_at " +
                "FROM audit_logs " + whereClause + " ORDER BY id DESC LIMIT :limit OFFSET :offset";
        Query query = entityManager.createNativeQuery(querySql);
        query.setParameter("orgId", user.getOrganizationId());
        query.setParameter("limit", limit);
        query.setParameter("offset", offset);

        if (category != null && !"All".equalsIgnoreCase(category)) query.setParameter("category", category);
        if (result != null && !"All".equalsIgnoreCase(result)) query.setParameter("result", result);
        if (startDate != null && !startDate.trim().isEmpty()) query.setParameter("startDate", startDate.trim());
        if (endDate != null && !endDate.trim().isEmpty()) query.setParameter("endDate", endDate.trim());
        if (search != null && !search.trim().isEmpty()) query.setParameter("search", "%" + search.trim() + "%");

        List<Object[]> rows = query.getResultList();
        List<Map<String, Object>> sanitized = new ArrayList<>();

        for (Object[] r : rows) {
            Map<String, Object> copy = new HashMap<>();
            copy.put("id", r[0]);
            copy.put("actor_id", r[1]);
            copy.put("actor_name", r[2]);
            copy.put("actor_email", r[3]);
            copy.put("event_category", r[4]);
            copy.put("action", r[5]);
            copy.put("resource_type", r[6]);
            copy.put("resource_id", r[7]);
            copy.put("result", r[8]);
            copy.put("ip_address", r[9]);
            copy.put("user_agent", r[10]);

            String metaStr = (String) r[11];
            Map<String, Object> metaObj = new HashMap<>();
            try {
                if (metaStr != null) {
                    metaObj = objectMapper.readValue(metaStr, Map.class);
                }
            } catch (Exception e) {
                metaObj.put("raw", metaStr);
            }
            copy.put("metadata", metaObj);
            copy.put("created_at", r[12]);
            sanitized.add(copy);
        }

        Map<String, Object> pagination = Map.of(
                "total", total,
                "page", page,
                "limit", limit,
                "pages", (int) Math.ceil((double) total / limit)
        );

        return Map.of("logs", sanitized, "pagination", pagination);
    }

    public List<User> listUsers() {
        return userRepository.findAll().stream()
                .sorted((a, b) -> b.getId().compareTo(a.getId()))
                .collect(Collectors.toList());
    }

    public User inviteUser(Map<String, String> body, CustomUserDetails user, HttpServletRequest request) {
        String name = body.get("name");
        String email = body.get("email");
        String password = body.get("password");
        String role = body.get("role");
        if (role == null) role = "HR";

        if (name == null || email == null || password == null) {
            throw new IllegalArgumentException("Name, email, and password are required");
        }

        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalStateException("A user with this email already exists");
        }

        String hashed = passwordEncoder.encode(password);
        User u = new User(name, email, hashed, role);
        u = userRepository.save(u);

        auditLogger.logEvent(request, user.getOrganizationId(), user.getId(), user.getUsername().split("@")[0], user.getEmail(),
                "TEAM", "MEMBER_INVITED", "USER", u.getId(), "SUCCESS", Map.of("invitedName", name, "invitedEmail", email, "role", role));

        return u;
    }

    public void deleteUser(int id, CustomUserDetails user, HttpServletRequest request) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getEmail().equalsIgnoreCase(u.getEmail())) {
            throw new IllegalArgumentException("Cannot delete your own account");
        }

        userRepository.delete(u);

        auditLogger.logEvent(request, user.getOrganizationId(), user.getId(), user.getUsername().split("@")[0], user.getEmail(),
                "TEAM", "MEMBER_REMOVED", "USER", id, "SUCCESS", Map.of("email", u.getEmail(), "name", u.getName()));
    }
}
