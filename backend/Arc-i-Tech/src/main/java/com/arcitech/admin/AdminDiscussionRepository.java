package com.arcitech.admin;

import com.arcitech.project.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AdminDiscussionRepository extends JpaRepository<AdminDiscussionMessage, Long> {
    List<AdminDiscussionMessage> findByContextOrderByCreatedAtDesc(AdminDiscussionContext context);
    List<AdminDiscussionMessage> findByProjectOrderByCreatedAtDesc(Project project);
    List<AdminDiscussionMessage> findByServiceCategoryOrderByCreatedAtDesc(String serviceCategory);
}
