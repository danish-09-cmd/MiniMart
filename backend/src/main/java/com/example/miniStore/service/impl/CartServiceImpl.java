package com.example.miniStore.service.impl;

import com.example.miniStore.dto.request.CartItemRequest;
import com.example.miniStore.dto.request.CartQuantityRequest;
import com.example.miniStore.dto.response.CartItemResponse;
import com.example.miniStore.dto.response.CartResponse;
import com.example.miniStore.entity.CartItem;
import com.example.miniStore.entity.Product;
import com.example.miniStore.entity.User;
import com.example.miniStore.exception.InsufficientStockException;
import com.example.miniStore.exception.ResourceNotFoundException;
import com.example.miniStore.repository.CartItemRepository;
import com.example.miniStore.repository.ProductRepository;
import com.example.miniStore.service.AuthenticatedUserProvider;
import com.example.miniStore.service.CartService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CartServiceImpl implements CartService {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final AuthenticatedUserProvider userProvider;

    @Override
    @Transactional(readOnly = true)
    public CartResponse getCart() {
        User user = userProvider.currentUser();
        return toResponse(cartItemRepository.findByUser_IdOrderByProduct_IdAsc(user.getId()));
    }

    @Override
    public CartResponse addItem(CartItemRequest request) {
        User user = userProvider.currentUserForUpdate();
        Product product = findActiveProductForUpdate(request.productId());
        CartItem item = cartItemRepository.findByUser_IdAndProduct_Id(user.getId(), product.getId())
                .orElseGet(() -> {
                    CartItem newItem = new CartItem();
                    newItem.setUser(user);
                    newItem.setProduct(product);
                    newItem.setQuantity(0);
                    return newItem;
                });

        long finalQuantity = (long) item.getQuantity() + request.quantity();
        requireAvailableStock(product, finalQuantity);
        item.setQuantity((int) finalQuantity);
        cartItemRepository.save(item);
        log.info("Cart item updated userId={} productId={} quantity={}", user.getId(), product.getId(), finalQuantity);
        return toResponse(cartItemRepository.findByUser_IdOrderByProduct_IdAsc(user.getId()));
    }

    @Override
    public CartResponse updateQuantity(Long productId, CartQuantityRequest request) {
        User user = userProvider.currentUserForUpdate();
        CartItem item = findCartItem(user.getId(), productId);
        if (request.quantity() == 0) {
            cartItemRepository.delete(item);
            log.info("Cart item removed by setting quantity to zero userId={} productId={}", user.getId(), productId);
        } else {
            Product product = findActiveProductForUpdate(productId);
            requireAvailableStock(product, request.quantity());
            item.setQuantity(request.quantity());
            cartItemRepository.save(item);
            log.info("Cart quantity changed userId={} productId={} quantity={}", user.getId(), productId,
                    request.quantity());
        }
        return toResponse(cartItemRepository.findByUser_IdOrderByProduct_IdAsc(user.getId()));
    }

    @Override
    public void removeItem(Long productId) {
        User user = userProvider.currentUserForUpdate();
        cartItemRepository.delete(findCartItem(user.getId(), productId));
        log.info("Cart item removed userId={} productId={}", user.getId(), productId);
    }

    @Override
    public void clearCart() {
        User user = userProvider.currentUserForUpdate();
        cartItemRepository.deleteAllForUser(user.getId());
        log.info("Cart cleared userId={}", user.getId());
    }

    private Product findActiveProductForUpdate(Long productId) {
        Product product = productRepository.findByIdForUpdate(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + productId));
        if (!product.isActive()) {
            log.warn("Cart operation rejected for inactive product id={}", productId);
            throw new ResourceNotFoundException("Product not found with id " + productId);
        }
        return product;
    }

    private CartItem findCartItem(Long userId, Long productId) {
        return cartItemRepository.findByUser_IdAndProduct_Id(userId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product is not in your cart"));
    }

    private void requireAvailableStock(Product product, long requestedQuantity) {
        int available = product.getStockQuantity();
        if (requestedQuantity > available) {
            log.warn("Cart quantity rejected productId={} requested={} available={}",
                    product.getId(), requestedQuantity, available);
            throw new InsufficientStockException("Only " + available + " unit(s) of " + product.getName()
                    + " are available");
        }
    }

    private CartResponse toResponse(List<CartItem> cartItems) {
        List<CartItemResponse> items = cartItems.stream().map(item -> {
            Product product = item.getProduct();
            BigDecimal lineTotal = product.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            return new CartItemResponse(product.getId(), product.getName(), product.getImageUrl(), product.getPrice(),
                    item.getQuantity(), lineTotal);
        }).toList();
        BigDecimal grandTotal = items.stream().map(CartItemResponse::lineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long totalItems = items.stream().mapToLong(CartItemResponse::quantity).sum();
        return new CartResponse(items, grandTotal, totalItems);
    }
}
