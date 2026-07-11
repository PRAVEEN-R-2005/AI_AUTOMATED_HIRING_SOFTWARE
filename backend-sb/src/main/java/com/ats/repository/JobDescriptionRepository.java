package com.ats.repository;

import com.ats.entity.JobDescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobDescriptionRepository extends JpaRepository<JobDescription, Integer> {
    List<JobDescription> findByCreatedByOrderByJdIdDesc(String email);
    List<JobDescription> findByStatusOrderByJdIdDesc(String status);
    List<JobDescription> findByOrganizationIdOrderByJdIdDesc(Integer organizationId);
    long countByOrganizationId(Integer organizationId);
    List<JobDescription> findTop5ByOrganizationIdAndStatusOrderByJdIdDesc(Integer organizationId, String status);
}
