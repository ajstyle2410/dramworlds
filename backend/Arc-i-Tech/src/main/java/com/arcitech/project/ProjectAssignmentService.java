package com.arcitech.project;

import com.arcitech.user.Role;
import com.arcitech.user.User;
import com.arcitech.user.UserService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ProjectAssignmentService {

    private final ProjectRepository projectRepository;
    private final ProjectAssignmentRepository assignmentRepository;
    private final UserService userService;

    public ProjectAssignmentResponse assignMember(ProjectAssignmentRequest request) {
        Project project = projectRepository.findById(request.projectId())
                .orElseThrow(() -> new EntityNotFoundException("Project not found with id " + request.projectId()));
        User member = userService.getUserById(request.memberId());

        if (request.assignmentRole() != Role.SUB_ADMIN && request.assignmentRole() != Role.DEVELOPER) {
            throw new IllegalArgumentException("Assignments only support SUB_ADMIN or DEVELOPER roles");
        }
        if (member.getRole() != request.assignmentRole()) {
            throw new IllegalArgumentException("User role mismatch: expected " + request.assignmentRole() +
                    " but was " + member.getRole());
        }

        assignmentRepository.findByProjectAndMember(project, member)
                .ifPresent(existing -> {
                    throw new IllegalStateException("Member already assigned to project");
                });

        ProjectAssignment assignment = ProjectAssignment.builder()
                .project(project)
                .member(member)
                .assignmentRole(request.assignmentRole())
                .build();

        return ProjectAssignmentResponse.from(assignmentRepository.save(assignment));
    }

    public List<ProjectAssignmentResponse> getAssignmentsForProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found with id " + projectId));
        return assignmentRepository.findByProject(project)
                .stream()
                .map(ProjectAssignmentResponse::from)
                .toList();
    }

    public List<ProjectResponse> getProjectsForMember(Long memberId) {
        userService.getUserById(memberId);
        return assignmentRepository.findByMemberId(memberId)
                .stream()
                .map(ProjectAssignment::getProject)
                .distinct()
                .map(ProjectResponse::from)
                .toList();
    }

    public void removeAssignment(Long assignmentId) {
        assignmentRepository.deleteById(assignmentId);
    }
}
