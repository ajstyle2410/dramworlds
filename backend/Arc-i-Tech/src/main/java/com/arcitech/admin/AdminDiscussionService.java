package com.arcitech.admin;

import com.arcitech.project.Project;
import com.arcitech.project.ProjectRepository;
import com.arcitech.user.Role;
import com.arcitech.user.User;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminDiscussionService {

    private final AdminDiscussionRepository discussionRepository;
    private final ProjectRepository projectRepository;

    public AdminDiscussionResponse createMessage(AdminDiscussionRequest request, User sender) {
        if (sender.getRole() != Role.SUPER_ADMIN && sender.getRole() != Role.SUB_ADMIN) {
            throw new IllegalStateException("Only administrators can start discussions");
        }

        Project project = null;
        if (request.projectId() != null) {
            project = projectRepository.findById(request.projectId())
                    .orElseThrow(() -> new EntityNotFoundException("Project not found with id " + request.projectId()));
        }

        AdminDiscussionMessage message = AdminDiscussionMessage.builder()
                .context(request.context())
                .project(project)
                .serviceCategory(request.serviceCategory())
                .subject(request.subject())
                .message(request.message())
                .progressRatio(request.progressRatio())
                .sender(sender)
                .build();

        return AdminDiscussionResponse.from(discussionRepository.save(message));
    }

    public List<AdminDiscussionResponse> fetchByContext(AdminDiscussionContext context) {
        return discussionRepository.findByContextOrderByCreatedAtDesc(context)
                .stream()
                .map(AdminDiscussionResponse::from)
                .toList();
    }

    public List<AdminDiscussionResponse> fetchByProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found with id " + projectId));
        return discussionRepository.findByProjectOrderByCreatedAtDesc(project)
                .stream()
                .map(AdminDiscussionResponse::from)
                .toList();
    }

    public List<AdminDiscussionResponse> fetchByServiceCategory(String category) {
        return discussionRepository.findByServiceCategoryOrderByCreatedAtDesc(category)
                .stream()
                .map(AdminDiscussionResponse::from)
                .toList();
    }
}
