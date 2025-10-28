package com.arcitech.reporting;

import com.arcitech.catalog.ServiceOfferingRepository;
import com.arcitech.inquiry.InquiryRepository;
import com.arcitech.project.Project;
import com.arcitech.project.ProjectAssignmentRepository;
import com.arcitech.project.ProjectRepository;
import com.arcitech.user.Role;
import com.arcitech.user.User;
import com.arcitech.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
public class ReportService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;

    private final ProjectRepository projectRepository;
    private final ProjectAssignmentRepository assignmentRepository;
    private final ServiceOfferingRepository serviceOfferingRepository;
    private final UserRepository userRepository;
    private final InquiryRepository inquiryRepository;

    public String exportProjectsCsv() {
        List<Project> projects = projectRepository.findAll();
        StringBuilder builder = new StringBuilder();
        builder.append("Project ID,Name,Client,Status,Progress %,Start Date,Target Date,Highlighted\n");
        projects.forEach(project -> builder.append(String.join(",",
                csv(project.getId()),
                csv(project.getName()),
                csv(project.getClient() != null ? project.getClient().getFullName() : ""),
                csv(project.getStatus().name()),
                csv(Integer.toString(project.getProgressPercentage())),
                csv(project.getStartDate() != null ? DATE_FORMATTER.format(project.getStartDate()) : ""),
                csv(project.getTargetDate() != null ? DATE_FORMATTER.format(project.getTargetDate()) : ""),
                csv(Boolean.toString(project.isHighlighted()))
        )).append("\n"));
        return builder.toString();
    }

    public String exportAssignmentsCsv() {
        var assignments = assignmentRepository.findAll();
        StringBuilder builder = new StringBuilder();
        builder.append("Assignment ID,Project ID,Project Name,Member,Email,Role,Assigned At\n");
        assignments.forEach(assignment -> builder.append(String.join(",",
                csv(assignment.getId()),
                csv(assignment.getProject().getId()),
                csv(assignment.getProject().getName()),
                csv(assignment.getMember().getFullName()),
                csv(assignment.getMember().getEmail()),
                csv(assignment.getAssignmentRole().name()),
                csv(assignment.getAssignedAt().toString())
        )).append("\n"));
        return builder.toString();
    }

    public String exportServicesCsv() {
        var services = serviceOfferingRepository.findAll();
        StringBuilder builder = new StringBuilder();
        builder.append("Service ID,Name,Category,Featured,Starting Price,Short Description\n");
        services.forEach(service -> builder.append(String.join(",",
                csv(service.getId()),
                csv(service.getName()),
                csv(service.getCategory()),
                csv(Boolean.toString(service.isFeatured())),
                csv(service.getStartingPrice() != null ? service.getStartingPrice().toPlainString() : ""),
                csv(service.getShortDescription())
        )).append("\n"));
        return builder.toString();
    }

    public String exportStaffCsv(Role role) {
        List<User> users = userRepository.findAll()
                .stream()
                .filter(user -> user.getRole() == role)
                .toList();
        return buildUserCsv(users);
    }

    public String exportInquiriesCsv() {
        var inquiries = inquiryRepository.findAll();
        StringBuilder builder = new StringBuilder();
        builder.append("Inquiry ID,Full Name,Email,Phone,Company,Status,Assigned To,Source,Created At\n");
        inquiries.forEach(inquiry -> builder.append(String.join(",",
                csv(inquiry.getId()),
                csv(inquiry.getFullName()),
                csv(inquiry.getEmail()),
                csv(inquiry.getPhone()),
                csv(inquiry.getCompany()),
                csv(inquiry.getStatus().name()),
                csv(inquiry.getAssignedTo()),
                csv(inquiry.getSource()),
                csv(inquiry.getCreatedAt().toString())
        )).append("\n"));
        return builder.toString();
    }

    private String buildUserCsv(List<User> users) {
        StringBuilder builder = new StringBuilder();
        builder.append("User ID,Full Name,Email,Role,Created At\n");
        users.forEach(user -> builder.append(String.join(",",
                csv(user.getId()),
                csv(user.getFullName()),
                csv(user.getEmail()),
                csv(user.getRole().name()),
                csv(user.getCreatedAt().toString())
        )).append("\n"));
        return builder.toString();
    }

    private static String csv(Object value) {
        if (value == null) {
            return "\"\"";
        }
        String stringValue = value.toString().replace("\"", "\"\"");
        return "\"" + stringValue + "\"";
    }
}
