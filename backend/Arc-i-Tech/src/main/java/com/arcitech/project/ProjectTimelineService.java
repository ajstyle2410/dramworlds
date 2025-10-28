package com.arcitech.project;

import com.arcitech.user.dto.ProjectTimelineEventDto;
import com.arcitech.user.dto.StaffSummary;
import com.arcitech.user.User;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ProjectTimelineService {

    private final ProjectTimelineEventRepository timelineEventRepository;

    public ProjectTimelineEventDto recordEvent(Project project,
                                               TimelineEventType eventType,
                                               String title,
                                               String description,
                                               User actor) {
        ProjectTimelineEvent event = ProjectTimelineEvent.builder()
                .project(project)
                .eventType(eventType)
                .title(title)
                .description(description)
                .actor(actor)
                .build();
        return toDto(timelineEventRepository.save(event));
    }

    public List<ProjectTimelineEventDto> getTimeline(Project project) {
        return timelineEventRepository.findByProjectOrderByOccurredAtDesc(project).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private ProjectTimelineEventDto toDto(ProjectTimelineEvent event) {
        return new ProjectTimelineEventDto(
                event.getId(),
                event.getEventType(),
                event.getTitle(),
                event.getDescription(),
                event.getOccurredAt(),
                event.getActor() != null ? StaffSummary.from(event.getActor()) : null
        );
    }
}
