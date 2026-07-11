package com.ats.service;

import com.ats.entity.Notification;
import com.ats.entity.Membership;
import com.ats.entity.User;
import com.ats.repository.NotificationRepository;
import com.ats.repository.UserRepository;
import com.ats.repository.MembershipRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Service
@Transactional
public class Notifier {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MembershipRepository membershipRepository;

    /**
     * Inserts a notification record into the database for a specific user email.
     */
    public void createNotification(String email, String type, String priority, String title, String message) {
        try {
            Notification notification = new Notification();
            notification.setUserEmail(email != null ? email : "system@hiring.com");
            notification.setType(type);
            notification.setPriority(priority != null ? priority : "NORMAL");
            notification.setTitle(title);
            notification.setMessage(message);
            notification.setIsRead(false);

            notificationRepository.save(notification);
        } catch (Exception e) {
            System.err.println("Failed to create backend notification: " + e.getMessage());
        }
    }

    /**
     * Broadcasts a notification to all HR and Admin users (recruiters) in a specific organization.
     */
    public void notifyRecruiters(Integer orgId, String type, String priority, String title, String message) {
        try {
            if (orgId == null) return;
            List<Membership> memberships = membershipRepository.findActiveHRAndAdmins(orgId);
            for (Membership m : memberships) {
                createNotification(m.getUser().getEmail(), type, priority, title, message);
            }
        } catch (Exception e) {
            System.err.println("Failed to notify recruiters: " + e.getMessage());
        }
    }
}
