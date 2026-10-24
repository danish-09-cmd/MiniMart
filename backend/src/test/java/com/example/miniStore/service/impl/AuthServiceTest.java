package com.example.miniStore.service.impl;

import com.example.miniStore.dto.request.LoginRequest;
import com.example.miniStore.dto.request.RegisterRequest;
import com.example.miniStore.dto.response.AuthResponse;
import com.example.miniStore.entity.Role;
import com.example.miniStore.entity.User;
import com.example.miniStore.repository.UserRepository;
import com.example.miniStore.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtService jwtService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "tokenExpirationMs", 3_600_000L);
    }

    @Test
    void registerStoresAHashedPasswordAndAssignsTheCustomerRole() {
        // Given
        when(userRepository.existsByEmailIgnoreCase("asha@example.com")).thenReturn(false);
        when(passwordEncoder.encode("StrongPass123")).thenReturn("bcrypt-hash");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(14L);
            return user;
        });
        when(jwtService.generateToken(any(User.class))).thenReturn("mock.jwt.token");

        // When
        AuthResponse response = authService.register(
                new RegisterRequest(" Asha ", "ASHA@example.com", "StrongPass123"));

        // Then
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertEquals("asha@example.com", userCaptor.getValue().getEmail());
        assertEquals("bcrypt-hash", userCaptor.getValue().getPassword());
        assertEquals(Role.ROLE_USER, userCaptor.getValue().getRole());
        assertEquals("mock.jwt.token", response.token());
        assertEquals(3_600L, response.expiresIn());
    }

    @Test
    void loginAuthenticatesAndReturnsTheCurrentAccount() {
        // Given
        User user = new User();
        user.setId(8L);
        user.setName("Asha");
        user.setEmail("asha@example.com");
        user.setRole(Role.ROLE_USER);
        Authentication authentication = UsernamePasswordAuthenticationToken.authenticated(
                "asha@example.com", null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
        when(authenticationManager.authenticate(any(Authentication.class))).thenReturn(authentication);
        when(userRepository.findByEmailIgnoreCase("asha@example.com")).thenReturn(Optional.of(user));
        when(jwtService.generateToken(user)).thenReturn("mock.jwt.token");

        // When
        AuthResponse response = authService.login(new LoginRequest("ASHA@example.com", "password"));

        // Then
        assertEquals("mock.jwt.token", response.token());
        assertEquals(user.getId(), response.user().id());
        assertEquals(user.getEmail(), response.user().email());
        verify(authenticationManager).authenticate(any(Authentication.class));
    }

    @Test
    void loginRejectsBadCredentialsWithoutCreatingAJwt() {
        // Given
        when(authenticationManager.authenticate(any(Authentication.class)))
                .thenThrow(new BadCredentialsException("internal detail"));

        // When / Then
        assertThrows(BadCredentialsException.class,
                () -> authService.login(new LoginRequest("asha@example.com", "password")));
        verify(jwtService, never()).generateToken(any(User.class));
    }
}
