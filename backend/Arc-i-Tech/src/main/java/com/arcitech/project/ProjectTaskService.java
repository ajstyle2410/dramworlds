package com.arcitech.project;

import com.arcitech.user.NotificationService;
import com.arcitech.user.Role;
import com.arcitech.user.User;
import com.arcitech.user.UserNotification;
import com.arcitech.user.UserRepository;
import com.arcitech.user.dto.ProjectTaskDto;
import com.arcitech.user.dto.StaffSummary;
import com.arcitech.user.dto.TaskBoardResponse;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ProjectTaskService {

    private final ProjectTaskRepository projectTaskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public ProjectTaskDto createTask(ProjectTaskRequest request, User actor) {
        Project project = projectRepository.findById(request.projectId())
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        User assignee = request.assigneeId() != null
                ? userRepository.findById(request.assigneeId())
                .orElseThrow(() -> new IllegalArgumentException("Assignee not found"))
                : null;

        ProjectTask task = ProjectTask.builder()
                .project(project)
                .assignee(assignee)
                .title(request.title())
                .description(request.description())
                .status(request.status() == null ? TaskStatus.TODO : request.status())
                .priority(request.priority() == null ? TaskPriority.MEDIUM : request.priority())
                .dueDate(request.dueDate())
                .build();

        ProjectTask saved = projectTaskRepository.save(task);
        if (assignee != null) {
            notificationService.notifyTaskAssigned(assignee, saved, actor);
        }
        return toDto(saved);
    }

    public ProjectTaskDto updateTask(Long taskId, ProjectTaskUpdateRequest request, User actor) {
        ProjectTask task = projectTaskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
        if (request.title() != null) {
            task.setTitle(request.title());
        }
        if (request.description() != null) {
            task.setDescription(request.description());
        }
        if (request.status() != null) {
            task.setStatus(request.status());
        }
        if (request.priority() != null) {
            task.setPriority(request.priority());
        }
        if (request.dueDate() != null || request.clearDueDate()) {
            task.setDueDate(request.clearDueDate() ? null : request.dueDate());
        }
        if (request.assigneeId() != null) {
            User assignee = userRepository.findById(request.assigneeId())
                    .orElseThrow(() -> new IllegalArgumentException("Assignee not found"));
            task.setAssignee(assignee);
        } else if (request.clearAssignee()) {
            task.setAssignee(null);
        }
        ProjectTask saved = projectTaskRepository.save(task);
        notificationService.notifyTaskUpdated(saved, actor);
        return toDto(saved);
    }

    public void deleteTask(Long taskId) {
        projectTaskRepository.deleteById(taskId);
    }

    public List<ProjectTaskDto> tasksForProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        return projectTaskRepository.findByProject(project).stream()
                .map(this::toDto)
                .sorted(Comparator.comparing(ProjectTaskDto::updatedAt).reversed())
                .toList();
    }

    public Map<TaskStatus, List<ProjectTaskDto>> boardForProject(Long projectId) {
        return tasksForProject(projectId).stream()
                .collect(Collectors.groupingBy(ProjectTaskDto::status));
    }

    public TaskBoardResponse boardResponseForProject(Long projectId) {
        Map<TaskStatus, List<ProjectTaskDto>> grouped = boardForProject(projectId);
        return new TaskBoardResponse(
                grouped.getOrDefault(TaskStatus.TODO, List.of()),
                grouped.getOrDefault(TaskStatus.IN_PROGRESS, List.of()),
                grouped.getOrDefault(TaskStatus.REVIEW, List.of()),
                grouped.getOrDefault(TaskStatus.BLOCKED, List.of()),
                grouped.getOrDefault(TaskStatus.DONE, List.of())
        );
    }

    public List<ProjectTaskDto> tasksForDeveloper(User developer) {
        return projectTaskRepository.findByAssignee(developer).stream()
                .map(this::toDto)
                .sorted(Comparator.comparing(ProjectTaskDto::dueDate, Comparator.nullsLast(LocalDate::compareTo)))
                .toList();
    }

    private ProjectTaskDto toDto(ProjectTask task) {
        return new ProjectTaskDto(
                task.getId(),
                task.getProject().getId(),
                task.getProject().getName(),
                task.getTitle(),
                task.getDescription(),
                task.getStatus(),
                task.getPriority(),
                task.getDueDate(),
                task.getAssignee() != null ? StaffSummary.from(task.getAssignee()) : null,
                task.getUpdatedAt()
        );
    }
}
