package com.example.miniStore.service;

import com.example.miniStore.entity.User;
import com.example.miniStore.exception.ResourceNotFoundException;
import com.example.miniStore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticatedUserProvider {

    private final UserRepository userRepository;

    public User currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            log.warn("Authenticated user lookup rejected because no user is present in the security context");
            throw new ResourceNotFoundException("Authenticated user not found");
        }
        return userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> {
                    log.warn("Authenticated account no longer exists");
                    return new ResourceNotFoundException("Authenticated user not found");
                });
    }

    public User currentUserForUpdate() {
        User current = currentUser();
        return userRepository.findByIdForUpdate(current.getId())
                .orElseThrow(() -> {
                    log.warn("Authenticated account disappeared before update lookup userId={}", current.getId());
                    return new ResourceNotFoundException("Authenticated user not found");
                });
    }
}
