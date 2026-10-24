package com.example.miniStore.dto.response;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record AdminDashboardResponse(
        long totalUsers,
        long totalOrders,
        BigDecimal totalRevenue,
        Map<String, Long> ordersByStatus,
        List<LowStockProductResponse> lowStockProducts
) {
}
