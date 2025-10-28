package com.arcitech.reporting;

import com.arcitech.user.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/super-admin/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class ReportController {

    private final ReportService reportService;

    @GetMapping(value = "/projects", produces = "text/csv")
    public ResponseEntity<String> exportProjects() {
        return csvResponse("projects.csv", reportService.exportProjectsCsv());
    }

    @GetMapping(value = "/assignments", produces = "text/csv")
    public ResponseEntity<String> exportAssignments() {
        return csvResponse("project-assignments.csv", reportService.exportAssignmentsCsv());
    }

    @GetMapping(value = "/services", produces = "text/csv")
    public ResponseEntity<String> exportServices() {
        return csvResponse("services.csv", reportService.exportServicesCsv());
    }

    @GetMapping(value = "/staff", produces = "text/csv")
    public ResponseEntity<String> exportStaff(@RequestParam("role") Role role) {
        return csvResponse(role.name().toLowerCase() + "-staff.csv", reportService.exportStaffCsv(role));
    }

    @GetMapping(value = "/inquiries", produces = "text/csv")
    public ResponseEntity<String> exportInquiries() {
        return csvResponse("inquiries.csv", reportService.exportInquiriesCsv());
    }

    private ResponseEntity<String> csvResponse(String filename, String body) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(body);
    }
}
