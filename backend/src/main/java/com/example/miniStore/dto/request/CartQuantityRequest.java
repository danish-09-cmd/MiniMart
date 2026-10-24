package com.example.miniStore.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CartQuantityRequest(
        @NotNull(message = "Quantity is required") @Min(value = 0, message = "Quantity must be zero or greater") Integer quantity
) {
}
