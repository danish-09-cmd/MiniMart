package com.example.miniStore.dto.response;

import java.math.BigDecimal;

public record CartItemResponse(
        Long productId,
        String name,
        String imageUrl,
        BigDecimal unitPrice,
        int quantity,
        BigDecimal lineTotal
) {
}
