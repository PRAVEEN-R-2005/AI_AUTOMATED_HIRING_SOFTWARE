package com.ats.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role;

    @Column(name = "created_at", insertable = false, updatable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    // Preference/Settings columns from migration
    @Column(length = 50)
    private String phone;

    @Column(name = "job_title", length = 100)
    private String jobTitle;

    @Column(length = 100)
    private String timezone = "UTC";

    @Column(length = 50)
    private String locale = "en-US";

    @Column(name = "default_landing_page", length = 100)
    private String defaultLandingPage = "/dashboard";

    @Column(name = "default_analytics_range", length = 50)
    private String defaultAnalyticsRange = "30_days";

    @Column(name = "default_candidate_view", length = 50)
    private String defaultCandidateView = "list";

    @Column(name = "default_pipeline_view", length = 50)
    private String defaultPipelineView = "kanban";

    @Column(length = 20)
    private String theme = "light";

    // Constructors
    public User() {}

    public User(String name, String email, String password, String role) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    // Getters and Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }

    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }

    public String getLocale() { return locale; }
    public void setLocale(String locale) { this.locale = locale; }

    public String getDefaultLandingPage() { return defaultLandingPage; }
    public void setDefaultLandingPage(String defaultLandingPage) { this.defaultLandingPage = defaultLandingPage; }

    public String getDefaultAnalyticsRange() { return defaultAnalyticsRange; }
    public void setDefaultAnalyticsRange(String defaultAnalyticsRange) { this.defaultAnalyticsRange = defaultAnalyticsRange; }

    public String getDefaultCandidateView() { return defaultCandidateView; }
    public void setDefaultCandidateView(String defaultCandidateView) { this.defaultCandidateView = defaultCandidateView; }

    public String getDefaultPipelineView() { return defaultPipelineView; }
    public void setDefaultPipelineView(String defaultPipelineView) { this.defaultPipelineView = defaultPipelineView; }

    public String getTheme() { return theme; }
    public void setTheme(String theme) { this.theme = theme; }
}
