package com.arcitech.inquiry;

import com.arcitech.project.Project;
import com.arcitech.project.ProjectRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class InquiryService {

    private final InquiryRepository inquiryRepository;
    private final ProjectRepository projectRepository;

    public InquiryResponse createInquiry(InquiryRequest request) {
        Inquiry inquiry = Inquiry.builder()
                .fullName(request.fullName())
                .email(request.email())
                .phone(request.phone())
                .company(request.company())
                .message(request.message())
                .source(request.source())
                .status(InquiryStatus.NEW)
                .project(resolveProject(request.projectId()))
                .build();
        return InquiryResponse.from(inquiryRepository.save(inquiry));
    }

    public List<InquiryResponse> getAllInquiries() {
        return inquiryRepository.findAll()
                .stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(InquiryResponse::from)
                .toList();
    }

    public InquiryResponse updateInquiry(Long id, InquiryUpdateRequest request) {
        Inquiry inquiry = inquiryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Inquiry not found with id " + id));
        inquiry.setStatus(request.status());
        inquiry.setAssignedTo(request.assignedTo());
        return InquiryResponse.from(inquiryRepository.save(inquiry));
    }

    public List<InquiryResponse> findByProject(Project project) {
        return inquiryRepository.findByProject(project).stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(InquiryResponse::from)
                .toList();
    }

    private Project resolveProject(Long projectId) {
        if (projectId == null) {
            return null;
        }
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found with id " + projectId));
    }
}
