package com.example.miniStore.controller;

import com.example.miniStore.dto.request.AddressRequest;
import com.example.miniStore.dto.response.AddressResponse;
import com.example.miniStore.service.AddressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
@Validated
@Tag(name = "Addresses")
@SecurityRequirement(name = "bearerAuth")
public class AddressController {

    private final AddressService addressService;

    @PostMapping
    @Operation(summary = "Create an address for the current user")
    public ResponseEntity<AddressResponse> create(@Valid @RequestBody AddressRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(addressService.create(request));
    }

    @GetMapping
    @Operation(summary = "List addresses for the current user")
    public ResponseEntity<List<AddressResponse>> getAll() {
        return ResponseEntity.ok(addressService.getAll());
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an address owned by the current user")
    public ResponseEntity<AddressResponse> update(@PathVariable @Positive Long id,
                                                  @Valid @RequestBody AddressRequest request) {
        return ResponseEntity.ok(addressService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an address not used by an order")
    public ResponseEntity<Void> delete(@PathVariable @Positive Long id) {
        addressService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/default")
    @Operation(summary = "Set an address as the default")
    public ResponseEntity<AddressResponse> makeDefault(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(addressService.makeDefault(id));
    }
}
