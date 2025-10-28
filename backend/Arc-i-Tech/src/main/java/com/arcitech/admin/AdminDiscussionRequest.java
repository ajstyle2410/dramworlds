package com.arcitech.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AdminDiscussionRequest(
        @NotNull(message = "Context is mandatory")
        AdminDiscussionContext context,

        Long projectId,

        @Size(max = 160, message = "Service category label cannot exceed 160 characters")
        String serviceCategory,

        @NotBlank(message = "Subject is required")
        @Size(min = 3, max = 160)
        String subject,

        @NotBlank(message = "Message body is required")
        @Size(min = 5, max = 4000)
        String message,

        Double progressRatio
) {
}
