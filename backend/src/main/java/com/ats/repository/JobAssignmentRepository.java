package com.ats.repository;

import com.ats.entity.JobAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobAssignmentRepository extends JpaRepository<JobAssignment, Integer> {
    @EntityGraph(attributePaths = {"user"})
    List<JobAssignment> findByJobId(Integer jobId);
}
