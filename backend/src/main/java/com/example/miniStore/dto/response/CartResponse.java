package com.example.miniStore.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record CartResponse(
        List<CartItemResponse> items,
        BigDecimal grandTotal,
        long totalItems
) {
}
