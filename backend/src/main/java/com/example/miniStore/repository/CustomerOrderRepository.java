package com.example.miniStore.repository;

import com.example.miniStore.entity.CustomerOrder;
import com.example.miniStore.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {

    @EntityGraph(attributePaths = {"address", "addressSnapshot"})
    Page<CustomerOrder> findByUser_Id(Long userId, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "address", "addressSnapshot"})
    Page<CustomerOrder> findByStatus(OrderStatus status, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"user", "address", "addressSnapshot"})
    Page<CustomerOrder> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"user", "address", "addressSnapshot"})
    Optional<CustomerOrder> findByIdAndUser_Id(Long id, Long userId);

    @EntityGraph(attributePaths = {"user", "address", "addressSnapshot", "items", "items.product"})
    Optional<CustomerOrder> findWithDetailsById(Long id);

    boolean existsByAddress_Id(Long addressId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select customerOrder from CustomerOrder customerOrder " +
            "where customerOrder.id = :orderId and customerOrder.user.id = :userId")
    Optional<CustomerOrder> findOwnedByIdForUpdate(@Param("orderId") Long orderId,
                                                   @Param("userId") Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select customerOrder from CustomerOrder customerOrder where customerOrder.id = :orderId")
    Optional<CustomerOrder> findByIdForUpdate(@Param("orderId") Long orderId);

    @Query("select coalesce(sum(customerOrder.totalAmount), 0) from CustomerOrder customerOrder " +
            "where customerOrder.paymentStatus = com.example.miniStore.entity.PaymentStatus.SUCCESS " +
            "and customerOrder.status <> com.example.miniStore.entity.OrderStatus.CANCELLED")
    BigDecimal sumSuccessfulRevenue();

    @Query("select customerOrder.status, count(customerOrder) from CustomerOrder customerOrder " +
            "group by customerOrder.status")
    List<Object[]> countGroupedByStatus();
}
