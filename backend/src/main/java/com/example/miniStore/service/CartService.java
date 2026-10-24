package com.example.miniStore.service;

import com.example.miniStore.dto.request.CartItemRequest;
import com.example.miniStore.dto.request.CartQuantityRequest;
import com.example.miniStore.dto.response.CartResponse;

public interface CartService {
    CartResponse getCart();
    CartResponse addItem(CartItemRequest request);
    CartResponse updateQuantity(Long productId, CartQuantityRequest request);
    void removeItem(Long productId);
    void clearCart();
}
