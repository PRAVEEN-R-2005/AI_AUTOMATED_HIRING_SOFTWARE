package com.ats.repository;

import com.ats.entity.AiCandidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AiCandidateRepository extends JpaRepository<AiCandidate, Integer> {
}
