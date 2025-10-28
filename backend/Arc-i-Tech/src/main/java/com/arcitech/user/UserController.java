package com.arcitech.user;

import com.arcitech.common.ApiResponse;
import com.arcitech.user.dto.CustomerTreeNode;
import com.arcitech.user.dto.SubAdminRelationshipResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final RelationshipGraphService relationshipGraphService;

    @GetMapping("/users/me")
    public ApiResponse<UserProfile> me(@AuthenticationPrincipal User currentUser) {
        return ApiResponse.success("Fetched profile", UserProfile.from(currentUser));
    }

    @GetMapping("/users/tree")
    public ApiResponse<CustomerTreeNode> customerTree(@AuthenticationPrincipal User currentUser,
                                                      @RequestParam(value = "customerId", required = false) Long customerId) {
        User target = currentUser;
        if (customerId != null && !customerId.equals(currentUser.getId())) {
            if (currentUser.getRole() == Role.CUSTOMER) {
                throw new AccessDeniedException("Customers can only view their own project tree");
            }
            target = userService.getUserById(customerId);
        }
        if (target.getRole() != Role.CUSTOMER) {
            throw new IllegalArgumentException("Requested user is not a customer");
        }
        return ApiResponse.success("Customer project tree", relationshipGraphService.buildCustomerTree(target));
    }

    @GetMapping("/admin/users")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','SUB_ADMIN')")
    public ApiResponse<List<UserProfile>> customers() {
        return ApiResponse.success("Fetched customers", userService.getCustomers());
    }

    @GetMapping("/admin/relationships")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','SUB_ADMIN')")
    public ApiResponse<SubAdminRelationshipResponse> adminRelationships(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(value = "subAdminId", required = false) Long subAdminId) {

        User target = currentUser;
        if (subAdminId != null && !subAdminId.equals(currentUser.getId())) {
            if (currentUser.getRole() != Role.SUPER_ADMIN) {
                throw new AccessDeniedException("Sub-admins can only view their own relationship tree");
            }
            target = userService.getUserById(subAdminId);
        }
        if (target.getRole() != Role.SUB_ADMIN) {
            throw new IllegalArgumentException("Requested user is not a sub-admin");
        }
        return ApiResponse.success("Sub-admin relationship tree", relationshipGraphService.buildSubAdminTree(target));
    }
}
