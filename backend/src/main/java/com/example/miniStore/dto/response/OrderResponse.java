package com.example.miniStore.dto.response;

import com.example.miniStore.entity.OrderStatus;
import com.example.miniStore.entity.PaymentMethod;
import com.example.miniStore.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        Long id,
        LocalDateTime createdAt,
        BigDecimal totalAmount,
        OrderStatus status,
        PaymentStatus paymentStatus,
        PaymentMethod paymentMethod,
        AddressSnapshotResponse address,
        List<OrderItemResponse> items,
        Long customerId,
        String customerName,
        String customerEmail
) {
}
