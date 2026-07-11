package com.ats.service;

import com.ats.entity.Job;
import com.ats.repository.JobRepository;
import com.ats.exception.ResourceNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@Transactional
public class JobService {

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private AuditLogger auditLogger;

    public Job createJob(String title, String description, String skills, String experience,
                         String salary, String location, String employmentType, String jdFile,
                         Integer orgId, Integer userId, String email, HttpServletRequest request) {
        Job job = new Job();
        job.setTitle(title);
        job.setDescription(description);
        job.setSkills(skills);
        job.setExperience(experience);
        job.setSalary(salary);
        job.setLocation(location);
        job.setEmploymentType(employmentType);
        job.setJdFile(jdFile);
        job.setOrganizationId(orgId);
        job.setStatus("Pending");

        job = jobRepository.save(job);

        String username = email != null ? email.split("@")[0] : "system";
        auditLogger.logEvent(request, orgId, userId, username, email,
                "JOB", "JOB_CREATED", "JOB", job.getId(), "SUCCESS",
                Map.of("title", title, "location", location != null ? location : ""));

        return job;
    }

    public List<Job> getJobs(Integer orgId) {
        return jobRepository.findByOrganizationIdOrderByIdDesc(orgId);
    }

    public List<Job> getOpenJobs() {
        return jobRepository.findByStatusOrderByIdDesc("Open");
    }

    public void publishJob(int id, Integer orgId, Integer userId, String email, HttpServletRequest request) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));

        if (!job.getOrganizationId().equals(orgId)) {
            throw new AccessDeniedException("Access Denied: Cross-organization update blocked");
        }

        job.setStatus("Open");
        job.setPublishedBy("HR");
        jobRepository.save(job);

        String username = email != null ? email.split("@")[0] : "system";
        auditLogger.logEvent(request, orgId, userId, username, email,
                "JOB", "JOB_PUBLISHED", "JOB", id, "SUCCESS", Map.of("jobId", id));
    }

    public void closeJob(int id, Integer orgId, Integer userId, String email, HttpServletRequest request) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));

        if (!job.getOrganizationId().equals(orgId)) {
            throw new AccessDeniedException("Access Denied: Cross-organization update blocked");
        }

        job.setStatus("Closed");
        jobRepository.save(job);

        String username = email != null ? email.split("@")[0] : "system";
        auditLogger.logEvent(request, orgId, userId, username, email,
                "JOB", "JOB_CLOSED", "JOB", id, "SUCCESS", Map.of("jobId", id));
    }

    public void deleteJob(int id, Integer orgId, Integer userId, String email, HttpServletRequest request) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));

        if (!job.getOrganizationId().equals(orgId)) {
            throw new AccessDeniedException("Access Denied: Cross-organization deletion blocked");
        }

        jobRepository.delete(job);

        String username = email != null ? email.split("@")[0] : "system";
        auditLogger.logEvent(request, orgId, userId, username, email,
                "JOB", "JOB_DELETED", "JOB", id, "SUCCESS", Map.of("jobId", id));
    }
}
