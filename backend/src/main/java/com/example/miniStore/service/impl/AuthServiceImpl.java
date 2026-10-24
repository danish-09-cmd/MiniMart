package com.example.miniStore.service.impl;

import com.example.miniStore.dto.request.LoginRequest;
import com.example.miniStore.dto.request.RegisterRequest;
import com.example.miniStore.dto.response.AuthResponse;
import com.example.miniStore.dto.response.UserProfileResponse;
import com.example.miniStore.entity.Role;
import com.example.miniStore.entity.User;
import com.example.miniStore.repository.UserRepository;
import com.example.miniStore.security.JwtService;
import com.example.miniStore.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.jwt.expiration-ms}")
    private long tokenExpirationMs;

    @Override
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            log.warn("Registration rejected because the email is already registered");
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
        }

        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(Role.ROLE_USER);
        user = userRepository.save(user);

        log.info("Registered account id={}", user.getId());
        return createAuthResponse(user);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                    request.email().trim().toLowerCase(Locale.ROOT), request.password()));
        } catch (AuthenticationException exception) {
            log.warn("Login rejected due to invalid credentials");
            throw exception;
        }
        User user = userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new UsernameNotFoundException("Account not found"));

        log.info("Login succeeded for account id={}", user.getId());
        return createAuthResponse(user);
    }

    @Override
    public UserProfileResponse getProfile(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UsernameNotFoundException("Account not found"));
        return toProfile(user);
    }

    private AuthResponse createAuthResponse(User user) {
        return new AuthResponse(jwtService.generateToken(user), "Bearer", tokenExpirationMs / 1000,
                toProfile(user));
    }

    private UserProfileResponse toProfile(User user) {
        return new UserProfileResponse(user.getId(), user.getName(), user.getEmail(),
                user.getRole().name(), user.getCreatedAt());
    }
}
