package com.example.miniStore.repository;

import com.example.miniStore.entity.Product;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.Locale;

public final class ProductSpecification {

    private ProductSpecification() {
    }

    public static Specification<Product> isActive() {
        return (root, query, criteriaBuilder) -> criteriaBuilder.isTrue(root.get("active"));
    }

    public static Specification<Product> keyword(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return alwaysTrue();
        }
        String normalized = escapeLike(keyword.trim().toLowerCase(Locale.ROOT));
        String pattern = "%" + normalized + "%";
        return (root, query, criteriaBuilder) -> criteriaBuilder.or(
                criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), pattern, '\\'),
                criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), pattern, '\\'));
    }

    public static Specification<Product> categoryId(Long categoryId) {
        if (categoryId == null) {
            return alwaysTrue();
        }
        return (root, query, criteriaBuilder) -> criteriaBuilder.equal(root.get("category").get("id"), categoryId);
    }

    public static Specification<Product> minimumPrice(BigDecimal minPrice) {
        if (minPrice == null) {
            return alwaysTrue();
        }
        return (root, query, criteriaBuilder) -> criteriaBuilder.greaterThanOrEqualTo(root.get("price"), minPrice);
    }

    public static Specification<Product> maximumPrice(BigDecimal maxPrice) {
        if (maxPrice == null) {
            return alwaysTrue();
        }
        return (root, query, criteriaBuilder) -> criteriaBuilder.lessThanOrEqualTo(root.get("price"), maxPrice);
    }

    public static Specification<Product> inStock(Boolean inStock) {
        if (!Boolean.TRUE.equals(inStock)) {
            return alwaysTrue();
        }
        return (root, query, criteriaBuilder) -> criteriaBuilder.greaterThan(root.get("stockQuantity"), 0);
    }

    private static Specification<Product> alwaysTrue() {
        return (root, query, criteriaBuilder) -> criteriaBuilder.conjunction();
    }

    private static String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
