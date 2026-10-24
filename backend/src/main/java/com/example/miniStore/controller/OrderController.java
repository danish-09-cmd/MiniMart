package com.example.miniStore.controller;

import com.example.miniStore.dto.request.PlaceOrderRequest;
import com.example.miniStore.dto.response.OrderResponse;
import com.example.miniStore.dto.response.PageResponse;
import com.example.miniStore.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Validated
@Tag(name = "Orders")
@SecurityRequirement(name = "bearerAuth")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @Operation(summary = "Place an order from the current cart")
    public ResponseEntity<OrderResponse> placeOrder(@Valid @RequestBody PlaceOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.placeOrder(request));
    }

    @GetMapping
    @Operation(summary = "List the current user's order history")
    public ResponseEntity<PageResponse<OrderResponse>> getMyOrders(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(50) int size) {
        return ResponseEntity.ok(orderService.getMyOrders(page, size));
    }

    @GetMapping("/{id}")
    @Operation(summary = "View an order owned by the current user")
    public ResponseEntity<OrderResponse> getMyOrder(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(orderService.getMyOrder(id));
    }

    @PutMapping("/{id}/cancel")
    @Operation(summary = "Cancel a placed order and restore its stock")
    public ResponseEntity<OrderResponse> cancelOrder(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(orderService.cancelOrder(id));
    }
}
