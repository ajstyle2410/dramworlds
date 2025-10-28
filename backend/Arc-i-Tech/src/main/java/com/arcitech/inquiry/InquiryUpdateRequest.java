package com.arcitech.inquiry;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record InquiryUpdateRequest(
        @NotNull(message = "Status is required")
        InquiryStatus status,

        @Size(max = 160)
        String assignedTo
) {
}
