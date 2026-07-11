package com.ats.service;

import com.ats.entity.AuditLog;
import com.ats.repository.AuditLogRepository;
import com.ats.repository.OrganizationRepository;
import com.ats.repository.UserRepository;
import com.ats.security.CustomUserDetails;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@Transactional
public class AuditLogger {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    private static final ObjectMapper objectMapper = new ObjectMapper();

    public void logEvent(HttpServletRequest request, Integer organizationId, Integer actorId,
                         String actorName, String actorEmail, String eventCategory, String action,
                         String resourceType, Integer resourceId, String result, Map<String, Object> metadata) {
        try {
            Integer finalOrgId = organizationId;
            Integer finalActorId = actorId;
            String finalActorName = actorName;
            String finalActorEmail = actorEmail;
            String finalIp = null;
            String finalUa = null;

            if (request != null) {
                finalIp = request.getHeader("X-Forwarded-For");
                if (finalIp != null && finalIp.contains(",")) {
                    finalIp = finalIp.split(",")[0].trim();
                }
                if (finalIp == null) {
                    finalIp = request.getRemoteAddr();
                }
                finalUa = request.getHeader("User-Agent");
            }

            if (SecurityContextHolder.getContext().getAuthentication() != null) {
                Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
                if (principal instanceof CustomUserDetails) {
                    CustomUserDetails userDetails = (CustomUserDetails) principal;
                    if (finalOrgId == null) finalOrgId = userDetails.getOrganizationId();
                    if (finalActorId == null) finalActorId = userDetails.getId();
                    if (finalActorEmail == null) finalActorEmail = userDetails.getEmail();
                    if (finalActorName == null) finalActorName = userDetails.getUsername().split("@")[0];
                }
            }

            Map<String, Object> cleanMetadata = new HashMap<>();
            if (metadata != null) {
                for (Map.Entry<String, Object> entry : metadata.entrySet()) {
                    cleanMetadata.put(entry.getKey(), entry.getValue());
                }
            }
            String[] sensitiveKeys = {
                    "password", "password_hash", "token", "token_hash",
                    "currentpassword", "newpassword", "confirmpassword",
                    "secret", "apikey", "authorization", "cookie"
            };

            for (String key : cleanMetadata.keySet()) {
                String lowerKey = key.toLowerCase();
                for (String sk : sensitiveKeys) {
                    if (lowerKey.contains(sk)) {
                        cleanMetadata.put(key, "[REDACTED]");
                    }
                }
            }

            if (finalOrgId == null) finalOrgId = 1;
            if (finalActorEmail == null) finalActorEmail = "system@ats.com";
            if (finalActorName == null) {
                finalActorName = finalActorEmail.split("@")[0];
            }

            String metadataJson = objectMapper.writeValueAsString(cleanMetadata);

            AuditLog auditLog = new AuditLog();
            auditLog.setOrganization(organizationRepository.getReferenceById(finalOrgId));
            if (finalActorId != null) {
                auditLog.setActor(userRepository.getReferenceById(finalActorId));
            }
            auditLog.setActorName(finalActorName);
            auditLog.setActorEmail(finalActorEmail);
            auditLog.setEventCategory(eventCategory);
            auditLog.setAction(action);
            auditLog.setResourceType(resourceType);
            auditLog.setResourceId(resourceId);
            auditLog.setResult(result);
            auditLog.setIpAddress(finalIp);
            auditLog.setUserAgent(finalUa != null ? finalUa.substring(0, Math.min(finalUa.length(), 255)) : null);
            auditLog.setMetadata(metadataJson);

            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            System.err.println("CRITICAL: Failed to write audit event log: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
