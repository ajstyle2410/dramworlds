package com.arcitech.user.dto;

import java.util.List;

public record TaskBoardResponse(
        List<ProjectTaskDto> todo,
        List<ProjectTaskDto> inProgress,
        List<ProjectTaskDto> review,
        List<ProjectTaskDto> blocked,
        List<ProjectTaskDto> done
) {
}
