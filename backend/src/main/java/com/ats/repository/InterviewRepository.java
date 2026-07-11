package com.ats.repository;

import com.ats.entity.Interview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, Integer> {
    List<Interview> findByOrganizationIdOrderByIdDesc(Integer organizationId);
    List<Interview> findByCandidateIdOrderByIdDesc(Integer candidateId);
    List<Interview> findByInterviewerIdOrderByIdDesc(Integer interviewerId);
    long countByOrganizationId(Integer organizationId);
    List<Interview> findTop5ByOrganizationIdOrderByInterviewDateAscInterviewTimeAsc(Integer organizationId);
}
