package com.example.miniStore.service.impl;

import com.example.miniStore.dto.response.AdminDashboardResponse;
import com.example.miniStore.dto.response.LowStockProductResponse;
import com.example.miniStore.entity.OrderStatus;
import com.example.miniStore.repository.CustomerOrderRepository;
import com.example.miniStore.repository.ProductRepository;
import com.example.miniStore.repository.UserRepository;
import com.example.miniStore.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private final UserRepository userRepository;
    private final CustomerOrderRepository orderRepository;
    private final ProductRepository productRepository;

    @Override
    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboard() {
        log.debug("Admin dashboard metrics requested");
        Map<String, Long> ordersByStatus = new HashMap<>();
        for (OrderStatus status : OrderStatus.values()) {
            ordersByStatus.put(status.name(), 0L);
        }
        for (Object[] row : orderRepository.countGroupedByStatus()) {
            ordersByStatus.put(((OrderStatus) row[0]).name(), ((Number) row[1]).longValue());
        }

        List<LowStockProductResponse> lowStockProducts = productRepository.findActiveLowStockProducts().stream()
                .map(product -> new LowStockProductResponse(product.getId(), product.getName(),
                        product.getStockQuantity()))
                .toList();
        BigDecimal revenue = orderRepository.sumSuccessfulRevenue();

        return new AdminDashboardResponse(userRepository.count(), orderRepository.count(),
                revenue == null ? BigDecimal.ZERO : revenue, Map.copyOf(ordersByStatus), lowStockProducts);
    }
}
