package com.arcitech.admin;

import com.arcitech.project.Project;
import com.arcitech.user.User;

import java.time.OffsetDateTime;

public record AdminDiscussionResponse(
        Long id,
        AdminDiscussionContext context,
        Long projectId,
        String projectName,
        String serviceCategory,
        String subject,
        String message,
        Double progressRatio,
        Long senderId,
        String senderName,
        String senderRole,
        OffsetDateTime createdAt
) {
    public static AdminDiscussionResponse from(AdminDiscussionMessage message) {
        Project project = message.getProject();
        User sender = message.getSender();
        return new AdminDiscussionResponse(
                message.getId(),
                message.getContext(),
                project != null ? project.getId() : null,
                project != null ? project.getName() : null,
                message.getServiceCategory(),
                message.getSubject(),
                message.getMessage(),
                message.getProgressRatio(),
                sender.getId(),
                sender.getFullName(),
                sender.getRole().name(),
                message.getCreatedAt()
        );
    }
}
