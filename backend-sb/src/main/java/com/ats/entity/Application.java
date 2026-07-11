package com.ats.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "applications")
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "candidate_name", nullable = false)
    private String candidateName;

    @Column(nullable = false)
    private String email;

    @Column(length = 50)
    private String phone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id")
    private JobDescription jobDescription;

    @Column(name = "resume_file")
    private String resumeFile;

    @Column(length = 50)
    private String status = "Pending";

    @Column(name = "match_score")
    private Integer matchScore;

    @Column(name = "created_at", insertable = false, updatable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    // AI screening and recruiter fields from migrations
    @Column(name = "recruiter_notes", columnDefinition = "TEXT")
    private String recruiterNotes;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "skills_score")
    private Integer skillsScore;

    @Column(name = "experience_score")
    private Integer experienceScore;

    @Column(name = "education_score")
    private Integer educationScore;

    @Column(name = "matched_skills", columnDefinition = "TEXT")
    private String matchedSkills;

    @Column(name = "missing_skills", columnDefinition = "TEXT")
    private String missingSkills;

    @Column(name = "additional_skills", columnDefinition = "TEXT")
    private String additionalSkills;

    @Column(name = "candidate_strengths", columnDefinition = "TEXT")
    private String candidateStrengths;

    @Column(name = "review_considerations", columnDefinition = "TEXT")
    private String reviewConsiderations;

    @Column(name = "ai_summary", columnDefinition = "TEXT")
    private String aiSummary;

    private String recommendation;

    @Column(name = "screening_status", length = 50)
    private String screeningStatus = "PENDING";

    @Column(name = "organization_id")
    private Integer organizationId;

    // Constructors
    public Application() {}

    // Getters and Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getCandidateName() { return candidateName; }
    public void setCandidateName(String candidateName) { this.candidateName = candidateName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public JobDescription getJobDescription() { return jobDescription; }
    public void setJobDescription(JobDescription jobDescription) { this.jobDescription = jobDescription; }

    public String getResumeFile() { return resumeFile; }
    public void setResumeFile(String resumeFile) { this.resumeFile = resumeFile; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getMatchScore() { return matchScore; }
    public void setMatchScore(Integer matchScore) { this.matchScore = matchScore; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getRecruiterNotes() { return recruiterNotes; }
    public void setRecruiterNotes(String recruiterNotes) { this.recruiterNotes = recruiterNotes; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public Integer getSkillsScore() { return skillsScore; }
    public void setSkillsScore(Integer skillsScore) { this.skillsScore = skillsScore; }

    public Integer getExperienceScore() { return experienceScore; }
    public void setExperienceScore(Integer experienceScore) { this.experienceScore = experienceScore; }

    public Integer getEducationScore() { return educationScore; }
    public void setEducationScore(Integer educationScore) { this.educationScore = educationScore; }

    public String getMatchedSkills() { return matchedSkills; }
    public void setMatchedSkills(String matchedSkills) { this.matchedSkills = matchedSkills; }

    public String getMissingSkills() { return missingSkills; }
    public void setMissingSkills(String missingSkills) { this.missingSkills = missingSkills; }

    public String getAdditionalSkills() { return additionalSkills; }
    public void setAdditionalSkills(String additionalSkills) { this.additionalSkills = additionalSkills; }

    public String getCandidateStrengths() { return candidateStrengths; }
    public void setCandidateStrengths(String candidateStrengths) { this.candidateStrengths = candidateStrengths; }

    public String getReviewConsiderations() { return reviewConsiderations; }
    public void setReviewConsiderations(String reviewConsiderations) { this.reviewConsiderations = reviewConsiderations; }

    public String getAiSummary() { return aiSummary; }
    public void setAiSummary(String aiSummary) { this.aiSummary = aiSummary; }

    public String getRecommendation() { return recommendation; }
    public void setRecommendation(String recommendation) { this.recommendation = recommendation; }

    public String getScreeningStatus() { return screeningStatus; }
    public void setScreeningStatus(String screeningStatus) { this.screeningStatus = screeningStatus; }

    public Integer getOrganizationId() { return organizationId; }
    public void setOrganizationId(Integer organizationId) { this.organizationId = organizationId; }
}
