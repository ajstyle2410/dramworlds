package com.arcitech.chat;

import com.arcitech.user.Role;

import java.time.OffsetDateTime;

public record ChatMessageDto(
        Long id,
        Role senderRole,
        String senderName,
        String message,
        OffsetDateTime sentAt
) {
    public static ChatMessageDto from(ChatMessage message) {
        return new ChatMessageDto(
                message.getId(),
                message.getSenderRole(),
                message.getSenderName(),
                message.getMessage(),
                message.getSentAt()
        );
    }
}
