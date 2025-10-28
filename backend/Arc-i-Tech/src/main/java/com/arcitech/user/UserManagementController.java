package com.arcitech.user;

import com.arcitech.common.ApiResponse;
import com.arcitech.user.dto.UserManagementRequest;
import com.arcitech.user.dto.UserStatusUpdateRequest;
import com.arcitech.user.dto.UserUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/user-management")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','SUB_ADMIN')")
public class UserManagementController {

    private final UserService userService;

    @GetMapping("/staff")
    public ApiResponse<List<UserProfile>> staff() {
        return ApiResponse.success("Staff roster", userService.listStaff());
    }

    @GetMapping("/customers")
    public ApiResponse<List<UserProfile>> customers() {
        return ApiResponse.success("Customers", userService.getCustomers());
    }

    @PostMapping("/users")
    public ApiResponse<UserProfile> createUser(@AuthenticationPrincipal User actor,
                                               @Valid @RequestBody UserManagementRequest request) {
        return ApiResponse.success("User created", userService.createUser(request, actor));
    }

    @PatchMapping("/users/{userId}")
    public ApiResponse<UserProfile> updateUser(@AuthenticationPrincipal User actor,
                                               @PathVariable Long userId,
                                               @Valid @RequestBody UserUpdateRequest request) {
        return ApiResponse.success("User updated", userService.updateUser(userId, request, actor));
    }

    @PatchMapping("/users/{userId}/status")
    public ApiResponse<UserProfile> updateStatus(@AuthenticationPrincipal User actor,
                                                 @PathVariable Long userId,
                                                 @Valid @RequestBody UserStatusUpdateRequest request) {
        return ApiResponse.success("Status updated", userService.updateStatus(userId, request, actor));
    }

    @DeleteMapping("/users/{userId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<Void> deleteUser(@AuthenticationPrincipal User actor,
                                        @PathVariable Long userId) {
        userService.deleteUser(userId, actor);
        return ApiResponse.success("User deleted", null);
    }
}
