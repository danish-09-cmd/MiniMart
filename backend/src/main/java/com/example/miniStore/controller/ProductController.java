package com.example.miniStore.controller;

import com.example.miniStore.dto.response.PageResponse;
import com.example.miniStore.dto.response.ProductResponse;
import com.example.miniStore.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Validated
@Tag(name = "Products")
public class ProductController {

    private final ProductService productService;

    @GetMapping
    @Operation(summary = "Search and filter the product catalog")
    public ResponseEntity<PageResponse<ProductResponse>> getProducts(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(50) int size,
            @RequestParam(defaultValue = "createdAt") @Pattern(regexp = "name|price|createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") @Pattern(regexp = "(?i)asc|desc") String sortDir,
            @RequestParam(required = false) @Size(max = 100) String keyword,
            @RequestParam(required = false) @Positive Long categoryId,
            @RequestParam(required = false) @DecimalMin(value = "0.00") BigDecimal minPrice,
            @RequestParam(required = false) @DecimalMin(value = "0.00") BigDecimal maxPrice,
            @RequestParam(defaultValue = "false") Boolean inStock) {
        return ResponseEntity.ok(productService.getPublicProducts(page, size, sortBy, sortDir,
                keyword, categoryId, minPrice, maxPrice, inStock));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a product by ID")
    public ResponseEntity<ProductResponse> getProduct(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(productService.getPublicProduct(id));
    }
}
