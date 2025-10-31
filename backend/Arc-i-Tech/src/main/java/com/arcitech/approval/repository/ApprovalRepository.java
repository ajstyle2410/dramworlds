package com.arcitech.approval.repository;

import com.arcitech.approval.entity.ApprovalRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApprovalRepository extends JpaRepository<ApprovalRequest, Long> {
    List<ApprovalRequest> findBySubAdminIdAndStatus(Long subAdminId, String status);
    List<ApprovalRequest> findByStatus(String status);
}
