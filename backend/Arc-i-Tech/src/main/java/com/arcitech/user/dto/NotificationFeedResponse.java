package com.arcitech.user.dto;

import java.util.List;

public record NotificationFeedResponse(
        List<NotificationDto> notifications,
        long unreadCount
) {
}
