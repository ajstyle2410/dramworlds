package com.arcitech.user.dto;

import com.arcitech.user.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UserManagementRequest(
        @NotBlank(message = "Full name is required")
        @Size(max = 160, message = "Full name must be at most 160 characters")
        String fullName,

        @NotBlank(message = "Email is required")
        @Email(message = "Provide a valid email address")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 160, message = "Password must be between 8 and 160 characters")
        String password,

        @NotNull(message = "Role is required")
        Role role
) {
}
