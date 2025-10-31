package com.arcitech.approval.dto;

public class ApprovalRequestDto {
    private Long userId;
    private Long subAdminId;
    private String requestType;

    // Getters & Setters
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getSubAdminId() { return subAdminId; }
    public void setSubAdminId(Long subAdminId) { this.subAdminId = subAdminId; }

    public String getRequestType() { return requestType; }
    public void setRequestType(String requestType) { this.requestType = requestType; }
}
