package com.example.miniStore.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AddressRequest(
        @NotBlank(message = "Full name is required") @Size(max = 120, message = "Full name must be at most 120 characters") String fullName,
        @NotBlank(message = "Phone number is required")
        @Pattern(regexp = "\\d{10}", message = "Phone number must contain exactly 10 digits") String phone,
        @NotBlank(message = "Address line 1 is required") @Size(max = 200, message = "Address line 1 must be at most 200 characters") String line1,
        @Size(max = 200, message = "Address line 2 must be at most 200 characters") String line2,
        @NotBlank(message = "City is required") @Size(max = 100, message = "City must be at most 100 characters") String city,
        @NotBlank(message = "State is required") @Size(max = 100, message = "State must be at most 100 characters") String state,
        @NotBlank(message = "Pincode is required")
        @Pattern(regexp = "\\d{6}", message = "Pincode must contain exactly 6 digits") String pincode
) {
}
