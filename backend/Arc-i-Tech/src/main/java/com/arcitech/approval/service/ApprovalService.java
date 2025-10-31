package com.arcitech.approval.service;

import com.arcitech.approval.dto.ApprovalRequestDto;
import com.arcitech.approval.entity.ApprovalRequest;
import com.arcitech.approval.repository.ApprovalRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ApprovalService {

    private final ApprovalRepository approvalRepository;

    public ApprovalService(ApprovalRepository approvalRepository) {
        this.approvalRepository = approvalRepository;
    }

    // Create and save approval request
    public ApprovalRequest sendApprovalRequest(ApprovalRequestDto dto) {
        ApprovalRequest request = new ApprovalRequest();
        request.setUserId(dto.getUserId());
        request.setRequestType(dto.getRequestType());
        request.setStatus("PENDING");
        request.setSubAdminId(dto.getSubAdminId());
        return approvalRepository.save(request);
    }

    // Get all pending requests for a sub-admin
    public List<ApprovalRequest> getPendingRequests(Long subAdminId) {
        if (subAdminId != null) {
            return approvalRepository.findBySubAdminIdAndStatus(subAdminId, "PENDING");
        } else {
            return approvalRepository.findByStatus("PENDING");
        }
    }

    // Approve or reject a request
    public ApprovalRequest updateRequestStatus(Long id, String status) {
        ApprovalRequest request = approvalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Approval request not found"));
        request.setStatus(status.toUpperCase());
        return approvalRepository.save(request);
    }
}
