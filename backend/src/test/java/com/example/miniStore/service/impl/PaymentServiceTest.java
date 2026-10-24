package com.example.miniStore.service.impl;

import com.example.miniStore.dto.request.MockPaymentRequest;
import com.example.miniStore.dto.response.MockPaymentResponse;
import com.example.miniStore.entity.CustomerOrder;
import com.example.miniStore.entity.OrderStatus;
import com.example.miniStore.entity.PaymentMethod;
import com.example.miniStore.entity.PaymentStatus;
import com.example.miniStore.entity.User;
import com.example.miniStore.exception.BadRequestException;
import com.example.miniStore.repository.CustomerOrderRepository;
import com.example.miniStore.service.AuthenticatedUserProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private CustomerOrderRepository orderRepository;

    @Mock
    private AuthenticatedUserProvider userProvider;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    private User user;
    private CustomerOrder order;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(7L);

        order = new CustomerOrder();
        order.setId(31L);
        order.setUser(user);
        order.setStatus(OrderStatus.PLACED);
        order.setPaymentStatus(PaymentStatus.PENDING);

        when(userProvider.currentUser()).thenReturn(user);
        when(orderRepository.findOwnedByIdForUpdate(order.getId(), user.getId())).thenReturn(java.util.Optional.of(order));
    }

    @Test
    void upiPaymentSucceeds() {
        // Given
        stubSavingOrder();

        // When
        MockPaymentResponse response = paymentService.pay(
                new MockPaymentRequest(order.getId(), PaymentMethod.UPI, null));

        // Then
        assertEquals(PaymentStatus.SUCCESS, response.paymentStatus());
        assertEquals(OrderStatus.PAID, response.orderStatus());
        assertEquals(PaymentStatus.SUCCESS, order.getPaymentStatus());
        assertEquals(OrderStatus.PAID, order.getStatus());
    }

    @Test
    void cardPaymentSucceedsWithAValidNumber() {
        // Given
        stubSavingOrder();

        // When
        MockPaymentResponse response = paymentService.pay(
                new MockPaymentRequest(order.getId(), PaymentMethod.CARD, "4111111111111111"));

        // Then
        assertEquals(PaymentStatus.SUCCESS, response.paymentStatus());
        assertEquals(OrderStatus.PAID, order.getStatus());
    }

    @Test
    void cardNumberEndingIn0000FailsAndLeavesOrderPlaced() {
        // Given
        stubSavingOrder();

        // When
        MockPaymentResponse response = paymentService.pay(
                new MockPaymentRequest(order.getId(), PaymentMethod.CARD, "4111111111110000"));

        // Then
        assertEquals(PaymentStatus.FAILED, response.paymentStatus());
        assertEquals(OrderStatus.PLACED, order.getStatus());
        assertEquals(PaymentStatus.FAILED, order.getPaymentStatus());
    }

    @Test
    void failedCardPaymentCanBeRetriedSuccessfully() {
        // Given
        stubSavingOrder();

        // When
        paymentService.pay(new MockPaymentRequest(order.getId(), PaymentMethod.CARD, "4111111111110000"));
        MockPaymentResponse retry = paymentService.pay(
                new MockPaymentRequest(order.getId(), PaymentMethod.CARD, "4111111111111111"));

        // Then
        assertEquals(PaymentStatus.SUCCESS, retry.paymentStatus());
        assertEquals(OrderStatus.PAID, retry.orderStatus());
    }

    @Test
    void codLeavesPaymentPendingUntilDelivery() {
        // Given
        stubSavingOrder();

        // When
        MockPaymentResponse response = paymentService.pay(
                new MockPaymentRequest(order.getId(), PaymentMethod.COD, null));

        // Then
        assertEquals(PaymentStatus.PENDING, response.paymentStatus());
        assertEquals(OrderStatus.PLACED, response.orderStatus());
        assertEquals(PaymentStatus.PENDING, order.getPaymentStatus());
    }

    @Test
    void cardPaymentWithoutANumberIsRejectedWithoutChangingTheOrder() {
        // Given
        // The order begins placed with a pending payment.

        // When / Then
        assertThrows(BadRequestException.class, () -> paymentService.pay(
                new MockPaymentRequest(order.getId(), PaymentMethod.CARD, null)));
        assertEquals(OrderStatus.PLACED, order.getStatus());
        assertEquals(PaymentStatus.PENDING, order.getPaymentStatus());
        verify(orderRepository, never()).save(any(CustomerOrder.class));
    }

    @Test
    void alreadyPaidOrderCannotBePaidAgain() {
        // Given
        order.setStatus(OrderStatus.PAID);
        order.setPaymentStatus(PaymentStatus.SUCCESS);

        // When / Then
        assertThrows(BadRequestException.class, () -> paymentService.pay(
                new MockPaymentRequest(order.getId(), PaymentMethod.UPI, null)));
        verify(orderRepository, never()).save(any(CustomerOrder.class));
    }

    private void stubSavingOrder() {
        when(orderRepository.save(any(CustomerOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }
}
