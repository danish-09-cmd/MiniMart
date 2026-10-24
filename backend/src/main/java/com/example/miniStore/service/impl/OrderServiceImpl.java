package com.example.miniStore.service.impl;

import com.example.miniStore.dto.request.OrderStatusRequest;
import com.example.miniStore.dto.request.PlaceOrderRequest;
import com.example.miniStore.dto.response.OrderResponse;
import com.example.miniStore.dto.response.PageResponse;
import com.example.miniStore.entity.Address;
import com.example.miniStore.entity.CartItem;
import com.example.miniStore.entity.CustomerOrder;
import com.example.miniStore.entity.OrderAddressSnapshot;
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
import com.example.miniStore.service.OrderService;
import com.example.miniStore.util.PaginationSupport;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class OrderServiceImpl implements OrderService {

    private final CustomerOrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final AddressRepository addressRepository;
    private final AuthenticatedUserProvider userProvider;
    private final OrderResponseMapper responseMapper;

    @Override
    public OrderResponse placeOrder(PlaceOrderRequest request) {
        User user = userProvider.currentUserForUpdate();
        Address address = addressRepository.findByIdAndUser_Id(request.addressId(), user.getId())
                .orElseThrow(() -> {
                    log.warn("Order placement rejected for an address not owned by userId={} addressId={}",
                            user.getId(), request.addressId());
                    return new ResourceNotFoundException("Address not found with id " + request.addressId());
                });
        List<CartItem> cartItems = cartItemRepository.findByUser_IdOrderByProduct_IdAsc(user.getId());
        if (cartItems.isEmpty()) {
            log.warn("Order placement rejected because cart is empty userId={}", user.getId());
            throw new BadRequestException("Your cart is empty");
        }

        CustomerOrder order = new CustomerOrder();
        order.setUser(user);
        order.setAddress(address);
        order.setStatus(OrderStatus.PLACED);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setItems(new ArrayList<>());

        OrderAddressSnapshot snapshot = snapshotOf(address, order);
        order.setAddressSnapshot(snapshot);
        BigDecimal total = BigDecimal.ZERO;

        for (CartItem cartItem : cartItems) {
            Product product = productRepository.findByIdForUpdate(cartItem.getProduct().getId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Product not found with id " + cartItem.getProduct().getId()));
            if (!product.isActive()) {
                log.warn("Order placement rejected because product is inactive productId={} userId={}",
                        product.getId(), user.getId());
                throw new BadRequestException(product.getName() + " is no longer available");
            }

            int available = product.getStockQuantity();
            if (cartItem.getQuantity() > available) {
                log.warn("Order placement rejected for insufficient stock productId={} requested={} available={}",
                        product.getId(), cartItem.getQuantity(), available);
                throw new InsufficientStockException("Only " + available + " unit(s) of " + product.getName()
                        + " are available");
            }

            BigDecimal priceAtPurchase = product.getPrice();
            total = total.add(priceAtPurchase.multiply(BigDecimal.valueOf(cartItem.getQuantity())));
            product.setStockQuantity(available - cartItem.getQuantity());

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setPriceAtPurchase(priceAtPurchase);
            order.getItems().add(orderItem);
        }

        order.setTotalAmount(total);
        CustomerOrder saved = orderRepository.save(order);
        cartItemRepository.deleteAllForUser(user.getId());
        log.info("Order placed id={} userId={} total={}", saved.getId(), user.getId(), total);
        return responseMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getMyOrders(int page, int size) {
        User user = userProvider.currentUser();
        Pageable pageable = newestFirst(page, size);
        Page<CustomerOrder> orders = orderRepository.findByUser_Id(user.getId(), pageable);
        return PageResponse.from(orders, responseMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getMyOrder(Long orderId) {
        User user = userProvider.currentUser();
        CustomerOrder order = orderRepository.findByIdAndUser_Id(orderId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id " + orderId));
        return responseMapper.toResponse(order);
    }

    @Override
    public OrderResponse cancelOrder(Long orderId) {
        User user = userProvider.currentUserForUpdate();
        CustomerOrder order = orderRepository.findOwnedByIdForUpdate(orderId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id " + orderId));
        if (order.getStatus() != OrderStatus.PLACED) {
            log.warn("Order cancellation rejected orderId={} status={}", orderId, order.getStatus());
            throw new BadRequestException("Only orders with status PLACED can be cancelled");
        }

        order.getItems().stream()
                .sorted(Comparator.comparing(item -> item.getProduct().getId()))
                .forEach(item -> {
                    Product product = productRepository.findByIdForUpdate(item.getProduct().getId())
                            .orElseThrow(() -> new ResourceNotFoundException(
                                    "Product not found with id " + item.getProduct().getId()));
                    product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
                });
        order.setStatus(OrderStatus.CANCELLED);
        CustomerOrder saved = orderRepository.save(order);
        log.info("Order cancelled id={} userId={}", saved.getId(), user.getId());
        return responseMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getAdminOrders(int page, int size, OrderStatus status) {
        Pageable pageable = newestFirst(page, size);
        Page<CustomerOrder> orders = status == null
                ? orderRepository.findAll(pageable)
                : orderRepository.findByStatus(status, pageable);
        return PageResponse.from(orders, responseMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getAdminOrder(Long orderId) {
        CustomerOrder order = orderRepository.findWithDetailsById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id " + orderId));
        return responseMapper.toResponse(order);
    }

    @Override
    public OrderResponse updateAdminOrderStatus(Long orderId, OrderStatusRequest request) {
        CustomerOrder order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id " + orderId));
        OrderStatus current = order.getStatus();
        OrderStatus target = request.status();

        boolean paidOnlineOrderReadyToShip = current == OrderStatus.PAID
                && target == OrderStatus.SHIPPED
                && order.getPaymentStatus() == PaymentStatus.SUCCESS;
        boolean placedOrderReadyToShip = current == OrderStatus.PLACED
                && target == OrderStatus.SHIPPED
                && (order.getPaymentStatus() == PaymentStatus.SUCCESS
                || order.getPaymentMethod() == PaymentMethod.COD);
        boolean shippedOrderReadyToDeliver = current == OrderStatus.SHIPPED && target == OrderStatus.DELIVERED;

        if (paidOnlineOrderReadyToShip || placedOrderReadyToShip) {
            order.setStatus(OrderStatus.SHIPPED);
        } else if (shippedOrderReadyToDeliver) {
            order.setStatus(OrderStatus.DELIVERED);
            if (order.getPaymentMethod() == PaymentMethod.COD) {
                order.setPaymentStatus(PaymentStatus.SUCCESS);
            }
        } else {
            log.warn("Order status transition rejected orderId={} current={} target={}", orderId, current, target);
            throw new BadRequestException("Order status transition " + current + " -> " + target
                    + " is not allowed; only eligible orders may be shipped and SHIPPED orders may be delivered");
        }

        CustomerOrder saved = orderRepository.save(order);
        log.info("Order status changed orderId={} from={} to={} paymentStatus={}", saved.getId(), current,
                saved.getStatus(), saved.getPaymentStatus());
        return responseMapper.toResponse(saved);
    }

    private OrderAddressSnapshot snapshotOf(Address address, CustomerOrder order) {
        OrderAddressSnapshot snapshot = new OrderAddressSnapshot();
        snapshot.setOrder(order);
        snapshot.setFullName(address.getFullName());
        snapshot.setPhone(address.getPhone());
        snapshot.setLine1(address.getLine1());
        snapshot.setLine2(address.getLine2());
        snapshot.setCity(address.getCity());
        snapshot.setState(address.getState());
        snapshot.setPincode(address.getPincode());
        return snapshot;
    }

    private Pageable newestFirst(int page, int size) {
        PaginationSupport.create(page, size, "createdAt", "desc");
        return PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")));
    }
}
