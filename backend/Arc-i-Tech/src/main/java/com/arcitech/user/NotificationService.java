package com.arcitech.user;

import com.arcitech.project.Project;
import com.arcitech.project.ProjectTask;
import com.arcitech.user.dto.NotificationDto;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final UserNotificationRepository notificationRepository;

    public void notifyTaskAssigned(User recipient, ProjectTask task, User actor) {
        UserNotification notification = UserNotification.builder()
                .recipient(recipient)
                .type(NotificationType.TASK_ASSIGNED)
                .title("New task assigned: " + task.getTitle())
                .message(actor != null ? actor.getFullName() + " assigned a task to you." : "You have a new task.")
                .project(task.getProject())
                .task(task)
                .build();
        notificationRepository.save(notification);
    }

    public void notifyTaskUpdated(ProjectTask task, User actor) {
        if (task.getAssignee() == null) {
            return;
        }
        UserNotification notification = UserNotification.builder()
                .recipient(task.getAssignee())
                .type(NotificationType.TASK_UPDATED)
                .title("Task updated: " + task.getTitle())
                .message(actor != null ? actor.getFullName() + " updated the task." : "Task has been updated.")
                .project(task.getProject())
                .task(task)
                .build();
        notificationRepository.save(notification);
    }

    public void notifyProject(Project project, User recipient, NotificationType type, String title, String message) {
        UserNotification notification = UserNotification.builder()
                .recipient(recipient)
                .type(type)
                .title(title)
                .message(message)
                .project(project)
                .build();
        notificationRepository.save(notification);
    }

    public List<NotificationDto> getNotifications(User user) {
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(user).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public long unreadCount(User user) {
        return notificationRepository.countByRecipientAndReadFlagIsFalse(user);
    }

    public void markAllRead(User user) {
        List<UserNotification> notifications = notificationRepository.findByRecipientOrderByCreatedAtDesc(user);
        notifications.forEach(notification -> notification.setReadFlag(true));
        notificationRepository.saveAll(notifications);
    }

    public NotificationDto markRead(User user, Long notificationId) {
        UserNotification notification = notificationRepository.findByIdAndRecipient(notificationId, user)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        notification.setReadFlag(true);
        notificationRepository.save(notification);
        return toDto(notification);
    }

    private NotificationDto toDto(UserNotification notification) {
        return new NotificationDto(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.isReadFlag(),
                notification.getCreatedAt(),
                notification.getProject() != null ? notification.getProject().getId() : null,
                notification.getTask() != null ? notification.getTask().getId() : null
        );
    }
}
