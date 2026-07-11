package com.ats.repository;

import com.ats.entity.Membership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

@Repository
public interface MembershipRepository extends JpaRepository<Membership, Integer> {
    List<Membership> findByUserId(Integer userId);
    Optional<Membership> findByUserIdAndOrganizationId(Integer userId, Integer organizationId);

    @Query("SELECT m FROM Membership m JOIN FETCH m.user u WHERE m.organization.id = :orgId AND m.status = 'ACTIVE' AND m.role IN ('Admin', 'Recruiter', 'Hiring Manager', 'Interviewer', 'HR') ORDER BY u.name ASC")
    List<Membership> findActiveInterviewers(@Param("orgId") Integer orgId);

    @Query("SELECT m FROM Membership m JOIN FETCH m.user u WHERE m.organization.id = :orgId AND m.status = 'ACTIVE' AND m.role IN ('HR', 'Admin')")
    List<Membership> findActiveHRAndAdmins(@Param("orgId") Integer orgId);
}
