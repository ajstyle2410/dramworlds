package com.arcitech.project;

import com.arcitech.user.User;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record ProjectResponse(
        Long id,
        String name,
        String summary,
        String details,
        ProjectStatus status,
        int progressPercentage,
        LocalDate startDate,
        LocalDate targetDate,
        boolean highlighted,
        Long clientId,
        String clientName,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {

    public static ProjectResponse from(Project project) {
        User client = project.getClient();
        return new ProjectResponse(
                project.getId(),
                project.getName(),
                project.getSummary(),
                project.getDetails(),
                project.getStatus(),
                project.getProgressPercentage(),
                project.getStartDate(),
                project.getTargetDate(),
                project.isHighlighted(),
                client != null ? client.getId() : null,
                client != null ? client.getFullName() : null,
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }
}
