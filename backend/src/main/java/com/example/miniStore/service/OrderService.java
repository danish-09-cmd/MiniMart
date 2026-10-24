package com.example.miniStore.service;

import com.example.miniStore.dto.request.OrderStatusRequest;
import com.example.miniStore.dto.request.PlaceOrderRequest;
import com.example.miniStore.dto.response.OrderResponse;
import com.example.miniStore.dto.response.PageResponse;
import com.example.miniStore.entity.OrderStatus;

public interface OrderService {
    OrderResponse placeOrder(PlaceOrderRequest request);
    PageResponse<OrderResponse> getMyOrders(int page, int size);
    OrderResponse getMyOrder(Long orderId);
    OrderResponse cancelOrder(Long orderId);
    PageResponse<OrderResponse> getAdminOrders(int page, int size, OrderStatus status);
    OrderResponse getAdminOrder(Long orderId);
    OrderResponse updateAdminOrderStatus(Long orderId, OrderStatusRequest request);
}
