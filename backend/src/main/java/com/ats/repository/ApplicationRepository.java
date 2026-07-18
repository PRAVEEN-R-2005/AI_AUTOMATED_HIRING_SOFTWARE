package com.ats.repository;

import com.ats.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Integer> {
    @EntityGraph(attributePaths = {"jobDescription"})
    List<Application> findByOrganizationIdOrderByIdDesc(Integer organizationId);

    @EntityGraph(attributePaths = {"jobDescription"})
    List<Application> findByJobDescriptionJdIdOrderByIdDesc(Integer jdId);

    @EntityGraph(attributePaths = {"jobDescription"})
    List<Application> findByEmailOrderByIdDesc(String email);
    
    @EntityGraph(attributePaths = {"jobDescription"})
    @Query("SELECT a FROM Application a WHERE a.organizationId = :orgId ORDER BY a.matchScore DESC")
    List<Application> findTopCandidates(@Param("orgId") Integer orgId);

    long countByOrganizationId(Integer organizationId);
    long countByOrganizationIdAndMatchScoreGreaterThanEqual(Integer organizationId, Integer matchScore);
    @EntityGraph(attributePaths = {"jobDescription"})
    List<Application> findTop5ByOrganizationIdOrderByIdDesc(Integer organizationId);

    @EntityGraph(attributePaths = {"jobDescription"})
    List<Application> findTop5ByOrganizationIdAndMatchScoreIsNotNullOrderByMatchScoreDesc(Integer organizationId);
    long countByJobDescriptionJdId(Integer jdId);
}
