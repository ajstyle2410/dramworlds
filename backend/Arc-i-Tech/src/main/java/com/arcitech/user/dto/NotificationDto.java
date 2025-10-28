package com.arcitech.user.dto;

import com.arcitech.user.NotificationType;
import java.time.OffsetDateTime;

public record NotificationDto(
        Long id,
        NotificationType type,
        String title,
        String message,
        boolean read,
        OffsetDateTime createdAt,
        Long projectId,
        Long taskId
) {
}
