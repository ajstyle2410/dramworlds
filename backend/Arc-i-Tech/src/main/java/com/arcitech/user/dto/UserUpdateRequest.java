package com.arcitech.user.dto;

import com.arcitech.user.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UserUpdateRequest(
        @Size(max = 160, message = "Full name must be at most 160 characters")
        String fullName,

        @Email(message = "Provide a valid email address")
        String email,

        @Size(min = 8, max = 160, message = "Password must be between 8 and 160 characters")
        String password,

        Role role
) {
}
