package com.arcitech.programs;

import com.arcitech.programs.dto.ProductAccessRequestDto;
import com.arcitech.user.User;

public final class ProductAccessMapper {

    private ProductAccessMapper() {
    }

    public static ProductAccessRequestDto toDto(ProductAccessRequest entity) {
        User decidedBy = entity.getDecidedBy();
        return new ProductAccessRequestDto(
                entity.getId(),
                entity.getUser().getId(),
                entity.getUser().getFullName(),
                entity.getProductKey(),
                entity.getStatus(),
                entity.getNote(),
                entity.getSubmittedAt(),
                entity.getDecidedAt(),
                decidedBy != null ? decidedBy.getId() : null,
                decidedBy != null ? decidedBy.getFullName() : null
        );
    }
}
