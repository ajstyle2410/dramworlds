package com.arcitech.user.dto;

import java.util.List;

public record SubAdminRelationshipResponse(
        StaffSummary subAdmin,
        List<ProjectTeamNode> projects
) {
}
