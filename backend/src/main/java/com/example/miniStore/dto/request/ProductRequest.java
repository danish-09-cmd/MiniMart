package com.example.miniStore.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ProductRequest(
        @NotBlank(message = "Product name is required") @Size(max = 150, message = "Product name must be at most 150 characters") String name,
        @NotBlank(message = "Product description is required") @Size(max = 2000, message = "Product description must be at most 2000 characters") String description,
        @NotNull(message = "Product price is required")
        @DecimalMin(value = "0.00", inclusive = false, message = "Product price must be greater than zero")
        @Digits(integer = 8, fraction = 2, message = "Product price must have at most 8 integer and 2 decimal digits") BigDecimal price,
        @NotNull(message = "Stock quantity is required") @Min(value = 0, message = "Stock quantity must be zero or greater") Integer stockQuantity,
        @NotNull(message = "Category ID is required") @Positive(message = "Category ID must be greater than zero") Long categoryId
) {
}
