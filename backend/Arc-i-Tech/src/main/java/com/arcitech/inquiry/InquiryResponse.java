package com.arcitech.inquiry;

import java.time.OffsetDateTime;

public record InquiryResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        String company,
        String message,
        InquiryStatus status,
        String assignedTo,
        String source,
        OffsetDateTime createdAt
) {

    public static InquiryResponse from(Inquiry inquiry) {
        return new InquiryResponse(
                inquiry.getId(),
                inquiry.getFullName(),
                inquiry.getEmail(),
                inquiry.getPhone(),
                inquiry.getCompany(),
                inquiry.getMessage(),
                inquiry.getStatus(),
                inquiry.getAssignedTo(),
                inquiry.getSource(),
                inquiry.getCreatedAt()
        );
    }
}
