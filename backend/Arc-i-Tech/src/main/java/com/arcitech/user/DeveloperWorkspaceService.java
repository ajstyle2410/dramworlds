package com.arcitech.user;

import com.arcitech.inquiry.InquiryService;
import com.arcitech.inquiry.InquiryResponse;
import com.arcitech.project.Project;
import com.arcitech.project.ProjectAssignment;
import com.arcitech.project.ProjectAssignmentRepository;
import com.arcitech.project.ProjectTaskService;
import com.arcitech.project.ProjectTimelineService;
import com.arcitech.project.TaskStatus;
import com.arcitech.project.ProjectResponse;
import com.arcitech.user.dto.DeveloperProjectSummary;
import com.arcitech.user.dto.DeveloperWorkspaceResponse;
import com.arcitech.user.dto.NotificationDto;
import com.arcitech.user.dto.ProjectTaskDto;
import com.arcitech.user.dto.ProjectTimelineEventDto;
import com.arcitech.user.dto.TaskBoardResponse;
import com.arcitech.user.dto.StaffSummary;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.LinkedHashMap;
import java.util.ArrayList;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(Transactional.TxType.SUPPORTS)
public class DeveloperWorkspaceService {

    private final ProjectTaskService projectTaskService;
    private final ProjectTimelineService projectTimelineService;
    private final ProjectAssignmentRepository projectAssignmentRepository;
    private final InquiryService inquiryService;
    private final NotificationService notificationService;

    public DeveloperWorkspaceResponse buildWorkspace(User developer) {
        List<ProjectTaskDto> tasks = projectTaskService.tasksForDeveloper(developer);
        Map<TaskStatus, List<ProjectTaskDto>> grouped = tasks.stream()
                .collect(Collectors.groupingBy(ProjectTaskDto::status, () -> new EnumMap<>(TaskStatus.class), Collectors.toList()));

        TaskBoardResponse taskBoard = new TaskBoardResponse(
                grouped.getOrDefault(TaskStatus.TODO, List.of()),
                grouped.getOrDefault(TaskStatus.IN_PROGRESS, List.of()),
                grouped.getOrDefault(TaskStatus.REVIEW, List.of()),
                grouped.getOrDefault(TaskStatus.BLOCKED, List.of()),
                grouped.getOrDefault(TaskStatus.DONE, List.of())
        );

        List<Project> assignedProjects = projectAssignments(developer);
        List<ProjectResponse> assignedProjectResponses = assignedProjects.stream()
                .map(ProjectResponse::from)
                .toList();

        Map<Long, List<ProjectTaskDto>> tasksByProject = tasks.stream()
                .filter(task -> task.projectId() != null)
                .collect(Collectors.groupingBy(ProjectTaskDto::projectId));

        List<DeveloperProjectSummary> projectSummaries = assignedProjectResponses.stream()
                .map(projectResponse -> {
                    List<ProjectTaskDto> projectTasks = tasksByProject.getOrDefault(projectResponse.id(), List.of());
                    int total = projectTasks.size();
                    int completed = (int) projectTasks.stream()
                            .filter(task -> task.status() == TaskStatus.DONE)
                            .count();
                    int inProgress = (int) projectTasks.stream()
                            .filter(task -> task.status() == TaskStatus.IN_PROGRESS || task.status() == TaskStatus.REVIEW)
                            .count();
                    int blocked = (int) projectTasks.stream()
                            .filter(task -> task.status() == TaskStatus.BLOCKED)
                            .count();
                    int todo = (int) projectTasks.stream()
                            .filter(task -> task.status() == TaskStatus.TODO)
                            .count();

                    Comparator<ProjectTaskDto> dueDateComparator = Comparator
                            .comparing(ProjectTaskDto::dueDate, Comparator.nullsLast(LocalDate::compareTo))
                            .thenComparing(ProjectTaskDto::updatedAt, Comparator.nullsLast(Comparator.naturalOrder()))
                            .thenComparing(ProjectTaskDto::id);

                    List<ProjectTaskDto> upcomingTasks = projectTasks.stream()
                            .filter(task -> task.status() != TaskStatus.DONE)
                            .sorted(dueDateComparator)
                            .limit(5)
                            .toList();

                    List<StaffSummary> contributors = projectTasks.stream()
                            .map(ProjectTaskDto::assignee)
                            .filter(Objects::nonNull)
                            .filter(summary -> summary.id() != null)
                            .collect(Collectors.collectingAndThen(
                                    Collectors.toMap(StaffSummary::id, Function.identity(), (left, right) -> left, LinkedHashMap::new),
                                    map -> new ArrayList<>(map.values())
                            ));

                    int computedProgress = total == 0
                            ? projectResponse.progressPercentage()
                            : (int) Math.round((completed * 100.0) / total);

                    return new DeveloperProjectSummary(
                            projectResponse,
                            total,
                            completed,
                            inProgress,
                            blocked,
                            todo,
                            upcomingTasks,
                            computedProgress,
                            contributors
                    );
                })
                .toList();

        List<ProjectTimelineEventDto> recentEvents = assignedProjects.stream()
                .flatMap(project -> projectTimelineService.getTimeline(project).stream())
                .sorted((a, b) -> b.occurredAt().compareTo(a.occurredAt()))
                .limit(20)
                .toList();

        List<InquiryResponse> inquiries = assignedProjects.stream()
                .flatMap(project -> inquiryService.findByProject(project).stream())
                .sorted((a, b) -> b.createdAt().compareTo(a.createdAt()))
                .limit(20)
                .toList();

        List<NotificationDto> notifications = notificationService.getNotifications(developer).stream()
                .limit(20)
                .toList();

        long unread = notificationService.unreadCount(developer);

        return new DeveloperWorkspaceResponse(taskBoard, recentEvents, assignedProjectResponses, projectSummaries, inquiries, notifications, unread);
    }

    private List<Project> projectAssignments(User developer) {
        return projectAssignmentRepository.findByMemberId(developer.getId()).stream()
                .map(ProjectAssignment::getProject)
                .distinct()
                .toList();
    }
}
