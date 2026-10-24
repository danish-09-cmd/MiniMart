package com.example.miniStore.service.impl;

import com.example.miniStore.dto.request.ProductRequest;
import com.example.miniStore.dto.response.PageResponse;
import com.example.miniStore.dto.response.ProductResponse;
import com.example.miniStore.entity.Category;
import com.example.miniStore.entity.Product;
import com.example.miniStore.exception.BadRequestException;
import com.example.miniStore.exception.ResourceNotFoundException;
import com.example.miniStore.repository.CategoryRepository;
import com.example.miniStore.repository.ProductRepository;
import com.example.miniStore.repository.ProductSpecification;
import com.example.miniStore.service.ProductImageStorageService;
import com.example.miniStore.service.ProductService;
import com.example.miniStore.util.PaginationSupport;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductImageStorageService imageStorageService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getPublicProducts(int page, int size, String sortBy, String sortDir,
                                                           String keyword, Long categoryId, BigDecimal minPrice,
                                                           BigDecimal maxPrice, Boolean inStock) {
        validateFilters(categoryId, minPrice, maxPrice);
        Pageable pageable = PaginationSupport.create(page, size, sortBy, sortDir);
        Specification<Product> specification = Specification.allOf(
                ProductSpecification.isActive(),
                ProductSpecification.keyword(keyword),
                ProductSpecification.categoryId(categoryId),
                ProductSpecification.minimumPrice(minPrice),
                ProductSpecification.maximumPrice(maxPrice),
                ProductSpecification.inStock(inStock));

        Page<Product> products = productRepository.findAll(specification, pageable);
        return PageResponse.from(products, this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getPublicProduct(Long id) {
        Product product = productRepository.findById(id)
                .filter(Product::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + id));
        return toResponse(product);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getAdminProducts(int page, int size, String sortBy, String sortDir,
                                                          String keyword) {
        Pageable pageable = PaginationSupport.create(page, size, sortBy, sortDir);
        Page<Product> products = productRepository.findAll(ProductSpecification.keyword(keyword), pageable);
        return PageResponse.from(products, this::toResponse);
    }

    @Override
    public ProductResponse createProduct(ProductRequest request) {
        Category category = findCategory(request.categoryId());
        Product product = new Product();
        applyRequest(product, request, category);
        product.setActive(true);
        Product saved = productRepository.save(product);
        log.info("Created product id={} name={}", saved.getId(), saved.getName());
        return toResponse(saved);
    }

    @Override
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = findProductForUpdate(id);
        Category category = findCategory(request.categoryId());
        applyRequest(product, request, category);
        Product saved = productRepository.save(product);
        log.info("Updated product id={} name={}", saved.getId(), saved.getName());
        return toResponse(saved);
    }

    @Override
    public void softDeleteProduct(Long id) {
        Product product = findProductForUpdate(id);
        product.setActive(false);
        productRepository.save(product);
        log.info("Soft deleted product id={}", id);
    }

    @Override
    public ProductResponse uploadProductImage(Long id, MultipartFile file) {
        Product product = findProductForUpdate(id);
        String oldImageUrl = product.getImageUrl();
        String newImageUrl = imageStorageService.store(file);

        try {
            product.setImageUrl(newImageUrl);
            Product saved = productRepository.save(product);
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    imageStorageService.deleteManagedImage(oldImageUrl);
                }

                @Override
                public void afterCompletion(int status) {
                    if (status != STATUS_COMMITTED) {
                        imageStorageService.deleteManagedImage(newImageUrl);
                    }
                }
            });
            log.info("Updated product image id={} url={}", id, newImageUrl);
            return toResponse(saved);
        } catch (RuntimeException exception) {
            imageStorageService.deleteManagedImage(newImageUrl);
            throw exception;
        }
    }

    private void applyRequest(Product product, ProductRequest request, Category category) {
        product.setName(request.name().trim());
        product.setDescription(request.description().trim());
        product.setPrice(request.price());
        product.setStockQuantity(request.stockQuantity());
        product.setCategory(category);
    }

    private void validateFilters(Long categoryId, BigDecimal minPrice, BigDecimal maxPrice) {
        if (categoryId != null && categoryId <= 0) {
            log.warn("Product search rejected for invalid categoryId={}", categoryId);
            throw new BadRequestException("categoryId must be greater than 0");
        }
        if (minPrice != null && minPrice.signum() < 0) {
            log.warn("Product search rejected for negative minPrice");
            throw new BadRequestException("minPrice must be 0 or greater");
        }
        if (maxPrice != null && maxPrice.signum() < 0) {
            log.warn("Product search rejected for negative maxPrice");
            throw new BadRequestException("maxPrice must be 0 or greater");
        }
        if (minPrice != null && maxPrice != null && minPrice.compareTo(maxPrice) > 0) {
            log.warn("Product search rejected because minPrice exceeds maxPrice");
            throw new BadRequestException("minPrice must be less than or equal to maxPrice");
        }
    }

    private Category findCategory(Long categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id " + categoryId));
    }

    private Product findProductForUpdate(Long id) {
        return productRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + id));
    }

    private ProductResponse toResponse(Product product) {
        Category category = product.getCategory();
        return new ProductResponse(product.getId(), product.getName(), product.getDescription(), product.getPrice(),
                product.getStockQuantity(), product.getImageUrl(), category.getId(), category.getName(),
                product.isActive(), product.getCreatedAt());
    }
}
