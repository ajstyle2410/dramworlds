package com.arcitech.chat;

import com.arcitech.user.Role;
import com.arcitech.user.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "chat_messages")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 25)
    private Role senderRole;

    @Column(nullable = false, length = 160)
    private String senderName;

    @Column(nullable = false, length = 3000)
    private String message;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime sentAt;

    @PrePersist
    void onCreate() {
        this.sentAt = OffsetDateTime.now();
    }
}
