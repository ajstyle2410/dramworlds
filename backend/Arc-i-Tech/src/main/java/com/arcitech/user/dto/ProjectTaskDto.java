package com.arcitech.user.dto;

import com.arcitech.project.TaskPriority;
import com.arcitech.project.TaskStatus;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record ProjectTaskDto(
        Long id,
        Long projectId,
        String projectName,
        String title,
        String description,
        TaskStatus status,
        TaskPriority priority,
        LocalDate dueDate,
        StaffSummary assignee,
        OffsetDateTime updatedAt
) {
}
