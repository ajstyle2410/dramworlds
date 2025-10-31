package com.arcitech.programs;

import com.arcitech.common.ApiResponse;
import com.arcitech.programs.dto.DecideProductAccessRequest;
import com.arcitech.programs.dto.ProductAccessRequestDto;
import com.arcitech.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/program-access")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','SUB_ADMIN')")
public class ProductAccessAdminController {

    private final ProductAccessService service;

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<ProductAccessRequestDto>>> pending() {
        return ResponseEntity.ok(service.getPendingRequests());
    }

    @PatchMapping("/{requestId}")
    public ResponseEntity<ApiResponse<ProductAccessRequestDto>> decide(
            @PathVariable long requestId,
            @AuthenticationPrincipal User actor,
            @RequestBody @Valid DecideProductAccessRequest payload
    ) {
        return ResponseEntity.ok(service.decide(requestId, actor.getId(), payload));
    }
}
