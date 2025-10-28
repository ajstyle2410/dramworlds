package com.arcitech.project;

import java.time.LocalDate;

public record ProjectTaskUpdateRequest(
        Long projectId,
        String title,
        String description,
        TaskStatus status,
        TaskPriority priority,
        LocalDate dueDate,
        Long assigneeId,
        boolean clearDueDate,
        boolean clearAssignee
) {
}
