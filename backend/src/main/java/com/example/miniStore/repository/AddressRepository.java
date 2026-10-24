package com.example.miniStore.repository;

import com.example.miniStore.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AddressRepository extends JpaRepository<Address, Long> {

    List<Address> findByUser_IdOrderByDefaultAddressDescIdAsc(Long userId);

    Optional<Address> findByIdAndUser_Id(Long id, Long userId);

    boolean existsByUser_Id(Long userId);
}
