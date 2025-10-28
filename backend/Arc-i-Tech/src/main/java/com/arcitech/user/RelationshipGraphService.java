package com.arcitech.user;

import com.arcitech.project.Project;
import com.arcitech.project.ProjectAssignment;
import com.arcitech.project.ProjectAssignmentRepository;
import com.arcitech.project.ProjectRepository;
import com.arcitech.project.ProjectTask;
import com.arcitech.project.ProjectTaskRepository;
import com.arcitech.project.TaskStatus;
import com.arcitech.user.dto.CustomerTreeNode;
import com.arcitech.user.dto.ProjectTeamNode;
import com.arcitech.user.dto.RelationshipGraphResponse;
import com.arcitech.user.dto.StaffSummary;
import com.arcitech.user.dto.SubAdminRelationshipResponse;
import com.arcitech.user.Role;
import com.arcitech.user.User;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(Transactional.TxType.SUPPORTS)
public class RelationshipGraphService {

    private final ProjectRepository projectRepository;
    private final ProjectAssignmentRepository projectAssignmentRepository;
    private final ProjectTaskRepository projectTaskRepository;
    private final UserRepository userRepository;

    public RelationshipGraphResponse buildOrganizationTree() {
        List<Project> projects = projectRepository.findAll();
        List<ProjectAssignment> assignments = projectAssignmentRepository.findAll();
        List<ProjectTask> tasks = projectTaskRepository.findAll();

        Map<Long, List<ProjectAssignment>> assignmentsByProject = assignments.stream()
                .collect(Collectors.groupingBy(pa -> pa.getProject().getId()));
        Map<Long, List<ProjectTask>> tasksByProject = tasks.stream()
                .collect(Collectors.groupingBy(task -> task.getProject().getId()));

        Map<Long, ProjectTeamNode> projectNodes = new LinkedHashMap<>();
        for (Project project : projects) {
            List<ProjectAssignment> projectAssignments = assignmentsByProject.getOrDefault(project.getId(), List.of());
            List<ProjectTask> projectTasks = tasksByProject.getOrDefault(project.getId(), List.of());
            projectNodes.put(project.getId(), toProjectTeamNode(project, projectAssignments, projectTasks));
        }

        Map<Long, List<ProjectTeamNode>> projectsByCustomer = projectNodes.values().stream()
                .filter(node -> node.customer() != null)
                .collect(Collectors.groupingBy(node -> node.customer().id(), LinkedHashMap::new, Collectors.toList()));

        List<CustomerTreeNode> customerTrees = projectsByCustomer.values().stream()
                .map(nodes -> new CustomerTreeNode(nodes.get(0).customer(), nodes.stream()
                        .sorted(Comparator.comparing(ProjectTeamNode::name, String.CASE_INSENSITIVE_ORDER))
                        .toList()))
                .sorted(Comparator.comparing(tree -> tree.customer().fullName(), String.CASE_INSENSITIVE_ORDER))
                .toList();

        List<User> subAdminUsers = userRepository.findByRole(Role.SUB_ADMIN);
        Map<Long, List<ProjectTeamNode>> projectsBySubAdmin = new LinkedHashMap<>();
        for (ProjectAssignment assignment : assignments) {
            if (assignment.getAssignmentRole() == Role.SUB_ADMIN) {
                Long memberId = assignment.getMember().getId();
                projectsBySubAdmin.computeIfAbsent(memberId, id -> new ArrayList<>())
                        .add(projectNodes.get(assignment.getProject().getId()));
            }
        }

        List<SubAdminRelationshipResponse> subAdminTrees = subAdminUsers.stream()
                .map(subAdmin -> {
                    List<ProjectTeamNode> nodes = projectsBySubAdmin.getOrDefault(subAdmin.getId(), List.of()).stream()
                            .collect(Collectors.collectingAndThen(Collectors.toCollection(() -> new LinkedHashSet<>()), ArrayList::new));
                    return new SubAdminRelationshipResponse(StaffSummary.from(subAdmin), nodes);
                })
                .sorted(Comparator.comparing(tree -> tree.subAdmin().fullName(), String.CASE_INSENSITIVE_ORDER))
                .toList();

        Set<Long> assignedSubAdminIds = assignments.stream()
                .filter(pa -> pa.getAssignmentRole() == Role.SUB_ADMIN)
                .map(pa -> pa.getMember().getId())
                .collect(Collectors.toSet());

        Set<Long> assignedDeveloperIds = assignments.stream()
                .filter(pa -> pa.getAssignmentRole() == Role.DEVELOPER)
                .map(pa -> pa.getMember().getId())
                .collect(Collectors.toSet());

        List<StaffSummary> unassignedSubAdmins = subAdminUsers.stream()
                .filter(user -> !assignedSubAdminIds.contains(user.getId()))
                .map(StaffSummary::from)
                .sorted(Comparator.comparing(StaffSummary::fullName, String.CASE_INSENSITIVE_ORDER))
                .toList();

        List<User> developerUsers = userRepository.findByRole(Role.DEVELOPER);
        List<StaffSummary> unassignedDevelopers = developerUsers.stream()
                .filter(user -> !assignedDeveloperIds.contains(user.getId()))
                .map(StaffSummary::from)
                .sorted(Comparator.comparing(StaffSummary::fullName, String.CASE_INSENSITIVE_ORDER))
                .toList();

        List<ProjectTeamNode> unassignedProjects = projectNodes.values().stream()
                .filter(node -> node.customer() == null)
                .sorted(Comparator.comparing(ProjectTeamNode::name, String.CASE_INSENSITIVE_ORDER))
                .toList();

        return new RelationshipGraphResponse(customerTrees, subAdminTrees, unassignedSubAdmins, unassignedDevelopers, unassignedProjects);
    }

