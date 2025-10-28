package com.arcitech.common;

import java.time.Instant;

/**
 * Generic API response wrapper that keeps payloads consistent between controllers.
 *
 * @param <T> payload type
 */
public record ApiResponse<T>(
        boolean success,
        String message,
        T data,
        Instant timestamp
) {

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, message, data, Instant.now());
    }

    public static <T> ApiResponse<T> success(T data) {
        return success(null, data);
    }

    public static <T> ApiResponse<T> failure(String message) {
        return new ApiResponse<>(false, message, null, Instant.now());
    }
}
