package com.arcitech.project;

import com.arcitech.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProjectAssignmentController {

    private final ProjectAssignmentService assignmentService;

    @PostMapping("/super-admin/project-assignments")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<ProjectAssignmentResponse> assignMember(@Valid @RequestBody ProjectAssignmentRequest request) {
        return ApiResponse.success("Member assigned", assignmentService.assignMember(request));
    }

    @GetMapping("/admin/projects/{projectId}/assignments")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','SUB_ADMIN')")
    public ApiResponse<List<ProjectAssignmentResponse>> getAssignmentsForProject(@PathVariable Long projectId) {
        return ApiResponse.success("Assignments", assignmentService.getAssignmentsForProject(projectId));
    }

    @DeleteMapping("/super-admin/project-assignments/{assignmentId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<Void> removeAssignment(@PathVariable Long assignmentId) {
        assignmentService.removeAssignment(assignmentId);
        return ApiResponse.success("Assignment removed", null);
    }
}
