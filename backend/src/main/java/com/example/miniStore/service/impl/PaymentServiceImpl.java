package com.example.miniStore.service.impl;

import com.example.miniStore.dto.request.MockPaymentRequest;
import com.example.miniStore.dto.response.MockPaymentResponse;
import com.example.miniStore.entity.CustomerOrder;
import com.example.miniStore.entity.OrderStatus;
import com.example.miniStore.entity.PaymentMethod;
import com.example.miniStore.entity.PaymentStatus;
import com.example.miniStore.entity.User;
import com.example.miniStore.exception.BadRequestException;
import com.example.miniStore.exception.ResourceNotFoundException;
import com.example.miniStore.repository.CustomerOrderRepository;
import com.example.miniStore.service.AuthenticatedUserProvider;
import com.example.miniStore.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private final CustomerOrderRepository orderRepository;
    private final AuthenticatedUserProvider userProvider;

    @Override
    public MockPaymentResponse pay(MockPaymentRequest request) {
        User user = userProvider.currentUser();
        CustomerOrder order = orderRepository.findOwnedByIdForUpdate(request.orderId(), user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id " + request.orderId()));
        if (order.getStatus() != OrderStatus.PLACED) {
            log.warn("Payment rejected because order is not PLACED orderId={} status={}",
                    order.getId(), order.getStatus());
            throw new BadRequestException("Payment can only be attempted for an order with status PLACED");
        }
        if (order.getPaymentStatus() != PaymentStatus.PENDING
                && order.getPaymentStatus() != PaymentStatus.FAILED) {
            log.warn("Payment rejected because order is not payable orderId={} paymentStatus={}",
                    order.getId(), order.getPaymentStatus());
            throw new BadRequestException("Payment can only be attempted when payment status is PENDING or FAILED");
        }
        if (request.method() == PaymentMethod.CARD
                && (request.cardNumber() == null || request.cardNumber().isBlank())) {
            log.warn("Card payment rejected because no card number was provided orderId={}", order.getId());
            throw new BadRequestException("Card number is required for card payment");
        }

        order.setPaymentMethod(request.method());
        String message;
        if (request.method() == PaymentMethod.COD) {
            order.setPaymentStatus(PaymentStatus.PENDING);
            message = "Cash on delivery selected; payment is due when the order is delivered";
        } else if (request.method() == PaymentMethod.CARD
                && request.cardNumber() != null && request.cardNumber().endsWith("0000")) {
            order.setPaymentStatus(PaymentStatus.FAILED);
            message = "Mock card payment failed; retry with another card";
        } else {
            order.setPaymentStatus(PaymentStatus.SUCCESS);
            order.setStatus(OrderStatus.PAID);
            message = "Mock payment successful";
        }

        CustomerOrder saved = orderRepository.save(order);
        log.info("Mock payment result orderId={} method={} paymentStatus={} orderStatus={}", saved.getId(),
                request.method(), saved.getPaymentStatus(), saved.getStatus());
        return new MockPaymentResponse(saved.getId(), saved.getPaymentStatus(), saved.getStatus(), message);
    }
}
