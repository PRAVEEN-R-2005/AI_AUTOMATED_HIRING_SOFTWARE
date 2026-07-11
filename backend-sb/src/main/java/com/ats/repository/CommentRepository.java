package com.ats.repository;

import com.ats.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Integer> {
    List<Comment> findByOrganizationIdAndResourceTypeAndResourceId(Integer organizationId, String resourceType, Integer resourceId);
}
