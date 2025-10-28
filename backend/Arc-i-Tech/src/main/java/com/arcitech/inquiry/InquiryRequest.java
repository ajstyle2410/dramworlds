package com.arcitech.inquiry;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record InquiryRequest(
        @NotBlank(message = "Full name is required")
        @Size(min = 3, max = 160)
        String fullName,

        @NotBlank(message = "Email is required")
        @Email
        String email,

        @Size(max = 50)
        String phone,

        @Size(max = 160)
        String company,

        @NotBlank(message = "Message is required")
        @Size(min = 10, max = 5000)
        String message,

        @Size(max = 255)
        String source,

        Long projectId
) {
}
