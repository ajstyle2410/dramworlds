package com.arcitech.user.dto;

import com.arcitech.project.TimelineEventType;
import java.time.OffsetDateTime;

public record ProjectTimelineEventDto(
        Long id,
        TimelineEventType eventType,
        String title,
        String description,
        OffsetDateTime occurredAt,
        StaffSummary actor
) {
}
