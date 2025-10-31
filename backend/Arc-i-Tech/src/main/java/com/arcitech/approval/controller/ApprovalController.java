package com.arcitech.approval.controller;

import com.arcitech.approval.dto.ApprovalRequestDto;
import com.arcitech.approval.entity.ApprovalRequest;
import com.arcitech.approval.service.ApprovalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/approval")
@CrossOrigin(origins = "*")
public class ApprovalController {

    private final ApprovalService approvalService;

    public ApprovalController(ApprovalService approvalService) {
        this.approvalService = approvalService;
    }

    // ✅ Send new approval request
    @PostMapping("/send")
    public ResponseEntity<ApprovalRequest> sendApproval(@RequestBody ApprovalRequestDto dto) {
        ApprovalRequest saved = approvalService.sendApprovalRequest(dto);
        return ResponseEntity.ok(saved);
    }

    // 📋 List all pending requests for sub-admin
    @GetMapping("/pending")
    public ResponseEntity<List<ApprovalRequest>> getPendingApprovals(@RequestParam(required = false) Long subAdminId) {
        List<ApprovalRequest> list = approvalService.getPendingRequests(subAdminId);
        return ResponseEntity.ok(list);
    }

    // 🟢 Update approval status (approve/reject)
    @PutMapping("/update/{id}")
    public ResponseEntity<ApprovalRequest> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        ApprovalRequest updated = approvalService.updateRequestStatus(id, status);
        return ResponseEntity.ok(updated);
    }
}
