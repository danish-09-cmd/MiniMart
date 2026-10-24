package com.example.miniStore.dto.response;

public record AuthResponse(
        String token,
        String tokenType,
        long expiresIn,
        UserProfileResponse user
) {
}
