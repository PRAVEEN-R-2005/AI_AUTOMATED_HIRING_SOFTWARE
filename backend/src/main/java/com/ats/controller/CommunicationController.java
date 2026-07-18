package com.ats.controller;

import com.ats.entity.Communication;
import com.ats.entity.Application;
import com.ats.repository.CommunicationRepository;
import com.ats.repository.ApplicationRepository;
import com.ats.security.CustomUserDetails;
import com.ats.security.Permissions;
import com.ats.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/communications")
public class CommunicationController {

    @Autowired
    private CommunicationRepository communicationRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    private CustomUserDetails getAuthenticatedUser() {
        if (SecurityContextHolder.getContext().getAuthentication() == null) return null;
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof CustomUserDetails) {
            return (CustomUserDetails) principal;
        }
        return null;
    }

    @GetMapping("/{candidateId}")
    public ResponseEntity<?> getCommunications(@PathVariable("candidateId") int candidateId) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.COMMUNICATION_VIEW)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        Optional<Application> appOpt = applicationRepository.findById(candidateId);
        if (appOpt.isPresent()) {
            Integer appOrgId = appOpt.get().getOrganizationId();
            if (appOrgId != null && !appOrgId.equals(user.getOrganizationId())) {
                throw new AccessDeniedException("Access Denied: Cross-organization access blocked");
            }
        }

        List<Communication> list = communicationRepository.findByOrganizationIdOrderByIdDesc(user.getOrganizationId());
        List<Communication> filtered = new ArrayList<>();
        for (Communication c : list) {
            if (c.getCandidateId() != null && c.getCandidateId().equals(candidateId)) {
                filtered.add(c);
            }
        }

        return ResponseEntity.ok(filtered);
    }

    @PostMapping
    public ResponseEntity<?> logCommunication(@RequestBody Map<String, Object> body) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null || !Permissions.hasPermission(user.getRole(), Permissions.COMMUNICATION_SEND)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        Object candIdObj = body.get("candidate_id");
        String candidateName = (String) body.get("candidate_name");
        String type = (String) body.get("type");
        String subject = (String) body.get("subject");
        String message = (String) body.get("message");

        if (candIdObj == null || type == null || message == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Candidate ID, type, and message are required"));
        }

        int candidateId;
        try {
            candidateId = Integer.parseInt(candIdObj.toString());
        } catch (NumberFormatException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "candidate_id must be a valid number"));
        }

        Optional<Application> appOpt = applicationRepository.findById(candidateId);
        if (appOpt.isPresent()) {
            Integer appOrgId = appOpt.get().getOrganizationId();
            if (appOrgId != null && !appOrgId.equals(user.getOrganizationId())) {
                throw new AccessDeniedException("Access Denied: Cross-organization access blocked");
            }
        }

        Communication communication = new Communication();
        communication.setCandidateId(candidateId);
        communication.setCandidateName(candidateName);
        communication.setType(type);
        communication.setSubject(subject);
        communication.setMessage(message);
        communication.setDeliveryStatus("SENT");
        communication.setOrganizationId(user.getOrganizationId());

        communicationRepository.save(communication);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Communication logged successfully"));
    }
}
