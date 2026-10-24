package com.example.miniStore.service;

import com.example.miniStore.dto.request.AddressRequest;
import com.example.miniStore.dto.response.AddressResponse;

import java.util.List;

public interface AddressService {
    AddressResponse create(AddressRequest request);
    List<AddressResponse> getAll();
    AddressResponse update(Long id, AddressRequest request);
    void delete(Long id);
    AddressResponse makeDefault(Long id);
}
