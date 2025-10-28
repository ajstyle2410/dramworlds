package com.arcitech.catalog;

import java.math.BigDecimal;

public record ServiceOfferingResponse(
        Long id,
        String name,
        String shortDescription,
        String detailedDescription,
        String category,
        String icon,
        BigDecimal startingPrice,
        boolean featured
) {
    public static ServiceOfferingResponse from(ServiceOffering offering) {
        return new ServiceOfferingResponse(
                offering.getId(),
                offering.getName(),
                offering.getShortDescription(),
                offering.getDetailedDescription(),
                offering.getCategory(),
                offering.getIcon(),
                offering.getStartingPrice(),
                offering.isFeatured()
        );
    }
}
