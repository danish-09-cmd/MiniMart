package com.example.miniStore.service.impl;

import com.example.miniStore.dto.request.CartItemRequest;
import com.example.miniStore.dto.request.CartQuantityRequest;
import com.example.miniStore.dto.response.CartResponse;
import com.example.miniStore.entity.CartItem;
import com.example.miniStore.entity.Product;
import com.example.miniStore.entity.User;
import com.example.miniStore.exception.InsufficientStockException;
import com.example.miniStore.exception.ResourceNotFoundException;
import com.example.miniStore.repository.CartItemRepository;
import com.example.miniStore.repository.ProductRepository;
import com.example.miniStore.service.AuthenticatedUserProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private AuthenticatedUserProvider userProvider;

    @InjectMocks
    private CartServiceImpl cartService;

    private User user;
    private Product product;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(7L);

        product = new Product();
        product.setId(12L);
        product.setName("Coffee");
        product.setPrice(new BigDecimal("8.50"));
        product.setStockQuantity(5);
        product.setActive(true);
    }

    @Test
    void addItemCreatesANewCartLine() {
        // Given
        when(userProvider.currentUserForUpdate()).thenReturn(user);
        when(productRepository.findByIdForUpdate(product.getId())).thenReturn(Optional.of(product));
        when(cartItemRepository.findByUser_IdAndProduct_Id(user.getId(), product.getId()))
                .thenReturn(Optional.empty());
        AtomicReference<CartItem> savedItem = new AtomicReference<>();
        when(cartItemRepository.save(any(CartItem.class))).thenAnswer(invocation -> {
            CartItem item = invocation.getArgument(0);
            savedItem.set(item);
            return item;
        });
        when(cartItemRepository.findByUser_IdOrderByProduct_IdAsc(user.getId()))
                .thenAnswer(invocation -> savedItem.get() == null ? List.of() : List.of(savedItem.get()));

        // When
        CartResponse response = cartService.addItem(new CartItemRequest(product.getId(), 2));

        // Then
        assertEquals(1, response.items().size());
        assertEquals(2, response.items().get(0).quantity());
        assertEquals(new BigDecimal("17.00"), response.grandTotal());
        assertEquals(user, savedItem.get().getUser());
        assertEquals(product, savedItem.get().getProduct());
    }

    @Test
    void addExistingItemIncreasesItsQuantity() {
        // Given
        when(userProvider.currentUserForUpdate()).thenReturn(user);
        when(productRepository.findByIdForUpdate(product.getId())).thenReturn(Optional.of(product));
        CartItem existing = cartItem(3);
        when(cartItemRepository.findByUser_IdAndProduct_Id(user.getId(), product.getId()))
                .thenReturn(Optional.of(existing));
        when(cartItemRepository.save(existing)).thenReturn(existing);
        when(cartItemRepository.findByUser_IdOrderByProduct_IdAsc(user.getId())).thenReturn(List.of(existing));

        // When
        CartResponse response = cartService.addItem(new CartItemRequest(product.getId(), 2));

        // Then
        assertEquals(5, existing.getQuantity());
        assertEquals(5, response.items().get(0).quantity());
        verify(cartItemRepository).save(existing);
    }

    @Test
    void addItemRejectsQuantityAboveAvailableStock() {
        // Given
        when(userProvider.currentUserForUpdate()).thenReturn(user);
        when(productRepository.findByIdForUpdate(product.getId())).thenReturn(Optional.of(product));
        when(cartItemRepository.findByUser_IdAndProduct_Id(user.getId(), product.getId()))
                .thenReturn(Optional.empty());

        // When / Then
        assertThrows(InsufficientStockException.class,
                () -> cartService.addItem(new CartItemRequest(product.getId(), 6)));
        verify(cartItemRepository, never()).save(any(CartItem.class));
    }

    @Test
    void addItemRejectsInactiveProduct() {
        // Given
        product.setActive(false);
        when(userProvider.currentUserForUpdate()).thenReturn(user);
        when(productRepository.findByIdForUpdate(product.getId())).thenReturn(Optional.of(product));

        // When / Then
        assertThrows(ResourceNotFoundException.class,
                () -> cartService.addItem(new CartItemRequest(product.getId(), 1)));
        verify(cartItemRepository, never()).save(any(CartItem.class));
    }

    @Test
    void updateQuantityZeroRemovesTheCartLine() {
        // Given
        when(userProvider.currentUserForUpdate()).thenReturn(user);
        CartItem existing = cartItem(1);
        when(cartItemRepository.findByUser_IdAndProduct_Id(user.getId(), product.getId()))
                .thenReturn(Optional.of(existing));
        when(cartItemRepository.findByUser_IdOrderByProduct_IdAsc(user.getId())).thenReturn(List.of());

        // When
        CartResponse response = cartService.updateQuantity(product.getId(), new CartQuantityRequest(0));

        // Then
        assertEquals(0, response.items().size());
        verify(cartItemRepository).delete(existing);
        verify(productRepository, never()).findByIdForUpdate(product.getId());
    }

    private CartItem cartItem(int quantity) {
        CartItem item = new CartItem();
        item.setUser(user);
        item.setProduct(product);
        item.setQuantity(quantity);
        return item;
    }
}
