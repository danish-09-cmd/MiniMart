package com.example.miniStore.dto.request;

import com.example.miniStore.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record OrderStatusRequest(
        @NotNull(message = "Order status is required") OrderStatus status
) {
}
