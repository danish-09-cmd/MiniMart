package com.example.miniStore.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategoryRequest(
        @NotBlank(message = "Category name is required") @Size(max = 100, message = "Category name must be at most 100 characters") String name,
        @Size(max = 500, message = "Category description must be at most 500 characters") String description
) {
}
