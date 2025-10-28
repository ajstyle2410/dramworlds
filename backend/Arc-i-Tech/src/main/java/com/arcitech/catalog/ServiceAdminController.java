package com.arcitech.catalog;

import com.arcitech.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ServiceAdminController {

    private final ServiceCatalogService catalogService;

    @PostMapping("/super-admin/services")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<ServiceOfferingResponse> createService(@Valid @RequestBody ServiceOfferingRequest request) {
        return ApiResponse.success("Service created", catalogService.create(request));
    }

    @PutMapping("/super-admin/services/{serviceId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<ServiceOfferingResponse> updateService(@PathVariable Long serviceId,
                                                              @Valid @RequestBody ServiceOfferingRequest request) {
        return ApiResponse.success("Service updated", catalogService.update(serviceId, request));
    }

    @DeleteMapping("/super-admin/services/{serviceId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<Void> deleteService(@PathVariable Long serviceId) {
        catalogService.delete(serviceId);
        return ApiResponse.success("Service deleted", null);
    }

    @GetMapping("/super-admin/services")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<List<ServiceOfferingResponse>> listServices() {
        return ApiResponse.success("All services", catalogService.getAllServices());
    }
}
