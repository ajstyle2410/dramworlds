package com.arcitech.project;

import com.arcitech.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectTaskRepository extends JpaRepository<ProjectTask, Long> {
    List<ProjectTask> findByProject(Project project);
    List<ProjectTask> findByAssignee(User assignee);
    List<ProjectTask> findByProjectAndStatus(Project project, TaskStatus status);
}
