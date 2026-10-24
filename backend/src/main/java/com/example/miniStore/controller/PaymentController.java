package com.example.miniStore.controller;

import com.example.miniStore.dto.request.MockPaymentRequest;
import com.example.miniStore.dto.response.MockPaymentResponse;
import com.example.miniStore.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.validation.annotation.Validated;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Validated
@Tag(name = "Payments")
@SecurityRequirement(name = "bearerAuth")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/mock")
    @Operation(summary = "Run a simulated payment for an order")
    public ResponseEntity<MockPaymentResponse> pay(@Valid @RequestBody MockPaymentRequest request) {
        return ResponseEntity.ok(paymentService.pay(request));
    }
}
