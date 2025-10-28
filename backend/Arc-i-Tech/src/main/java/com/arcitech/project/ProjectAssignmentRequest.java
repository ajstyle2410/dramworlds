package com.arcitech.project;

import com.arcitech.user.Role;
import jakarta.validation.constraints.NotNull;

public record ProjectAssignmentRequest(
        @NotNull(message = "Project id is required")
        Long projectId,

        @NotNull(message = "Member id is required")
        Long memberId,

        @NotNull(message = "Assignment role is required")
        Role assignmentRole
) {
}
