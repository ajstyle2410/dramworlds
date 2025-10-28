package com.arcitech.project;

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
@Table(name = "project_timeline_events")
public class ProjectTimelineEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    private User actor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private TimelineEventType eventType;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime occurredAt;

    @PrePersist
    void onCreate() {
        if (occurredAt == null) {
            occurredAt = OffsetDateTime.now();
        }
    }
}
