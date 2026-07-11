package com.ats.service;

import com.ats.entity.*;
import com.ats.repository.*;
import com.ats.security.CustomUserDetails;
import com.ats.security.Permissions;
import com.ats.exception.ResourceNotFoundException;
import com.ats.dto.CommentRequest;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Transactional
public class CommentService {

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private MentionRepository mentionRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private JobAssignmentRepository jobAssignmentRepository;

    @Autowired
    private InterviewRepository interviewRepository;

    @Autowired
    private MembershipRepository membershipRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private Notifier notifier;

    @Autowired
    private AuditLogger auditLogger;

    public void verifyResourceAccess(String resourceType, int resourceId, CustomUserDetails user) {
        if (!"application".equalsIgnoreCase(resourceType)) {
            throw new IllegalArgumentException("Unsupported resource type");
        }

        Application app = applicationRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

        if (app.getOrganizationId() != null && !app.getOrganizationId().equals(user.getOrganizationId())) {
            throw new AccessDeniedException("Access Denied: Cross-organization access blocked");
        }

        String role = user.getRole();
        if ("Admin".equalsIgnoreCase(role) || "HR".equalsIgnoreCase(role) || "Recruiter".equalsIgnoreCase(role)) {
            return;
        }

        if ("Hiring Manager".equalsIgnoreCase(role)) {
            boolean isAssigned = jobAssignmentRepository.findByJobId(app.getJobDescription().getJdId()).stream()
                    .anyMatch(a -> a.getUser().getId().equals(user.getId()) && "Hiring Manager".equalsIgnoreCase(a.getAssignedRole()));
            if (!isAssigned) {
                throw new AccessDeniedException("Access Denied: You are not assigned to this job requisition");
            }
        } else if ("Interviewer".equalsIgnoreCase(role)) {
            boolean hasInterview = interviewRepository.findByOrganizationIdOrderByIdDesc(user.getOrganizationId()).stream()
                    .anyMatch(iv -> (resourceId == iv.getCandidateId() || resourceId == iv.getApplicationId())
                            && user.getEmail().equalsIgnoreCase(iv.getInterviewer()));
            if (!hasInterview) {
                throw new AccessDeniedException("Access Denied: You do not have scheduled interviews with this candidate");
            }
        } else {
            throw new AccessDeniedException("Access Denied: Invalid role permissions");
        }
    }

    public List<Map<String, Object>> getComments(String resourceType, int resourceId, CustomUserDetails user) {
        verifyResourceAccess(resourceType, resourceId, user);

        List<Comment> comments = commentRepository.findByOrganizationIdAndResourceTypeAndResourceId(
                user.getOrganizationId(), resourceType, resourceId);

        List<Map<String, Object>> results = new ArrayList<>();
        for (Comment c : comments) {
            User author = c.getAuthor();
            String authorRole = "Member";
            
            // Fetch membership role
            Optional<Membership> mem = membershipRepository.findByUserIdAndOrganizationId(author.getId(), user.getOrganizationId());
            if (mem.isPresent()) {
                authorRole = mem.get().getRole();
            }

            Map<String, Object> map = new HashMap<>();
            map.put("id", c.getId());
            map.put("content", c.getContent());
            map.put("created_at", c.getCreatedAt());
            map.put("updated_at", c.getUpdatedAt());
            map.put("author_id", author.getId());
            map.put("author_name", author.getName());
            map.put("author_email", author.getEmail());
            map.put("author_role", authorRole);
            results.add(map);
        }

        results.sort(Comparator.comparing(a -> (Integer) a.get("id")));
        return results;
    }

    public Comment createComment(CommentRequest request, CustomUserDetails user) {
        String resourceType = request.getResourceType();
        int resourceId = request.getResourceId();
        String content = request.getContent().trim();

        verifyResourceAccess(resourceType, resourceId, user);

        Organization org = organizationRepository.findById(user.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));
        User author = userRepository.findById(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Author User not found"));

        Comment comment = new Comment();
        comment.setOrganization(org);
        comment.setResourceType(resourceType);
        comment.setResourceId(resourceId);
        comment.setAuthor(author);
        comment.setContent(content);

        comment = commentRepository.save(comment);
        final Comment savedComment = comment;

        // Parse Mentions
        Pattern mentionPattern = Pattern.compile("@([a-zA-Z0-9_\\.\\-\\+]+@[a-zA-Z0-9\\-]+\\.[a-zA-Z0-9\\-]+|\"[^\"]+\"|[a-zA-Z0-9_\\-]+)");
        Matcher matcher = mentionPattern.matcher(content);
        Set<String> processedEmails = new HashSet<>();

        while (matcher.find()) {
            String identifier = matcher.group(1).replace("\"", "").trim();

            List<User> activeUsers = userRepository.findAll().stream()
                    .filter(u -> identifier.equalsIgnoreCase(u.getEmail()) || identifier.equalsIgnoreCase(u.getName()))
                    .collect(Collectors.toList());

            for (User u : activeUsers) {
                Optional<Membership> mem = membershipRepository.findByUserIdAndOrganizationId(u.getId(), user.getOrganizationId());
                if (mem.isPresent() && "ACTIVE".equalsIgnoreCase(mem.get().getStatus())) {
                    String mentionedEmail = u.getEmail();
                    if (!processedEmails.contains(mentionedEmail)) {
                        processedEmails.add(mentionedEmail);

                        // Save mention
                        Mention mention = new Mention(savedComment, u);
                        mentionRepository.save(mention);

                        String senderName = user.getEmail().split("@")[0];
                        String commentSnippet = content.length() > 60 ? content.substring(0, 60) + "..." : content;
                        String messageText = String.format("%s mentioned you in a candidate comment: \"%s\"", senderName, commentSnippet);

                        notifier.createNotification(mentionedEmail, "MENTION", "HIGH", "New Collaboration Mention", messageText);
                    }
                }
            }
        }

        return comment;
    }

    public void updateComment(int id, String content, CustomUserDetails user) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        if (!comment.getOrganization().getId().equals(user.getOrganizationId())) {
            throw new AccessDeniedException("Access Denied: Cross-organization modification blocked");
        }

        // Ownership enforcement (unless Admin)
        if (!"Admin".equalsIgnoreCase(user.getRole()) && !comment.getAuthor().getId().equals(user.getId())) {
            throw new AccessDeniedException("Access Denied: You cannot modify comments posted by another user");
        }

        comment.setContent(content.trim());
        commentRepository.save(comment);
    }

    public void deleteComment(int id, CustomUserDetails user, HttpServletRequest request) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        if (!comment.getOrganization().getId().equals(user.getOrganizationId())) {
            throw new AccessDeniedException("Access Denied: Cross-organization deletion blocked");
        }

        boolean isAdmin = "Admin".equalsIgnoreCase(user.getRole()) || "HR".equalsIgnoreCase(user.getRole());
        boolean isOwner = comment.getAuthor().getId().equals(user.getId());

        if (!isAdmin && !isOwner) {
            throw new AccessDeniedException("Access Denied: You do not have permissions to delete this comment");
        }

        commentRepository.delete(comment);

        auditLogger.logEvent(request, user.getOrganizationId(), user.getId(), user.getUsername().split("@")[0], user.getEmail(),
                "COLLABORATION", "COMMENT_DELETED", "COMMENT", id, "SUCCESS", Map.of("commentId", id));
    }
}
