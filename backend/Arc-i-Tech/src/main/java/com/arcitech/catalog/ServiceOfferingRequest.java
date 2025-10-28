package com.arcitech.catalog;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ServiceOfferingRequest(
        @NotBlank(message = "Service name is required")
        @Size(min = 3, max = 160)
        String name,

        @NotBlank(message = "Short description is required")
        @Size(min = 10, max = 255)
        String shortDescription,

        @Size(max = 8000)
        String detailedDescription,

        @NotBlank(message = "Category is required")
        @Size(max = 120)
        String category,

        @Size(max = 120)
        String icon,

        @DecimalMin(value = "0.0", inclusive = false, message = "Starting price must be positive")
        BigDecimal startingPrice,

        @NotNull(message = "Featured flag is required")
        Boolean featured
) {
}
