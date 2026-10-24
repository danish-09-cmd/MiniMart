package com.example.miniStore.service;

import com.example.miniStore.dto.request.ProductRequest;
import com.example.miniStore.dto.response.PageResponse;
import com.example.miniStore.dto.response.ProductResponse;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;

public interface ProductService {
    PageResponse<ProductResponse> getPublicProducts(int page, int size, String sortBy, String sortDir,
                                                    String keyword, Long categoryId, BigDecimal minPrice,
                                                    BigDecimal maxPrice, Boolean inStock);
    ProductResponse getPublicProduct(Long id);
    PageResponse<ProductResponse> getAdminProducts(int page, int size, String sortBy, String sortDir,
                                                   String keyword);
    ProductResponse createProduct(ProductRequest request);
    ProductResponse updateProduct(Long id, ProductRequest request);
    void softDeleteProduct(Long id);
    ProductResponse uploadProductImage(Long id, MultipartFile file);
}
