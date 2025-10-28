package com.arcitech.user.dto;

import jakarta.validation.constraints.NotNull;

public record UserStatusUpdateRequest(
        @NotNull(message = "Active flag is required")
        Boolean active
) {
}
