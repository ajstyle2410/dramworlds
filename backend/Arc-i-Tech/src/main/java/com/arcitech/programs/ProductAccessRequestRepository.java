package com.arcitech.programs;

import com.arcitech.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductAccessRequestRepository extends JpaRepository<ProductAccessRequest, Long> {

    List<ProductAccessRequest> findByUserOrderBySubmittedAtDesc(User user);

    List<ProductAccessRequest> findByStatusOrderBySubmittedAtAsc(ProductAccessStatus status);

    Optional<ProductAccessRequest> findTopByUserAndProductKeyOrderBySubmittedAtDesc(User user, DashboardProductKey productKey);
}
