package com.arcitech.project;

import com.arcitech.user.Role;
import com.arcitech.user.User;

import java.time.OffsetDateTime;

public record ProjectAssignmentResponse(
        Long id,
        Long memberId,
        String memberName,
        String memberEmail,
        Role assignmentRole,
        OffsetDateTime assignedAt
) {
    public static ProjectAssignmentResponse from(ProjectAssignment assignment) {
        User member = assignment.getMember();
        return new ProjectAssignmentResponse(
                assignment.getId(),
                member.getId(),
                member.getFullName(),
                member.getEmail(),
                assignment.getAssignmentRole(),
                assignment.getAssignedAt()
        );
    }
}
