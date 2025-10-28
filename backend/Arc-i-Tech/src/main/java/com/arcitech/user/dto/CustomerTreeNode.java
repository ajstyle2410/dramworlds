package com.arcitech.user.dto;

import java.util.List;

public record CustomerTreeNode(
        StaffSummary customer,
        List<ProjectTeamNode> projects
) {
}
