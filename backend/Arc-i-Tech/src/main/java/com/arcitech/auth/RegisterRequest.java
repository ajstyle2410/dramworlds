package com.arcitech.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Full name is required")
        @Size(min = 3, max = 120, message = "Full name must be between 3 and 120 characters")
        String fullName,

        @NotBlank(message = "Email is required")
        @Email(message = "Please provide a valid email")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 120, message = "Password must be between 8 and 120 characters")
        String password
) {
}
