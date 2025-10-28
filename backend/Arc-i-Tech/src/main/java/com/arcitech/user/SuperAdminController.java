package com.arcitech.user;

import com.arcitech.common.ApiResponse;
import com.arcitech.user.dto.RelationshipGraphResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/super-admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SuperAdminController {

    private final UserService userService;
    private final RelationshipGraphService relationshipGraphService;

    @PostMapping("/staff")
    public ApiResponse<UserProfile> createStaff(@Valid @RequestBody StaffAccountRequest request) {
        if (request.role() == Role.SUB_ADMIN) {
            return ApiResponse.success("Sub-admin created",
                    UserProfile.from(userService.createSubAdmin(request.fullName(), request.email(), request.password())));
        }
        if (request.role() == Role.DEVELOPER) {
            return ApiResponse.success("Developer created",
                    UserProfile.from(userService.createDeveloper(request.fullName(), request.email(), request.password())));
        }
        throw new IllegalArgumentException("Unsupported role for staff provisioning: " + request.role());
    }

    @GetMapping("/staff/sub-admins")
    public ApiResponse<List<UserProfile>> listSubAdmins() {
        return ApiResponse.success("Sub-admin roster", userService.getSubAdmins());
    }

    @GetMapping("/staff/developers")
    public ApiResponse<List<UserProfile>> listDevelopers() {
        return ApiResponse.success("Developer roster", userService.getDevelopers());
    }

    @GetMapping("/relationships")
    public ApiResponse<RelationshipGraphResponse> relationshipGraph() {
        return ApiResponse.success("Organization relationship graph", relationshipGraphService.buildOrganizationTree());
    }
}
