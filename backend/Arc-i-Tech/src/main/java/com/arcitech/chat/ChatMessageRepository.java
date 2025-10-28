package com.arcitech.chat;

import com.arcitech.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByCustomerOrderBySentAtAsc(User customer);
    List<ChatMessage> findByCustomerIdOrderBySentAtAsc(Long customerId);
}
