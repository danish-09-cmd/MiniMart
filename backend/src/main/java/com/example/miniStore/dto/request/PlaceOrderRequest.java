package com.example.miniStore.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record PlaceOrderRequest(
        @NotNull(message = "Address ID is required") @Positive(message = "Address ID must be greater than zero") Long addressId
) {
}
