package com.arcitech.user;

public record UserProfile(
        Long id,
        String fullName,
        String email,
        Role role,
        boolean active
) {
    public static UserProfile from(User user) {
        return new UserProfile(user.getId(), user.getFullName(), user.getEmail(), user.getRole(), user.isActive());
    }
}
