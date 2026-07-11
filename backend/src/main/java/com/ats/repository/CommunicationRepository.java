package com.ats.repository;

import com.ats.entity.Communication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommunicationRepository extends JpaRepository<Communication, Integer> {
    List<Communication> findByOrganizationIdOrderByIdDesc(Integer organizationId);
}
