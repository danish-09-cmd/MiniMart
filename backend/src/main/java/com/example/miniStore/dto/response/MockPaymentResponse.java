package com.example.miniStore.dto.response;

import com.example.miniStore.entity.OrderStatus;
import com.example.miniStore.entity.PaymentStatus;

public record MockPaymentResponse(
        Long orderId,
        PaymentStatus paymentStatus,
        OrderStatus orderStatus,
        String message
) {
}
