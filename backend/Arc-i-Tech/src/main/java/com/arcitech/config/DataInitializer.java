package com.arcitech.config;

import com.arcitech.admin.AdminDiscussionContext;
import com.arcitech.admin.AdminDiscussionMessage;
import com.arcitech.admin.AdminDiscussionRepository;
import com.arcitech.catalog.ServiceOffering;
import com.arcitech.catalog.ServiceOfferingRepository;
import com.arcitech.inquiry.Inquiry;
import com.arcitech.inquiry.InquiryRepository;
import com.arcitech.inquiry.InquiryStatus;
import com.arcitech.project.Project;
import com.arcitech.project.ProjectAssignment;
import com.arcitech.project.ProjectAssignmentRepository;
import com.arcitech.project.ProjectRepository;
import com.arcitech.project.ProjectStatus;
import com.arcitech.user.Role;
import com.arcitech.user.User;
import com.arcitech.user.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserService userService;
    private final ServiceOfferingRepository serviceOfferingRepository;
    private final ProjectRepository projectRepository;
    private final ProjectAssignmentRepository projectAssignmentRepository;
    private final AdminDiscussionRepository adminDiscussionRepository;
    private final InquiryRepository inquiryRepository;

    @Override
    public void run(String... args) {
        bootstrapUsers();
        bootstrapServices();
        Project demoProject = bootstrapProjects();
        bootstrapProjectAssignments(demoProject);
        bootstrapAdminDiscussions(demoProject);
        bootstrapInquiries(demoProject);
    }

    private void bootstrapUsers() {
        userService.createAdminIfMissing("Arc-i-Tech Admin", "admin@arcitech.com", "ChangeMe123!");
        userService.findByEmail("ops.lead@arcitech.com")
                .orElseGet(() -> userService.createSubAdmin("Operations Lead", "ops.lead@arcitech.com", "OpsLead123!"));
        userService.findByEmail("dev.lead@arcitech.com")
                .orElseGet(() -> userService.createDeveloper("Project Developer", "dev.lead@arcitech.com", "DevLead123!"));
    }

    private void bootstrapServices() {
        if (serviceOfferingRepository.count() > 0) {
            return;
        }

        List<ServiceOffering> offerings = List.of(
                ServiceOffering.builder()
                        .name("Website Development")
                        .shortDescription("Modern, responsive websites tailored to your brand.")
                        .detailedDescription("""
                                Full-stack website development including UI/UX design, front-end and back-end implementation,
                                CMS integration, and search engine optimisation.
                                """)
                        .category("Software Development")
                        .icon("globe")
                        .startingPrice(BigDecimal.valueOf(1500))
                        .featured(true)
                        .build(),
                ServiceOffering.builder()
                        .name("Android Applications")
                        .shortDescription("Native and cross-platform Android app development.")
                        .detailedDescription("""
                                Product discovery, UI design, native Android development, quality assurance, and deployment
                                to Google Play with analytics and growth support.
                                """)
                        .category("Mobile Apps")
                        .icon("smartphone")
                        .startingPrice(BigDecimal.valueOf(2000))
                        .featured(true)
                        .build(),
                ServiceOffering.builder()
                        .name("Desktop Applications")
                        .shortDescription("High-performance desktop software for Windows, Linux, and macOS.")
                        .detailedDescription("""
                                Bespoke desktop solutions, systems integration, and modernisation of legacy applications
                                with focus on security and scalability.
                                """)
                        .category("Software Development")
                        .icon("monitor")
                        .startingPrice(BigDecimal.valueOf(2500))
                        .featured(false)
                        .build(),
                ServiceOffering.builder()
                        .name("Project Mentorship")
                        .shortDescription("One-on-one mentorship for engineering and academic projects.")
                        .detailedDescription("""
                                Hands-on guidance for final year and professional projects, covering planning, architecture,
                                implementation coaching, and presentation review.
                                """)
                        .category("Mentorship")
                        .icon("graduation-cap")
                        .startingPrice(BigDecimal.valueOf(299))
                        .featured(true)
                        .build(),
                ServiceOffering.builder()
                        .name("Mock Interviews & Placement Guidance")
                        .shortDescription("Interview preparation aligned with industry expectations.")
                        .detailedDescription("""
                                Tailored mock interviews, feedback loops, resume reviews, and personalised growth plans to
                                accelerate placement success.
                                """)
                        .category("Career Support")
                        .icon("briefcase")
                        .startingPrice(BigDecimal.valueOf(149))
                        .featured(true)
                        .build(),
                ServiceOffering.builder()
                        .name("Technical Competency Building")
                        .shortDescription("Instructor-led programs to upskill your team.")
                        .detailedDescription("""
                                Workshops, bootcamps, and continuous learning programs focused on modern engineering
                                practices, cloud fundamentals, and emerging technologies.
                                """)
                        .category("Training")
                        .icon("lightbulb")
                        .startingPrice(BigDecimal.valueOf(499))
                        .featured(false)
                        .build(),
                ServiceOffering.builder()
                        .name("Software Consulting")
                        .shortDescription("Strategic consulting to align technology roadmaps with business goals.")
                        .detailedDescription("""
                                Architecture reviews, migration plans, performance audits, and vendor evaluations to keep
                                your digital investments focused and future-proof.
                                """)
                        .category("Consulting")
                        .icon("compass")
                        .startingPrice(BigDecimal.valueOf(1200))
                        .featured(true)
                        .build(),
                ServiceOffering.builder()
                        .name("Engineering Projects & Final Year Labs")
                        .shortDescription("End-to-end support for academic and capstone engineering initiatives.")
                        .detailedDescription("""
                                Domain ideation, documentation, prototype build, and viva preparation tailored for final
                                year engineering cohorts.
                                """)
                        .category("Academic")
                        .icon("flask")
                        .startingPrice(BigDecimal.valueOf(399))
                        .featured(true)
                        .build(),
                ServiceOffering.builder()
                        .name("Internship (Certificates)")
                        .shortDescription("Structured internship programmes with real-world product exposure.")
                        .detailedDescription("""
                                Eight-week sprints featuring mentor guidance, agile ceremonies, and completion
                                certificates to validate industry experience.
                                """)
                        .category("Career Support")
                        .icon("medal")
                        .startingPrice(BigDecimal.valueOf(249))
                        .featured(true)
                        .build(),
                ServiceOffering.builder()
                        .name("Mock Test Accelerator")
                        .shortDescription("Timed assessments to sharpen aptitude, coding, and domain readiness.")
                        .detailedDescription("""
                                Curated question banks, analytics-driven feedback, and sectional leaderboards to improve
                                placement outcomes.
                                """)
                        .category("Assessment")
                        .icon("check-circle")
                        .startingPrice(BigDecimal.valueOf(99))
                        .featured(false)
                        .build()
        );

        serviceOfferingRepository.saveAll(offerings);
        log.info("Seeded service catalogue with {} offerings", offerings.size());
    }

    private Project bootstrapProjects() {
        User demoCustomer = ensureCustomer("Arc-i-Tech Client", "client@arcitech.com", "Client123!");

        Project logisticsPortal = upsertProject("Logistics Intelligence Portal", project -> {
            project.setSummary("Analytics-driven portal to track shipments, automate invoicing, and manage partner ecosystem.");
            project.setDetails("""
                    The Arc-i-Tech team is building an enterprise-grade platform for a logistics company, enabling
                    real-time shipment tracking, predictive analytics for delays, and automated invoicing workflows.
                    """);
            project.setStatus(ProjectStatus.IN_DEVELOPMENT);
            project.setProgressPercentage(68);
            project.setStartDate(LocalDate.now().minusMonths(3));
            project.setTargetDate(LocalDate.now().plusWeeks(5));
            project.setHighlighted(true);
            project.setClient(demoCustomer);
        });

        upsertProject("Vendor Settlement Automation Suite", project -> {
            project.setSummary("Automated settlement engine reconciling carrier payouts across 17 logistics partners.");
            project.setDetails("""
                    Deployed a rules-driven settlement workflow with SAP integration, centralised dispute tracking, and automated
                    payout scheduling. Reduced month-end closure effort from 11 days to under 48 hours while improving audit readiness.
                    """);
            project.setStatus(ProjectStatus.DEPLOYED);
            project.setProgressPercentage(100);
            project.setStartDate(LocalDate.now().minusMonths(8));
            project.setTargetDate(LocalDate.now().minusWeeks(3));
            project.setHighlighted(true);
            project.setClient(demoCustomer);
        });

        User fintechCustomer = ensureCustomer("Stellar FinServe Ops", "ops@stellarfinserve.com", "Client123!");
        upsertProject("Compliance Analytics Control Tower", project -> {
            project.setSummary("Real-time compliance dashboards with anomaly detection for NBFC lending portfolio.");
            project.setDetails("""
                    Built stream-processing pipelines, configurable breach rules, and board-level reporting. Pilot covers 320 branches
                    with automated escalation workflows and weekly regulatory packs.
                    """);
            project.setStatus(ProjectStatus.TESTING);
            project.setProgressPercentage(92);
            project.setStartDate(LocalDate.now().minusMonths(5));
            project.setTargetDate(LocalDate.now().plusWeeks(2));
            project.setHighlighted(true);
            project.setClient(fintechCustomer);
        });

        User educationCustomer = ensureCustomer("CampusBridge Programs", "programs@campusbridge.in", "Client123!");
        upsertProject("SkillBridge Learning Hub", project -> {
            project.setSummary("Adaptive learning platform with cohort analytics and mentor collaboration spaces.");
            project.setDetails("""
                    Delivered modular content authoring, cohort dashboards, and integrated mentorship channels supporting 12 concurrent
                    university batches. Migration completed with zero downtime and 97% learner adoption.
                    """);
            project.setStatus(ProjectStatus.DEPLOYED);
            project.setProgressPercentage(100);
            project.setStartDate(LocalDate.now().minusMonths(10));
            project.setTargetDate(LocalDate.now().minusMonths(1));
            project.setHighlighted(true);
            project.setClient(educationCustomer);
        });

        return logisticsPortal;
    }

    private User ensureCustomer(String fullName, String email, String rawPassword) {
        return userService.findByEmail(email)
                .orElseGet(() -> userService.createCustomer(fullName, email, rawPassword));
    }

    private Project upsertProject(String name, java.util.function.Consumer<Project> projector) {
        Project project = projectRepository.findByName(name).orElseGet(Project::new);
        boolean isNew = project.getId() == null;
        project.setName(name);
        projector.accept(project);
        Project saved = projectRepository.save(project);
        if (isNew) {
            log.info("Created showcase project '{}' for {}", saved.getName(),
                    saved.getClient() != null ? saved.getClient().getEmail() : "unassigned client");
        }
        return saved;
    }

    private void bootstrapProjectAssignments(Project project) {
        if (project == null) {
            return;
        }

        User operationsLead = userService.findByEmail("ops.lead@arcitech.com")
                .orElse(null);
        User developerLead = userService.findByEmail("dev.lead@arcitech.com")
                .orElse(null);

        if (operationsLead == null || developerLead == null) {
            log.warn("Skipping project assignment seeding: required staff accounts are missing.");
            return;
        }

        int created = 0;

        if (projectAssignmentRepository.findByProjectAndMember(project, operationsLead).isEmpty()) {
            ProjectAssignment assignment = ProjectAssignment.builder()
                    .project(project)
                    .member(operationsLead)
                    .assignmentRole(Role.SUB_ADMIN)
                    .build();
            projectAssignmentRepository.save(assignment);
            created++;
        }

        if (projectAssignmentRepository.findByProjectAndMember(project, developerLead).isEmpty()) {
            ProjectAssignment assignment = ProjectAssignment.builder()
                    .project(project)
                    .member(developerLead)
                    .assignmentRole(Role.DEVELOPER)
                    .build();
            projectAssignmentRepository.save(assignment);
            created++;
        }

        if (created > 0) {
            log.info("Provisioned {} project assignment(s) for {}", created, project.getName());
        }
    }

    private void bootstrapAdminDiscussions(Project project) {
        if (adminDiscussionRepository.count() > 0) {
            return;
        }

        User superAdmin = userService.findByEmail("admin@arcitech.com").orElse(null);
        User operationsLead = userService.findByEmail("ops.lead@arcitech.com").orElse(null);

        if (superAdmin == null || operationsLead == null) {
            log.warn("Skipping admin discussion seeding: administrator accounts missing.");
            return;
        }

        List<AdminDiscussionMessage> seedMessages = new ArrayList<>();

        if (project != null) {
            seedMessages.add(AdminDiscussionMessage.builder()
                    .context(AdminDiscussionContext.PROJECT)
                    .project(project)
                    .subject("Sprint 4 planning & blockers")
                    .message("""
                            Operations reviewed the backlog with the client and aligned the integration timeline. The team will
                            focus on analytics dashboards and finalising the carrier onboarding wizard this sprint.
                            """)
                    .progressRatio(0.68d)
                    .sender(operationsLead)
                    .build());
        }

        seedMessages.add(AdminDiscussionMessage.builder()
                .context(AdminDiscussionContext.SERVICE)
                .serviceCategory("Website Development")
                .subject("Website bundle refresh")
                .message("""
                        Updating the standard website bundle to include a CMS onboarding workshop and revised SLA targets. Draft
                        playbook shared for review before publishing the pricing update.
                        """)
                .sender(superAdmin)
                .build());

        seedMessages.add(AdminDiscussionMessage.builder()
                .context(AdminDiscussionContext.OPERATIONS)
                .subject("Weekly operations sync")
                .message("""
                        Reminder to capture deployment checklists and QA notes before Friday. Let's also consolidate vendor access
                        requests so procurement can process them in a single batch.
                        """)
                .sender(superAdmin)
                .build());

        if (seedMessages.isEmpty()) {
            return;
        }

        adminDiscussionRepository.saveAll(seedMessages);
        log.info("Seeded {} admin discussion message(s)", seedMessages.size());
    }

    private void bootstrapInquiries(Project project) {
        if (inquiryRepository.count() >= 5) {
            return;
        }

        List<Inquiry> inquiries = new ArrayList<>();

        inquiries.add(Inquiry.builder()
                .fullName("Priya Menon")
                .email("priya.menon@example.com")
                .phone("+91-9988776655")
                .company("Nimbus Analytics")
                .message("We are exploring a data visualisation portal for our clients. Looking for discovery workshop and MVP build.")
                .assignedTo("ops.lead@arcitech.com")
                .source("Website contact form")
                .status(InquiryStatus.IN_DISCUSSION)
                .project(project)
                .build());

        inquiries.add(Inquiry.builder()
                .fullName("Rahul Verma")
                .email("rahul.verma@example.com")
                .phone("+91-9876543210")
                .company("CampusBridge")
                .message("Need mentorship support for final year IoT project along with weekly review sessions.")
                .assignedTo("mentor@arcitech.com")
                .source("Mentorship landing page")
                .status(InquiryStatus.NEW)
                .build());

        inquiries.add(Inquiry.builder()
                .fullName("Sneha Kulkarni")
                .email("sneha.kulkarni@example.com")
                .phone("+91-9123456780")
                .company("BrightWave Studios")
                .message("Interested in a multi-tenant content management system with role based access for our design teams.")
                .assignedTo("ops.lead@arcitech.com")
                .source("Referral")
                .status(InquiryStatus.QUOTED)
                .build());

        inquiries.add(Inquiry.builder()
                .fullName("Arjun Desai")
                .email("arjun.desai@example.com")
                .phone("+91-9255667788")
                .company("QuickKart Logistics")
                .message("Requesting proposal for revamping driver mobile app with offline support and analytics dashboard.")
                .assignedTo("dev.lead@arcitech.com")
                .source("Customer success outreach")
                .status(InquiryStatus.IN_DISCUSSION)
                .build());

        inquiries.add(Inquiry.builder()
                .fullName("Meera Joshi")
                .email("meera.joshi@example.com")
                .phone("+91-9345678123")
                .company("FutureLearn Academy")
                .message("Want to launch mock interview platform for batches starting next semester with payment integration.")
                .assignedTo("mentor@arcitech.com")
                .source("LinkedIn campaign")
                .status(InquiryStatus.NEW)
                .build());

        inquiryRepository.saveAll(inquiries);
        log.info("Seeded {} inquiry record(s)", inquiries.size());
    }
}
