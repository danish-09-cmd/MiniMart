package com.example.miniStore.service;

import com.example.miniStore.dto.request.MockPaymentRequest;
import com.example.miniStore.dto.response.MockPaymentResponse;

public interface PaymentService {
    MockPaymentResponse pay(MockPaymentRequest request);
}
