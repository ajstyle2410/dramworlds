package com.arcitech.catalog;

import com.arcitech.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
public class ServiceCatalogController {

    private final ServiceCatalogService serviceCatalogService;

    @GetMapping
    public ApiResponse<List<ServiceOfferingResponse>> allServices() {
        return ApiResponse.success("Service catalogue", serviceCatalogService.getAllServices());
    }

    @GetMapping("/featured")
    public ApiResponse<List<ServiceOfferingResponse>> featured() {
        return ApiResponse.success("Featured services", serviceCatalogService.getFeaturedServices());
    }
}
