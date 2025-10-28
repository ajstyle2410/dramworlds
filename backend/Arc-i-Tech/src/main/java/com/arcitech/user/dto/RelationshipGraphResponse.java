package com.arcitech.user.dto;

import java.util.List;

public record RelationshipGraphResponse(
        List<CustomerTreeNode> customers,
        List<SubAdminRelationshipResponse> subAdmins,
        List<StaffSummary> unassignedSubAdmins,
        List<StaffSummary> unassignedDevelopers,
        List<ProjectTeamNode> unassignedProjects
) {
}
