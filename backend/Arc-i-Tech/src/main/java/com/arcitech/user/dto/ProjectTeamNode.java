package com.arcitech.user.dto;

import com.arcitech.project.ProjectStatus;
import java.util.List;

public record ProjectTeamNode(
        Long projectId,
        String name,
        ProjectStatus status,
        int progressPercentage,
        String summary,
        String targetDate,
        StaffSummary customer,
        List<StaffSummary> subAdmins,
        List<StaffSummary> developers,
        int totalTasks,
        int openTasks,
        int completedTasks
) {
}
