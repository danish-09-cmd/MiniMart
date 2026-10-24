package com.example.miniStore.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ProductResponse(
        Long id,
        String name,
        String description,
        BigDecimal price,
        Integer stockQuantity,
        String imageUrl,
        Long categoryId,
        String categoryName,
        boolean active,
        LocalDateTime createdAt
) {
}
