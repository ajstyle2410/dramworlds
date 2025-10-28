package com.arcitech.project;

import com.arcitech.user.User;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ProjectService {

    private final ProjectRepository projectRepository;

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

        project.setStatus(request.status());
        if (request.progressPercentage() != null) {
            project.setProgressPercentage(request.progressPercentage());
        }
        if (request.targetDate() != null) {
            project.setTargetDate(request.targetDate());
        }
        return ProjectResponse.from(projectRepository.save(project));
    }
}