    public CustomerTreeNode buildCustomerTree(User customer) {
        List<Project> projects = projectRepository.findByClientOrderByUpdatedAtDesc(customer);
        Map<Long, List<ProjectTask>> tasksByProject = projectTaskRepository.findAll().stream()
                .collect(Collectors.groupingBy(task -> task.getProject().getId()));

        List<ProjectTeamNode> nodes = projects.stream()
                .map(project -> toProjectTeamNode(
                        project,
                        projectAssignmentRepository.findByProject(project),
                        tasksByProject.getOrDefault(project.getId(), List.of())))
                .toList();
        return new CustomerTreeNode(StaffSummary.from(customer), nodes);
    }

    public SubAdminRelationshipResponse buildSubAdminTree(User subAdmin) {
        List<ProjectAssignment> assignments = projectAssignmentRepository.findByMember(subAdmin);
        Map<Long, List<ProjectAssignment>> grouped = assignments.stream()
                .collect(Collectors.groupingBy(pa -> pa.getProject().getId()));
        Map<Long, List<ProjectTask>> tasksByProject = projectTaskRepository.findAll().stream()
                .collect(Collectors.groupingBy(task -> task.getProject().getId()));

        List<ProjectTeamNode> nodes = grouped.entrySet().stream()
                .map(entry -> toProjectTeamNode(
                        entry.getValue().get(0).getProject(),
                        entry.getValue(),
                        tasksByProject.getOrDefault(entry.getKey(), List.of())))
                .sorted(Comparator.comparing(ProjectTeamNode::name, String.CASE_INSENSITIVE_ORDER))
                .toList();
        return new SubAdminRelationshipResponse(StaffSummary.from(subAdmin), nodes);
    }

    private ProjectTeamNode toProjectTeamNode(Project project,
                                              List<ProjectAssignment> assignments,
                                              List<ProjectTask> tasks) {
        List<ProjectAssignment> safeAssignments = assignments == null ? List.of() : assignments;

        Map<Boolean, List<ProjectAssignment>> grouped = safeAssignments.stream()
                .collect(Collectors.partitioningBy(pa -> pa.getAssignmentRole() == Role.SUB_ADMIN));

        List<StaffSummary> subAdmins = grouped.getOrDefault(true, List.of()).stream()
                .map(ProjectAssignment::getMember)
                .filter(Objects::nonNull)
                .map(StaffSummary::from)
                .distinct()
                .sorted(Comparator.comparing(StaffSummary::fullName, String.CASE_INSENSITIVE_ORDER))
                .toList();

        List<StaffSummary> developers = grouped.getOrDefault(false, List.of()).stream()
                .filter(pa -> pa.getAssignmentRole() == Role.DEVELOPER)
                .map(ProjectAssignment::getMember)
                .filter(Objects::nonNull)
                .map(StaffSummary::from)
                .distinct()
                .sorted(Comparator.comparing(StaffSummary::fullName, String.CASE_INSENSITIVE_ORDER))
                .toList();

        StaffSummary customer = project.getClient() != null ? StaffSummary.from(project.getClient()) : null;
        String targetDate = project.getTargetDate() != null ? project.getTargetDate().toString() : null;

        int totalTasks = tasks == null ? 0 : tasks.size();
        int completedTasks = tasks == null ? 0 :
                (int) tasks.stream().filter(task -> task.getStatus() == TaskStatus.DONE).count();
        int openTasks = totalTasks - completedTasks;

        return new ProjectTeamNode(
                project.getId(),
                project.getName(),
                project.getStatus(),
                project.getProgressPercentage(),
                project.getSummary(),
                targetDate,
                customer,
                subAdmins,
                developers,
                totalTasks,
                openTasks,
                completedTasks
        );
    }
}
