package com.example.miniStore.service.impl;

import com.example.miniStore.dto.request.AddressRequest;
import com.example.miniStore.dto.response.AddressResponse;
import com.example.miniStore.entity.Address;
import com.example.miniStore.entity.User;
import com.example.miniStore.exception.BadRequestException;
import com.example.miniStore.exception.ResourceNotFoundException;
import com.example.miniStore.repository.AddressRepository;
import com.example.miniStore.repository.CustomerOrderRepository;
import com.example.miniStore.service.AddressService;
import com.example.miniStore.service.AuthenticatedUserProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AddressServiceImpl implements AddressService {

    private final AddressRepository addressRepository;
    private final CustomerOrderRepository orderRepository;
    private final AuthenticatedUserProvider userProvider;

    @Override
    public AddressResponse create(AddressRequest request) {
        User user = userProvider.currentUserForUpdate();
        Address address = new Address();
        address.setUser(user);
        applyRequest(address, request);
        address.setDefaultAddress(!addressRepository.existsByUser_Id(user.getId()));
        Address saved = addressRepository.save(address);
        log.info("Address created id={} userId={}", saved.getId(), user.getId());
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AddressResponse> getAll() {
        User user = userProvider.currentUser();
        return addressRepository.findByUser_IdOrderByDefaultAddressDescIdAsc(user.getId())
                .stream().map(this::toResponse).toList();
    }

    @Override
    public AddressResponse update(Long id, AddressRequest request) {
        User user = userProvider.currentUserForUpdate();
        Address address = findOwnedAddress(id, user.getId());
        applyRequest(address, request);
        Address saved = addressRepository.save(address);
        log.info("Address updated id={} userId={}", saved.getId(), user.getId());
        return toResponse(saved);
    }

    @Override
    public void delete(Long id) {
        User user = userProvider.currentUserForUpdate();
        Address address = findOwnedAddress(id, user.getId());
        if (orderRepository.existsByAddress_Id(id)) {
            log.warn("Address deletion rejected because it is used by an order id={} userId={}", id, user.getId());
            throw new BadRequestException("This address is used by an existing order and cannot be deleted");
        }

        if (address.isDefaultAddress()) {
            addressRepository.findByUser_IdOrderByDefaultAddressDescIdAsc(user.getId()).stream()
                    .filter(other -> !other.getId().equals(id))
                    .findFirst()
                    .ifPresent(other -> {
                        other.setDefaultAddress(true);
                        addressRepository.save(other);
                    });
        }
        addressRepository.delete(address);
        log.info("Address deleted id={} userId={}", id, user.getId());
    }

    @Override
    public AddressResponse makeDefault(Long id) {
        User user = userProvider.currentUserForUpdate();
        Address selected = findOwnedAddress(id, user.getId());
        List<Address> addresses = addressRepository.findByUser_IdOrderByDefaultAddressDescIdAsc(user.getId());
        for (Address address : addresses) {
            address.setDefaultAddress(address.getId().equals(selected.getId()));
        }
        addressRepository.saveAll(addresses);
        log.info("Default address changed id={} userId={}", selected.getId(), user.getId());
        return toResponse(selected);
    }

    private Address findOwnedAddress(Long id, Long userId) {
        return addressRepository.findByIdAndUser_Id(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found with id " + id));
    }

    private void applyRequest(Address address, AddressRequest request) {
        address.setFullName(request.fullName().trim());
        address.setPhone(request.phone().trim());
        address.setLine1(request.line1().trim());
        address.setLine2(request.line2() == null || request.line2().isBlank() ? null : request.line2().trim());
        address.setCity(request.city().trim());
        address.setState(request.state().trim());
        address.setPincode(request.pincode().trim());
    }

    private AddressResponse toResponse(Address address) {
        return new AddressResponse(address.getId(), address.getFullName(), address.getPhone(), address.getLine1(),
                address.getLine2(), address.getCity(), address.getState(), address.getPincode(),
                address.isDefaultAddress());
    }
}
