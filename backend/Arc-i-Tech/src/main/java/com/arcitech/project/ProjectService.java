package com.arcitech.project;

import com.arcitech.user.NotificationService;
import com.arcitech.user.NotificationType;
import com.arcitech.user.User;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectAssignmentRepository projectAssignmentRepository;
    private final NotificationService notificationService;

    public List<ProjectResponse> getHighlightedProjects() {
        return projectRepository.findByHighlightedTrueOrderByUpdatedAtDesc()
                .stream()
                .map(ProjectResponse::from)
                .toList();
    }

    public ProjectResponse submitProjectRequest(ProjectRequest request, User customer) {
        Project project = Project.builder()
                .name(request.name())
                .summary(request.summary())
                .details(request.details())
                .status(ProjectStatus.PLANNING)
                .progressPercentage(5)
                .startDate(LocalDate.now())
                .targetDate(request.targetDate())
                .highlighted(false)
                .client(customer)
                .build();

        Project saved = projectRepository.save(project);
        return ProjectResponse.from(saved);
    }

    public List<ProjectResponse> getProjectsForUser(User user) {
        return projectRepository.findByClientOrderByUpdatedAtDesc(user)
                .stream()
                .map(ProjectResponse::from)
                .toList();
    }

    public List<ProjectResponse> getAllProjects() {
        return projectRepository.findAll()
                .stream()
                .sorted((a, b) -> b.getUpdatedAt().compareTo(a.getUpdatedAt()))
                .map(ProjectResponse::from)
                .toList();
    }

    public ProjectResponse updateProject(Long id, ProjectUpdateRequest request) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Project not found with id " + id));

        boolean wasComplete = isComplete(project);

        project.setStatus(request.status());
        if (request.progressPercentage() != null) {
            project.setProgressPercentage(request.progressPercentage());
        }
        if (request.targetDate() != null) {
            project.setTargetDate(request.targetDate());
        }
        boolean isComplete = isComplete(project);

        Project saved = projectRepository.save(project);

        if (!wasComplete && isComplete) {
            dispatchCompletionNotifications(saved);
        }

        return ProjectResponse.from(saved);
    }

    private boolean isComplete(Project project) {
        return project.getStatus() == ProjectStatus.DEPLOYED || project.getProgressPercentage() >= 100;
    }

    private void dispatchCompletionNotifications(Project project) {
        Set<Long> notifiedUserIds = new HashSet<>();

        User client = project.getClient();
        if (client != null) {
            notificationService.notifyProject(
                    project,
                    client,
                    NotificationType.PROJECT_COMPLETED,
                    "Launch complete: " + project.getName(),
                    "Your project is live and ready for review."
            );
            notifiedUserIds.add(client.getId());
        }

        projectAssignmentRepository.findByProject(project).forEach(assignment -> {
            User member = assignment.getMember();
            if (member != null && notifiedUserIds.add(member.getId())) {
                notificationService.notifyProject(
                        project,
                        member,
                        NotificationType.PROJECT_COMPLETED,
                        "Project shipped: " + project.getName(),
                        "Celebrate the delivery! The customer has been notified."
                );
            }
        });
    }
}
