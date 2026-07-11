package com.ats.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "organizations")
public class Organization {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(length = 50)
    private String status = "ACTIVE";

    @Column(name = "created_at", insertable = false, updatable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
    private LocalDateTime updatedAt;

    // Preference columns from migrations
    @Column(name = "logo_url", columnDefinition = "TEXT")
    private String logoUrl;

    private String industry;

    @Column(name = "company_size", length = 100)
    private String companySize;

    private String website;

    @Column(length = 100)
    private String timezone = "UTC";

    @Column(length = 50)
    private String locale = "en-US";

    @Column(name = "default_pipeline", length = 100)
    private String defaultPipeline = "Standard";

    @Column(name = "default_interview_duration")
    private Integer defaultInterviewDuration = 30;

    @Column(name = "default_interview_type", length = 100)
    private String defaultInterviewType = "Video";

    @Column(name = "default_application_stage", length = 100)
    private String defaultApplicationStage = "Applied";

    @Column(name = "default_analytics_range", length = 50)
    private String defaultAnalyticsRange = "30_days";

    // Constructors
    public Organization() {}

    public Organization(String name, String slug) {
        this.name = name;
        this.slug = slug;
    }

    // Getters and Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }

    public String getIndustry() { return industry; }
    public void setIndustry(String industry) { this.industry = industry; }

    public String getCompanySize() { return companySize; }
    public void setCompanySize(String companySize) { this.companySize = companySize; }

    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }

    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }

    public String getLocale() { return locale; }
    public void setLocale(String locale) { this.locale = locale; }

    public String getDefaultPipeline() { return defaultPipeline; }
    public void setDefaultPipeline(String defaultPipeline) { this.defaultPipeline = defaultPipeline; }

    public Integer getDefaultInterviewDuration() { return defaultInterviewDuration; }
    public void setDefaultInterviewDuration(Integer defaultInterviewDuration) { this.defaultInterviewDuration = defaultInterviewDuration; }

    public String getDefaultInterviewType() { return defaultInterviewType; }
    public void setDefaultInterviewType(String defaultInterviewType) { this.defaultInterviewType = defaultInterviewType; }

    public String getDefaultApplicationStage() { return defaultApplicationStage; }
    public void setDefaultApplicationStage(String defaultApplicationStage) { this.defaultApplicationStage = defaultApplicationStage; }

    public String getDefaultAnalyticsRange() { return defaultAnalyticsRange; }
    public void setDefaultAnalyticsRange(String defaultAnalyticsRange) { this.defaultAnalyticsRange = defaultAnalyticsRange; }
}
