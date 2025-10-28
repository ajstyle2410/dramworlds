package com.arcitech.user.dto;

import com.arcitech.user.Role;
import com.arcitech.user.User;
import com.arcitech.user.UserProfile;

public record StaffSummary(
        Long id,
        String fullName,
        String email,
        Role role
) {

    public static StaffSummary from(User user) {
        return new StaffSummary(user.getId(), user.getFullName(), user.getEmail(), user.getRole());
    }

    public static StaffSummary from(UserProfile profile) {
        return new StaffSummary(profile.id(), profile.fullName(), profile.email(), profile.role());
    }
}
