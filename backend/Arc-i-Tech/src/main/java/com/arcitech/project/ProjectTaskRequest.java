package com.arcitech.project;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record ProjectTaskRequest(
        @NotNull(message = "Project id is required")
        Long projectId,
        @NotBlank(message = "Title is required")
        String title,
        String description,
        TaskStatus status,
        TaskPriority priority,
        LocalDate dueDate,
        Long assigneeId,
        boolean clearDueDate
) {
}
