package com.arcitech.admin;

import com.arcitech.common.ApiResponse;
import com.arcitech.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/discussions")
@RequiredArgsConstructor
public class AdminDiscussionController {

    private final AdminDiscussionService discussionService;

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','SUB_ADMIN')")
    @PostMapping
    public ApiResponse<AdminDiscussionResponse> postMessage(@AuthenticationPrincipal User sender,
                                                            @Valid @RequestBody AdminDiscussionRequest request) {
        return ApiResponse.success("Message posted", discussionService.createMessage(request, sender));
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','SUB_ADMIN','DEVELOPER')")
    @GetMapping("/context/{context}")
    public ApiResponse<List<AdminDiscussionResponse>> listByContext(@PathVariable AdminDiscussionContext context) {
        return ApiResponse.success("Discussion feed", discussionService.fetchByContext(context));
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','SUB_ADMIN')")
    @GetMapping("/project/{projectId}")
    public ApiResponse<List<AdminDiscussionResponse>> listByProject(@PathVariable Long projectId) {
        return ApiResponse.success("Project discussion", discussionService.fetchByProject(projectId));
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','SUB_ADMIN')")
    @GetMapping("/service")
    public ApiResponse<List<AdminDiscussionResponse>> listByServiceCategory(@RequestParam("category") String category) {
        return ApiResponse.success("Service discussion", discussionService.fetchByServiceCategory(category));
    }
}
