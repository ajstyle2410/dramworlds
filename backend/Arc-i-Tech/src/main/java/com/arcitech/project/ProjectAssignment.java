package com.arcitech.project;

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
@Table(name = "project_assignments", uniqueConstraints = {
        @UniqueConstraint(name = "uk_project_member", columnNames = {"project_id", "member_id"})
})
public class ProjectAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private User member;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 25)
    private Role assignmentRole;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime assignedAt;

    @PrePersist
    void onCreate() {
        this.assignedAt = OffsetDateTime.now();
    }
}
