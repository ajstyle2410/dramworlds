package com.arcitech.user.dto;

import com.arcitech.inquiry.InquiryResponse;
import com.arcitech.project.ProjectResponse;

import java.util.List;

public record DeveloperWorkspaceResponse(
        TaskBoardResponse taskBoard,
        List<ProjectTimelineEventDto> recentEvents,
        List<ProjectResponse> assignedProjects,
        List<DeveloperProjectSummary> projectSummaries,
        List<InquiryResponse> recentInquiries,
        List<NotificationDto> notifications,
        long unreadNotifications
) {
}
