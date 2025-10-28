package com.arcitech.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChatMessageRequest(
        @NotBlank(message = "Message is required")
        @Size(min = 1, max = 2000)
        String message
) {
}
