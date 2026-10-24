package com.example.miniStore.dto.response;

import java.math.BigDecimal;

public record OrderItemResponse(
        Long productId,
        String name,
        String imageUrl,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal
) {
}
