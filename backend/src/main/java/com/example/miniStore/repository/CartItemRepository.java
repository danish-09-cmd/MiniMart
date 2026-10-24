package com.example.miniStore.repository;

import com.example.miniStore.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    List<CartItem> findByUser_IdOrderByProduct_IdAsc(Long userId);

    Optional<CartItem> findByUser_IdAndProduct_Id(Long userId, Long productId);

    @Modifying
    @Query("delete from CartItem item where item.user.id = :userId")
    void deleteAllForUser(@Param("userId") Long userId);
}
