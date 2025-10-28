package com.arcitech.auth;

import com.arcitech.user.UserProfile;

public record AuthResponse(
        String token,
        long expiresInMs,
        UserProfile user
) {
}
