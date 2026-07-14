package com.ats.controller;

import com.ats.entity.Notification;
import com.ats.repository.NotificationRepository;
import com.ats.security.CustomUserDetails;
import com.ats.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    private CustomUserDetails getAuthenticatedUser() {
        if (SecurityContextHolder.getContext().getAuthentication() == null) return null;
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof CustomUserDetails) {
            return (CustomUserDetails) principal;
        }
        return null;
    }

    @GetMapping
    public ResponseEntity<?> getNotifications() {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        List<Notification> list = notificationRepository.findByUserEmailOrderByIdDesc(user.getEmail()).stream()
                .limit(50)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount() {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        long count = notificationRepository.findByUserEmailOrderByIdDesc(user.getEmail()).stream()
                .filter(n -> n.getIsRead() != null && !n.getIsRead())
                .count();

        return ResponseEntity.ok(Map.of("count", count));
    }

    @PutMapping("/read/{id}")
    public ResponseEntity<?> markRead(@PathVariable("id") int id) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        if (!user.getEmail().equalsIgnoreCase(notification.getUserEmail())) {
            throw new AccessDeniedException("Access Denied");
        }

        notification.setIsRead(true);
        notificationRepository.save(notification);

        return ResponseEntity.ok(Map.of("message", "Notification marked as read"));
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllRead() {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        List<Notification> list = notificationRepository.findByUserEmailOrderByIdDesc(user.getEmail()).stream()
                .filter(n -> n.getIsRead() != null && !n.getIsRead())
                .collect(Collectors.toList());

        for (Notification n : list) {
            n.setIsRead(true);
        }

        notificationRepository.saveAll(list);

        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }
}
