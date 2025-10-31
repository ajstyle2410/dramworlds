package com.arcitech.programs.dto;

import com.arcitech.programs.ProductAccessStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record DecideProductAccessRequest(
        @NotNull ProductAccessStatus status,
        @Size(max = 500) String note
) {
}
