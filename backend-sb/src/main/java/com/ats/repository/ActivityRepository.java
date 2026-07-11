package com.ats.repository;

import com.ats.entity.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Integer> {
    List<Activity> findByOrganizationIdOrderByIdDesc(Integer organizationId);
}
