package com.arcitech.programs.dto;

import com.arcitech.programs.DashboardProductKey;
import jakarta.validation.constraints.NotNull;

public record CreateProductAccessRequest(
        @NotNull DashboardProductKey productKey
) {
}
