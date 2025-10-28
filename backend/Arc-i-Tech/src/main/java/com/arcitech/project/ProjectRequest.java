package com.arcitech.project;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record ProjectRequest(
        @NotBlank(message = "Project name is required")
        @Size(min = 3, max = 160)
        String name,

        @NotBlank(message = "Summary is required")
        @Size(min = 10, max = 500)
        String summary,

        @Size(max = 5000)
        String details,

        @FutureOrPresent(message = "Target date cannot be in the past")
        LocalDate targetDate
) {
}
