package com.example.miniStore.service.impl;

import com.example.miniStore.dto.response.PageResponse;
import com.example.miniStore.dto.response.ProductResponse;
import com.example.miniStore.entity.Product;
import com.example.miniStore.repository.CategoryRepository;
import com.example.miniStore.repository.ProductRepository;
import com.example.miniStore.service.ProductImageStorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ProductImageStorageService imageStorageService;

    @InjectMocks
    private ProductServiceImpl productService;

    @Test
    void productSearchDelegatesFiltersAndRequestedPaginationToRepository() {
        // Given
        Pageable expectedPageable = PageRequest.of(2, 15, Sort.by(Sort.Direction.DESC, "price"));
        PageImpl<Product> repositoryPage = new PageImpl<>(List.of(), expectedPageable, 0);
        when(productRepository.findAll(org.mockito.ArgumentMatchers.<Specification<Product>>any(), any(Pageable.class)))
                .thenReturn(repositoryPage);

        // When
        PageResponse<ProductResponse> response = productService.getPublicProducts(2, 15, "price", "desc",
                "coffee", 4L, new BigDecimal("2.00"), new BigDecimal("20.00"), true);

        // Then
        ArgumentCaptor<Specification<Product>> specificationCaptor = ArgumentCaptor.forClass(Specification.class);
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(productRepository).findAll(specificationCaptor.capture(), pageableCaptor.capture());
        assertNotNull(specificationCaptor.getValue());
        assertEquals(expectedPageable, pageableCaptor.getValue());
        assertEquals(2, response.page());
        assertEquals(15, response.size());
    }

    @Test
    void softDeleteMarksProductInactive() {
        // Given
        Product product = new Product();
        product.setId(22L);
        product.setActive(true);
        when(productRepository.findByIdForUpdate(product.getId())).thenReturn(Optional.of(product));
        when(productRepository.save(product)).thenReturn(product);

        // When
        productService.softDeleteProduct(product.getId());

        // Then
        assertEquals(false, product.isActive());
        verify(productRepository).save(product);
    }
}
