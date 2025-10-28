package com.arcitech.chat;

import com.arcitech.user.Role;
import com.arcitech.user.User;
import com.arcitech.user.UserService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserService userService;

    public List<ChatMessageDto> getMessagesForCustomer(User customer) {
        return chatMessageRepository.findByCustomerOrderBySentAtAsc(customer)
                .stream()
                .map(ChatMessageDto::from)
                .toList();
    }

    public List<ChatMessageDto> getMessagesForCustomerId(Long customerId) {
        return chatMessageRepository.findByCustomerIdOrderBySentAtAsc(customerId)
                .stream()
                .map(ChatMessageDto::from)
                .toList();
    }

    public ChatMessageDto postCustomerMessage(User customer, String message) {
        ChatMessage chatMessage = ChatMessage.builder()
                .customer(customer)
                .senderRole(Role.CUSTOMER)
                .senderName(customer.getFullName())
                .message(message)
                .build();
        return ChatMessageDto.from(chatMessageRepository.save(chatMessage));
    }

    public ChatMessageDto postAdminMessage(Long customerId, String message, User admin) {
        User customer = userService.getUserById(customerId);
        if (customer.getRole() != Role.CUSTOMER) {
            throw new EntityNotFoundException("Chat is only available for customer accounts");
        }
        if (admin.getRole() != Role.SUPER_ADMIN && admin.getRole() != Role.SUB_ADMIN) {
            throw new IllegalStateException("Only administrators can send messages to customers");
        }
        ChatMessage chatMessage = ChatMessage.builder()
                .customer(customer)
                .senderRole(admin.getRole())
                .senderName(admin.getFullName())
                .message(message)
                .build();
        return ChatMessageDto.from(chatMessageRepository.save(chatMessage));
    }
}
