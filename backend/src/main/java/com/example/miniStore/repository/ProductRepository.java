package com.example.miniStore.repository;

import com.example.miniStore.entity.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    boolean existsByCategory_Id(Long categoryId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select product from Product product where product.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);

    @Query("select product.id as id, product.name as name, product.stockQuantity as stockQuantity " +
            "from Product product where product.active = true and product.stockQuantity < 5 " +
            "order by product.stockQuantity asc, product.name asc")
    List<LowStockProductView> findActiveLowStockProducts();
}
