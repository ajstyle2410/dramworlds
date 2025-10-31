package com.arcitech.programs.dto;

import com.arcitech.programs.DashboardProductKey;
import com.arcitech.programs.ProductAccessStatus;

import java.time.OffsetDateTime;

public record ProductAccessRequestDto(
        Long id,
        Long userId,
        String userName,
        DashboardProductKey productKey,
        ProductAccessStatus status,
        String note,
        OffsetDateTime submittedAt,
        OffsetDateTime decidedAt,
        Long decidedBy,
        String decidedByName
) {
}
