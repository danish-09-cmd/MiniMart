package com.example.miniStore.dto.response;

public record AddressResponse(
        Long id,
        String fullName,
        String phone,
        String line1,
        String line2,
        String city,
        String state,
        String pincode,
        boolean defaultAddress
) {
}
