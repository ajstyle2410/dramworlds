package com.arcitech.catalog;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ServiceCatalogService {

    private final ServiceOfferingRepository repository;

    @Transactional(readOnly = true)
    public List<ServiceOfferingResponse> getFeaturedServices() {
        return repository.findByFeaturedTrueOrderByIdAsc()
                .stream()
                .map(ServiceOfferingResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ServiceOfferingResponse> getAllServices() {
        return repository.findAll()
                .stream()
                .sorted((a, b) -> a.getName().compareToIgnoreCase(b.getName()))
                .map(ServiceOfferingResponse::from)
                .toList();
    }

    @Transactional
    public ServiceOfferingResponse create(ServiceOfferingRequest request) {
        ServiceOffering offering = ServiceOffering.builder()
                .name(request.name())
                .shortDescription(request.shortDescription())
                .detailedDescription(request.detailedDescription())
                .category(request.category())
                .icon(request.icon())
                .startingPrice(request.startingPrice())
                .featured(Boolean.TRUE.equals(request.featured()))
                .build();
        return ServiceOfferingResponse.from(repository.save(offering));
    }

    @Transactional
    public ServiceOfferingResponse update(Long serviceId, ServiceOfferingRequest request) {
        ServiceOffering offering = repository.findById(serviceId)
                .orElseThrow(() -> new IllegalArgumentException("Service not found with id " + serviceId));
        offering.setName(request.name());
        offering.setShortDescription(request.shortDescription());
        offering.setDetailedDescription(request.detailedDescription());
        offering.setCategory(request.category());
        offering.setIcon(request.icon());
        offering.setStartingPrice(request.startingPrice());
        offering.setFeatured(Boolean.TRUE.equals(request.featured()));
        return ServiceOfferingResponse.from(repository.save(offering));
    }

    @Transactional
    public void delete(Long serviceId) {
        repository.deleteById(serviceId);
    }
}
