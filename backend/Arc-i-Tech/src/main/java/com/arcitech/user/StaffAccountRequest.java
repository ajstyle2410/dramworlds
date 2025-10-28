package com.arcitech.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record StaffAccountRequest(
        @NotBlank(message = "Full name is required")
        @Size(min = 3, max = 120)
        String fullName,

        @NotBlank(message = "Email is required")
        @Email
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 120)
        String password,

        @NotNull(message = "Role is required")
        Role role
) {
}
