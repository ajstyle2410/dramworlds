package com.arcitech.programs;

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
@Table(name = "product_access_requests", indexes = {
        @Index(name = "idx_product_access_user", columnList = "user_id"),
        @Index(name = "idx_product_access_status", columnList = "status")
})
public class ProductAccessRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 64)
    private DashboardProductKey productKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 25)
    private ProductAccessStatus status;

    @Column(length = 500)
    private String note;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime submittedAt;

    private OffsetDateTime decidedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decided_by_id")
    private User decidedBy;

    @PrePersist
    void onCreate() {
        this.submittedAt = OffsetDateTime.now();
        if (this.status == null) {
            this.status = ProductAccessStatus.PENDING;
        }
    }
}
