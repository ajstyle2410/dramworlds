package com.arcitech.user.dto;

import com.arcitech.project.ProjectResponse;
import java.util.List;

public record DeveloperProjectSummary(
        ProjectResponse project,
        int totalTasks,
        int completedTasks,
        int inProgressTasks,
        int blockedTasks,
        int todoTasks,
        List<ProjectTaskDto> upcomingTasks,
        int computedProgressPercentage,
        List<StaffSummary> contributors
) {
}
