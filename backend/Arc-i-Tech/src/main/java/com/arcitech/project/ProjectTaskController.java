package com.arcitech.project;

import com.arcitech.common.ApiResponse;
import com.arcitech.user.User;
import com.arcitech.user.dto.ProjectTaskDto;
import com.arcitech.user.dto.TaskBoardResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProjectTaskController {

    private final ProjectTaskService projectTaskService;
    private final ProjectRepository projectRepository;
    private final ProjectAssignmentRepository projectAssignmentRepository;
    private final ProjectTaskRepository projectTaskRepository;

    @GetMapping("/developer/projects/{projectId}/tasks")
    @PreAuthorize("hasRole('DEVELOPER')")
    public ApiResponse<TaskBoardResponse> developerBoard(@AuthenticationPrincipal User developer,
                                                         @PathVariable Long projectId) {
        Project project = resolveProject(projectId);
        assertAssigned(project, developer);
        return ApiResponse.success("Project task board", projectTaskService.boardResponseForProject(projectId));
    }
    
    @GetMapping("/dashboard/projects/{projectId}/tasks")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ApiResponse<TaskBoardResponse> customerBoard(@AuthenticationPrincipal User customer,
                                                        @PathVariable Long projectId) {
        Project project = resolveProject(projectId);
        assertClient(project, customer);
        return ApiResponse.success("Project task board", projectTaskService.boardResponseForProject(projectId));
    }

    @PostMapping("/developer/projects/{projectId}/tasks")
    @PreAuthorize("hasRole('DEVELOPER')")
    public ApiResponse<ProjectTaskDto> developerCreateTask(@AuthenticationPrincipal User developer,
                                                           @PathVariable Long projectId,
                                                           @Valid @RequestBody ProjectTaskRequest request) {
        Project project = resolveProject(projectId);
        assertAssigned(project, developer);
        if (request.assigneeId() != null && !request.assigneeId().equals(developer.getId())) {
            throw new AccessDeniedException("Developers can only assign tasks to themselves.");
        }
        ProjectTaskRequest normalized = normalizeRequest(projectId, request, developer.getId());
        return ApiResponse.success("Task created", projectTaskService.createTask(normalized, developer));
    }

    @PatchMapping("/developer/tasks/{taskId}")
    @PreAuthorize("hasRole('DEVELOPER')")
    public ApiResponse<ProjectTaskDto> developerUpdateTask(@AuthenticationPrincipal User developer,
                                                           @PathVariable Long taskId,
                                                           @RequestBody ProjectTaskUpdateRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Task update payload is required");
        }
        ProjectTask task = resolveTask(taskId);
        assertAssigned(task.getProject(), developer);
        if (request.assigneeId() != null && !request.assigneeId().equals(developer.getId())) {
            throw new AccessDeniedException("Developers can only reassign tasks to themselves.");
        }
        if (request.clearAssignee()) {
            throw new AccessDeniedException("Developers cannot remove task assignments.");
        }
        ProjectTaskUpdateRequest normalized = normalizeUpdateRequest(task.getProject().getId(), request, developer.getId());
        return ApiResponse.success("Task updated", projectTaskService.updateTask(taskId, normalized, developer));
    }

    @GetMapping("/admin/projects/{projectId}/tasks")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','SUB_ADMIN')")
    public ApiResponse<TaskBoardResponse> adminBoard(@PathVariable Long projectId) {
        return ApiResponse.success("Project task board", projectTaskService.boardResponseForProject(projectId));
    }

    @PostMapping("/admin/projects/{projectId}/tasks")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','SUB_ADMIN')")
    public ApiResponse<ProjectTaskDto> adminCreateTask(@AuthenticationPrincipal User actor,
                                                       @PathVariable Long projectId,
                                                       @Valid @RequestBody ProjectTaskRequest request) {
        ProjectTaskRequest normalized = normalizeRequest(projectId, request, request.assigneeId());
        return ApiResponse.success("Task created", projectTaskService.createTask(normalized, actor));
    }

    @PatchMapping("/admin/tasks/{taskId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','SUB_ADMIN')")
    public ApiResponse<ProjectTaskDto> adminUpdateTask(@AuthenticationPrincipal User actor,
                                                       @PathVariable Long taskId,
                                                       @RequestBody ProjectTaskUpdateRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Task update payload is required");
        }
        ProjectTask task = resolveTask(taskId);
        ProjectTaskUpdateRequest normalized = normalizeUpdateRequest(task.getProject().getId(), request, request.assigneeId());
        return ApiResponse.success("Task updated", projectTaskService.updateTask(taskId, normalized, actor));
    }

    @DeleteMapping("/admin/tasks/{taskId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','SUB_ADMIN')")
    public void adminDeleteTask(@PathVariable Long taskId) {
        projectTaskService.deleteTask(taskId);
    }

    private Project resolveProject(Long projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found with id " + projectId));
    }

    private ProjectTask resolveTask(Long taskId) {
        return projectTaskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found with id " + taskId));
    }

    private void assertAssigned(Project project, User developer) {
        boolean assigned = projectAssignmentRepository.findByProjectAndMember(project, developer).isPresent();
        if (!assigned) {
            throw new AccessDeniedException("You are not assigned to this project.");
        }
    }
    
    private void assertClient(Project project, User customer) {
        User client = project.getClient();
        if (client == null || !client.getId().equals(customer.getId())) {
            throw new AccessDeniedException("You are not allowed to view this project.");
        }
    }

    private ProjectTaskRequest normalizeRequest(Long projectId, ProjectTaskRequest request, Long preferredAssigneeId) {
        Long assigneeId = request.assigneeId() != null ? request.assigneeId() : preferredAssigneeId;
        return new ProjectTaskRequest(
                projectId,
                request.title(),
                request.description(),
                request.status(),
                request.priority(),
                request.dueDate(),
                assigneeId,
                request.clearDueDate()
        );
    }

    private ProjectTaskUpdateRequest normalizeUpdateRequest(Long projectId,
                                                            ProjectTaskUpdateRequest request,
                                                            Long preferredAssigneeId) {
        Long assigneeId = Optional.ofNullable(request.assigneeId()).orElse(preferredAssigneeId);
        return new ProjectTaskUpdateRequest(
                projectId,
                request.title(),
                request.description(),
                request.status(),
                request.priority(),
                request.dueDate(),
                assigneeId,
                request.clearDueDate(),
                request.clearAssignee()
        );
    }
}
