package com.arcitech.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserNotificationRepository extends JpaRepository<UserNotification, Long> {
    List<UserNotification> findByRecipientOrderByCreatedAtDesc(User recipient);
    long countByRecipientAndReadFlagIsFalse(User recipient);
    java.util.Optional<UserNotification> findByIdAndRecipient(Long id, User recipient);
}
