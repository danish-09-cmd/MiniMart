package com.example.miniStore.dto.response;

public record LowStockProductResponse(
        Long id,
        String name,
        int stock
) {
}
