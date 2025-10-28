package com.arcitech.project;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record ProjectUpdateRequest(
        @NotNull(message = "Status is required")
        ProjectStatus status,

        @Min(value = 0, message = "Progress cannot be negative")
        @Max(value = 100, message = "Progress cannot exceed 100")
        Integer progressPercentage,

        LocalDate targetDate
) {
}
