package com.example.miniStore.controller;

import com.example.miniStore.dto.request.OrderStatusRequest;
import com.example.miniStore.dto.response.OrderResponse;
import com.example.miniStore.dto.response.PageResponse;
import com.example.miniStore.entity.OrderStatus;
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
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
@Validated
@Tag(name = "Admin")
@SecurityRequirement(name = "bearerAuth")
public class AdminOrderController {

    private final OrderService orderService;

    @GetMapping
    @Operation(summary = "List and filter customer orders")
    public ResponseEntity<PageResponse<OrderResponse>> getOrders(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(50) int size,
            @RequestParam(required = false) OrderStatus status) {
        return ResponseEntity.ok(orderService.getAdminOrders(page, size, status));
    }

    @GetMapping("/{id}")
    @Operation(summary = "View an order by ID")
    public ResponseEntity<OrderResponse> getOrder(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(orderService.getAdminOrder(id));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Move an order to its next allowed status")
    public ResponseEntity<OrderResponse> updateStatus(@PathVariable @Positive Long id,
                                                      @Valid @RequestBody OrderStatusRequest request) {
        return ResponseEntity.ok(orderService.updateAdminOrderStatus(id, request));
    }
}
