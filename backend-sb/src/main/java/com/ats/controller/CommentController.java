package com.ats.controller;

import com.ats.dto.CommentRequest;
import com.ats.entity.Comment;
import com.ats.security.CustomUserDetails;
import com.ats.service.CommentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    @Autowired
    private CommentService commentService;

    private CustomUserDetails getAuthenticatedUser() {
        if (SecurityContextHolder.getContext().getAuthentication() == null) return null;
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof CustomUserDetails) {
            return (CustomUserDetails) principal;
        }
        return null;
    }

    // ====================================
    // GET COMMENTS
    // ====================================
    @GetMapping("/{resourceType}/{resourceId}")
    public ResponseEntity<?> getComments(@PathVariable("resourceType") String resourceType, @PathVariable("resourceId") int resourceId) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        List<Map<String, Object>> response = commentService.getComments(resourceType, resourceId, user);
        return ResponseEntity.ok(response);
    }

    // ====================================
    // CREATE COMMENT (POST)
    // ====================================
    @PostMapping
    public ResponseEntity<?> createComment(@Valid @RequestBody CommentRequest body) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        Comment comment = commentService.createComment(body, user);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "commentId", comment.getId(),
                "message", "Comment posted successfully"
        ));
    }

    // ====================================
    // UPDATE COMMENT (PUT)
    // ====================================
    @PutMapping("/{id}")
    public ResponseEntity<?> updateComment(@PathVariable("id") int id, @RequestBody Map<String, String> body) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        String content = body.get("content");
        if (content == null || content.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Content cannot be empty"));
        }

        commentService.updateComment(id, content, user);
        return ResponseEntity.ok(Map.of("message", "Comment updated successfully"));
    }

    // ====================================
    // DELETE COMMENT
    // ====================================
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteComment(@PathVariable("id") int id, HttpServletRequest request) {
        CustomUserDetails user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        commentService.deleteComment(id, user, request);
        return ResponseEntity.ok(Map.of("message", "Comment deleted successfully"));
    }
}
