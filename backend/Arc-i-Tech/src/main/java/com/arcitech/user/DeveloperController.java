package com.arcitech.user;

import com.arcitech.common.ApiResponse;
import com.arcitech.project.ProjectAssignment;
import com.arcitech.project.ProjectAssignmentRepository;
import com.arcitech.project.ProjectResponse;
import com.arcitech.user.dto.DeveloperWorkspaceResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/developer")
@RequiredArgsConstructor
@PreAuthorize("hasRole('DEVELOPER')")
public class DeveloperController {

    private final ProjectAssignmentRepository projectAssignmentRepository;
    private final DeveloperWorkspaceService developerWorkspaceService;

    @GetMapping("/projects")
    public ApiResponse<List<ProjectResponse>> projects(@AuthenticationPrincipal User developer) {
        List<ProjectResponse> responses = projectAssignmentRepository.findByMemberId(developer.getId()).stream()
                .map(ProjectAssignment::getProject)
                .distinct()
                .map(ProjectResponse::from)
                .toList();
        return ApiResponse.success("Assigned projects", responses);
    }

    @GetMapping("/workspace")
    public ApiResponse<DeveloperWorkspaceResponse> workspace(@AuthenticationPrincipal User developer) {
        return ApiResponse.success("Developer workspace", developerWorkspaceService.buildWorkspace(developer));
    }
}
