package com.ats.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "jobs")
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String skills;

    @Column(length = 100)
    private String experience;

    @Column(length = 100)
    private String salary;

    private String location;

    @Column(name = "employment_type", length = 100)
    private String employmentType;

    @Column(name = "jd_file")
    private String jdFile;

    @Column(length = 50)
    private String status = "Pending";

    @Column(name = "published_by", length = 50)
    private String publishedBy;

    @Column(name = "organization_id")
    private Integer organizationId;

    @Column(name = "created_at", insertable = false, updatable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    // Constructors
    public Job() {}

    // Getters and Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getSkills() { return skills; }
    public void setSkills(String skills) { this.skills = skills; }

    public String getExperience() { return experience; }
    public void setExperience(String experience) { this.experience = experience; }

    public String getSalary() { return salary; }
    public void setSalary(String salary) { this.salary = salary; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getEmploymentType() { return employmentType; }
    public void setEmploymentType(String employmentType) { this.employmentType = employmentType; }

    public String getJdFile() { return jdFile; }
    public void setJdFile(String jdFile) { this.jdFile = jdFile; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPublishedBy() { return publishedBy; }
    public void setPublishedBy(String publishedBy) { this.publishedBy = publishedBy; }

    public Integer getOrganizationId() { return organizationId; }
    public void setOrganizationId(Integer organizationId) { this.organizationId = organizationId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
