package com.arcitech.chat;

import com.arcitech.common.ApiResponse;
import com.arcitech.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping("/chat/messages")
    public ApiResponse<List<ChatMessageDto>> myMessages(@AuthenticationPrincipal User currentUser) {
        return ApiResponse.success("Chat thread", chatService.getMessagesForCustomer(currentUser));
    }

    @PostMapping("/chat/messages")
    public ApiResponse<ChatMessageDto> sendCustomerMessage(@AuthenticationPrincipal User currentUser,
                                                           @Valid @RequestBody ChatMessageRequest request) {
        return ApiResponse.success("Message sent", chatService.postCustomerMessage(currentUser, request.message()));
    }

    @GetMapping("/admin/chat/{customerId}/messages")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','SUB_ADMIN')")
    public ApiResponse<List<ChatMessageDto>> getMessagesForCustomer(@PathVariable Long customerId) {
        return ApiResponse.success("Chat thread", chatService.getMessagesForCustomerId(customerId));
    }

    @PostMapping("/admin/chat/{customerId}/messages")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','SUB_ADMIN')")
    public ApiResponse<ChatMessageDto> sendMessageToCustomer(@PathVariable Long customerId,
                                                             @AuthenticationPrincipal User adminUser,
                                                             @Valid @RequestBody ChatMessageRequest request) {
        return ApiResponse.success("Message sent", chatService.postAdminMessage(customerId, request.message(), adminUser));
    }
}
