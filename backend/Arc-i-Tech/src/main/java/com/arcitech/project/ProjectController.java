package com.arcitech.project;

import com.arcitech.common.ApiResponse;
import com.arcitech.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping("/projects/highlights")
    public ApiResponse<List<ProjectResponse>> highlights() {
        return ApiResponse.success("Project highlights", projectService.getHighlightedProjects());
    }

    @GetMapping("/projects")
    public ApiResponse<List<ProjectResponse>> myProjects(@AuthenticationPrincipal User currentUser) {
        return ApiResponse.success("Fetched projects", projectService.getProjectsForUser(currentUser));
    }

    @PostMapping("/projects")
    public ApiResponse<ProjectResponse> createProject(@Valid @RequestBody ProjectRequest request,
                                                      @AuthenticationPrincipal User currentUser) {
        return ApiResponse.success("Project submitted", projectService.submitProjectRequest(request, currentUser));
    }

    @GetMapping("/admin/projects")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','SUB_ADMIN')")
    public ApiResponse<List<ProjectResponse>> allProjects() {
        return ApiResponse.success("All projects", projectService.getAllProjects());
    }

    @PatchMapping("/admin/projects/{projectId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','SUB_ADMIN')")
    public ApiResponse<ProjectResponse> update(@PathVariable Long projectId,
                                               @Valid @RequestBody ProjectUpdateRequest request) {
        return ApiResponse.success("Project updated", projectService.updateProject(projectId, request));
    }
}
