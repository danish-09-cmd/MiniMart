package com.example.miniStore.service;

import com.example.miniStore.dto.request.LoginRequest;
import com.example.miniStore.dto.request.RegisterRequest;
import com.example.miniStore.dto.response.AuthResponse;
import com.example.miniStore.dto.response.UserProfileResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    UserProfileResponse getProfile(String email);
}
