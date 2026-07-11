package com.ats.repository;

import com.ats.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobRepository extends JpaRepository<Job, Integer> {
    List<Job> findByOrganizationIdOrderByIdDesc(Integer organizationId);
    List<Job> findByStatusOrderByIdDesc(String status);
}
