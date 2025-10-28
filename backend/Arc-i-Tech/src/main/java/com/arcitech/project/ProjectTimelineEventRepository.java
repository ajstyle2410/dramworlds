package com.arcitech.project;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectTimelineEventRepository extends JpaRepository<ProjectTimelineEvent, Long> {
    List<ProjectTimelineEvent> findByProjectOrderByOccurredAtDesc(Project project);
}
