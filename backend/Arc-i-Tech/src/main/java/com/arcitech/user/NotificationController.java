package com.arcitech.user;

import com.arcitech.common.ApiResponse;
import com.arcitech.user.dto.NotificationDto;
import com.arcitech.user.dto.NotificationFeedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ApiResponse<NotificationFeedResponse> feed(@AuthenticationPrincipal User user) {
        return ApiResponse.success("Notification feed",
                new NotificationFeedResponse(
                        notificationService.getNotifications(user),
                        notificationService.unreadCount(user)
                ));
    }

    @PostMapping("/read-all")
    public ApiResponse<Void> markAllRead(@AuthenticationPrincipal User user) {
        notificationService.markAllRead(user);
        return ApiResponse.success("Notifications marked as read", null);
    }

    @PostMapping("/{notificationId}/read")
    public ApiResponse<NotificationDto> markRead(@AuthenticationPrincipal User user,
                                                 @PathVariable Long notificationId) {
        return ApiResponse.success("Notification updated", notificationService.markRead(user, notificationId));
    }
}
