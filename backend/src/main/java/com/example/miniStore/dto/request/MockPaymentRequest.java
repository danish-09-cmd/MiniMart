package com.example.miniStore.dto.request;

import com.example.miniStore.entity.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

public record MockPaymentRequest(
        @NotNull(message = "Order ID is required") @Positive(message = "Order ID must be greater than zero") Long orderId,
        @NotNull(message = "Payment method is required") PaymentMethod method,
        @Pattern(regexp = "(?:[0-9]{12,19})?", message = "must contain 12 to 19 digits when provided") String cardNumber
) {
}
