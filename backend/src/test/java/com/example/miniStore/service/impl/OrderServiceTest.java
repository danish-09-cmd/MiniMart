package com.example.miniStore.service.impl;

import com.example.miniStore.dto.request.OrderStatusRequest;
import com.example.miniStore.dto.request.PlaceOrderRequest;
import com.example.miniStore.entity.Address;
import com.example.miniStore.entity.CartItem;
import com.example.miniStore.entity.CustomerOrder;
import com.example.miniStore.entity.OrderItem;
import com.example.miniStore.entity.OrderStatus;
import com.example.miniStore.entity.PaymentMethod;
import com.example.miniStore.entity.PaymentStatus;
import com.example.miniStore.entity.Product;
import com.example.miniStore.entity.User;
import com.example.miniStore.exception.BadRequestException;
import com.example.miniStore.exception.InsufficientStockException;
import com.example.miniStore.exception.ResourceNotFoundException;
import com.example.miniStore.repository.AddressRepository;
import com.example.miniStore.repository.CartItemRepository;
import com.example.miniStore.repository.CustomerOrderRepository;
import com.example.miniStore.repository.ProductRepository;
import com.example.miniStore.service.AuthenticatedUserProvider;
import com.example.miniStore.service.OrderResponseMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private CustomerOrderRepository orderRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private AuthenticatedUserProvider userProvider;

    @Mock
    private OrderResponseMapper responseMapper;

    @InjectMocks
    private OrderServiceImpl orderService;

    private User user;
    private Address address;
    private Product product;
    private CartItem cartItem;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(7L);
        user.setName("Asha");
        user.setEmail("asha@example.com");

        address = new Address();
        address.setId(9L);
        address.setUser(user);
        address.setFullName("Asha Sharma");
        address.setPhone("9876543210");
        address.setLine1("12 Main Road");
        address.setCity("Bengaluru");
        address.setState("Karnataka");
        address.setPincode("560001");

        product = new Product();
        product.setId(15L);
        product.setName("Rice");
        product.setPrice(new BigDecimal("12.50"));
        product.setStockQuantity(8);
        product.setActive(true);

        cartItem = new CartItem();
        cartItem.setUser(user);
        cartItem.setProduct(product);
        cartItem.setQuantity(2);
    }

    @Test
    void placeOrderCalculatesPurchasePricesReducesStockAndClearsCart() {
        // Given
        stubCheckout();
        when(orderRepository.save(any(CustomerOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        orderService.placeOrder(new PlaceOrderRequest(address.getId()));

        // Then
        ArgumentCaptor<CustomerOrder> orderCaptor = ArgumentCaptor.forClass(CustomerOrder.class);
        verify(orderRepository).save(orderCaptor.capture());
        CustomerOrder placedOrder = orderCaptor.getValue();
        assertEquals(new BigDecimal("25.00"), placedOrder.getTotalAmount());
        assertEquals(OrderStatus.PLACED, placedOrder.getStatus());
        assertEquals(PaymentStatus.PENDING, placedOrder.getPaymentStatus());
        assertEquals(1, placedOrder.getItems().size());
        assertEquals(new BigDecimal("12.50"), placedOrder.getItems().get(0).getPriceAtPurchase());
        assertEquals(2, placedOrder.getItems().get(0).getQuantity());
        assertEquals(6, product.getStockQuantity());
        verify(cartItemRepository).deleteAllForUser(user.getId());
    }

    @Test
    void placeOrderRejectsAnEmptyCart() {
        // Given
        when(userProvider.currentUserForUpdate()).thenReturn(user);
        when(addressRepository.findByIdAndUser_Id(address.getId(), user.getId()))
                .thenReturn(Optional.of(address));
        when(cartItemRepository.findByUser_IdOrderByProduct_IdAsc(user.getId())).thenReturn(List.of());

        // When / Then
        assertThrows(BadRequestException.class,
                () -> orderService.placeOrder(new PlaceOrderRequest(address.getId())));
        verify(orderRepository, never()).save(any(CustomerOrder.class));
        verify(cartItemRepository, never()).deleteAllForUser(user.getId());
    }

    @Test
    void placeOrderWithInsufficientStockChangesNothing() {
        // Given
        product.setStockQuantity(1);
        cartItem.setQuantity(2);
        stubCheckout();

        // When / Then
        assertThrows(InsufficientStockException.class,
                () -> orderService.placeOrder(new PlaceOrderRequest(address.getId())));
        assertEquals(1, product.getStockQuantity());
        verify(orderRepository, never()).save(any(CustomerOrder.class));
        verify(cartItemRepository, never()).deleteAllForUser(user.getId());
    }

    @Test
    void placeOrderRejectsAnAddressOwnedByAnotherUser() {
        // Given
        when(userProvider.currentUserForUpdate()).thenReturn(user);
        when(addressRepository.findByIdAndUser_Id(address.getId(), user.getId())).thenReturn(Optional.empty());

        // When / Then
        assertThrows(ResourceNotFoundException.class,
                () -> orderService.placeOrder(new PlaceOrderRequest(address.getId())));
        verify(cartItemRepository, never()).findByUser_IdOrderByProduct_IdAsc(user.getId());
        verify(orderRepository, never()).save(any(CustomerOrder.class));
    }

    @Test
    void cancelPlacedOrderRestoresProductStock() {
        // Given
        CustomerOrder order = order(OrderStatus.PLACED, PaymentStatus.PENDING, PaymentMethod.COD);
        OrderItem item = new OrderItem();
        item.setOrder(order);
        item.setProduct(product);
        item.setQuantity(3);
        order.setItems(new ArrayList<>(List.of(item)));
        product.setStockQuantity(4);
        when(userProvider.currentUserForUpdate()).thenReturn(user);
        when(orderRepository.findOwnedByIdForUpdate(order.getId(), user.getId())).thenReturn(Optional.of(order));
        when(productRepository.findByIdForUpdate(product.getId())).thenReturn(Optional.of(product));
        when(orderRepository.save(any(CustomerOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        orderService.cancelOrder(order.getId());

        // Then
        assertEquals(OrderStatus.CANCELLED, order.getStatus());
        assertEquals(7, product.getStockQuantity());
        verify(orderRepository).save(order);
    }

    @Test
    void cancelRejectsAnOrderThatIsNotPlaced() {
        // Given
        CustomerOrder order = order(OrderStatus.PAID, PaymentStatus.SUCCESS, PaymentMethod.UPI);
        when(userProvider.currentUserForUpdate()).thenReturn(user);
        when(orderRepository.findOwnedByIdForUpdate(order.getId(), user.getId())).thenReturn(Optional.of(order));

        // When / Then
        assertThrows(BadRequestException.class, () -> orderService.cancelOrder(order.getId()));
        verify(productRepository, never()).findByIdForUpdate(product.getId());
        verify(orderRepository, never()).save(any(CustomerOrder.class));
    }

    @Test
    void adminCanShipAPlacedPaidOrder() {
        // Given
        CustomerOrder order = order(OrderStatus.PLACED, PaymentStatus.SUCCESS, PaymentMethod.UPI);
        stubAdminOrder(order);
        stubSavingOrder();

        // When
        orderService.updateAdminOrderStatus(order.getId(), new OrderStatusRequest(OrderStatus.SHIPPED));

        // Then
        assertEquals(OrderStatus.SHIPPED, order.getStatus());
        verify(orderRepository).save(order);
    }

    @Test
    void adminCanShipAnOnlinePaidOrder() {
        // Given
        CustomerOrder order = order(OrderStatus.PAID, PaymentStatus.SUCCESS, PaymentMethod.CARD);
        stubAdminOrder(order);
        stubSavingOrder();

        // When
        orderService.updateAdminOrderStatus(order.getId(), new OrderStatusRequest(OrderStatus.SHIPPED));

        // Then
        assertEquals(OrderStatus.SHIPPED, order.getStatus());
        verify(orderRepository).save(order);
    }

    @Test
    void adminCanDeliverAShippedOrder() {
        // Given
        CustomerOrder order = order(OrderStatus.SHIPPED, PaymentStatus.SUCCESS, PaymentMethod.UPI);
        stubAdminOrder(order);
        stubSavingOrder();

        // When
        orderService.updateAdminOrderStatus(order.getId(), new OrderStatusRequest(OrderStatus.DELIVERED));

        // Then
        assertEquals(OrderStatus.DELIVERED, order.getStatus());
        verify(orderRepository).save(order);
    }

    @Test
    void adminCannotShipAnUnpaidNonCodOrder() {
        // Given
        CustomerOrder order = order(OrderStatus.PLACED, PaymentStatus.PENDING, PaymentMethod.CARD);
        stubAdminOrder(order);

        // When / Then
        assertThrows(BadRequestException.class, () -> orderService.updateAdminOrderStatus(order.getId(),
                new OrderStatusRequest(OrderStatus.SHIPPED)));
        verify(orderRepository, never()).save(any(CustomerOrder.class));
    }

    @Test
    void adminCannotMoveADeliveredOrderBackToShipping() {
        // Given
        CustomerOrder order = order(OrderStatus.DELIVERED, PaymentStatus.SUCCESS, PaymentMethod.UPI);
        stubAdminOrder(order);

        // When / Then
        assertThrows(BadRequestException.class, () -> orderService.updateAdminOrderStatus(order.getId(),
                new OrderStatusRequest(OrderStatus.SHIPPED)));
        verify(orderRepository, never()).save(any(CustomerOrder.class));
    }

    @Test
    void deliveringACodOrderMarksPaymentSuccessful() {
        // Given
        CustomerOrder order = order(OrderStatus.SHIPPED, PaymentStatus.PENDING, PaymentMethod.COD);
        stubAdminOrder(order);
        stubSavingOrder();

        // When
        orderService.updateAdminOrderStatus(order.getId(), new OrderStatusRequest(OrderStatus.DELIVERED));

        // Then
        assertEquals(OrderStatus.DELIVERED, order.getStatus());
        assertEquals(PaymentStatus.SUCCESS, order.getPaymentStatus());
        verify(orderRepository).save(order);
    }

    private void stubCheckout() {
        when(userProvider.currentUserForUpdate()).thenReturn(user);
        when(addressRepository.findByIdAndUser_Id(address.getId(), user.getId())).thenReturn(Optional.of(address));
        when(cartItemRepository.findByUser_IdOrderByProduct_IdAsc(user.getId())).thenReturn(List.of(cartItem));
        when(productRepository.findByIdForUpdate(product.getId())).thenReturn(Optional.of(product));
    }

    private void stubAdminOrder(CustomerOrder order) {
        when(orderRepository.findByIdForUpdate(order.getId())).thenReturn(Optional.of(order));
    }

    private void stubSavingOrder() {
        when(orderRepository.save(any(CustomerOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private CustomerOrder order(OrderStatus status, PaymentStatus paymentStatus, PaymentMethod method) {
        CustomerOrder order = new CustomerOrder();
        order.setId(101L);
        order.setUser(user);
        order.setAddress(address);
        order.setStatus(status);
        order.setPaymentStatus(paymentStatus);
        order.setPaymentMethod(method);
        order.setItems(new ArrayList<>());
        return order;
    }
}
