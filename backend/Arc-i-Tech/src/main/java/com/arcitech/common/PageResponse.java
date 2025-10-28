package com.arcitech.common;

import java.util.List;

/**
 * Simple wrapper for paged results to keep the frontend contract tidy.
 */
public record PageResponse<T>(
        List<T> items,
        long totalItems,
        int page,
        int size,
        long totalPages
) {

    public static <T> PageResponse<T> of(List<T> items, long totalItems, int page, int size) {
        long totalPages = size == 0 ? 0 : (long) Math.ceil((double) totalItems / size);
        return new PageResponse<>(items, totalItems, page, size, totalPages);
    }
}
