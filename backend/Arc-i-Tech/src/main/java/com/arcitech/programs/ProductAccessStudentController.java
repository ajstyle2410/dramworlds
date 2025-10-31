package com.arcitech.programs;

import com.arcitech.common.ApiResponse;
import com.arcitech.programs.dto.CreateProductAccessRequest;
import com.arcitech.programs.dto.ProductAccessRequestDto;
import com.arcitech.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard/access")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CUSTOMER')")
public class ProductAccessStudentController {

    private final ProductAccessService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductAccessRequestDto>>> myRequests(
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(service.getRequestsForUser(user.getId()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProductAccessRequestDto>> requestAccess(
            @AuthenticationPrincipal User user,
            @RequestBody @Valid CreateProductAccessRequest payload
    ) {
        return ResponseEntity.ok(service.createRequest(user.getId(), payload));
    }
}
