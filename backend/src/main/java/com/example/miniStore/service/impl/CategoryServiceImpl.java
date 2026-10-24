package com.example.miniStore.service.impl;

import com.example.miniStore.dto.request.CategoryRequest;
import com.example.miniStore.dto.response.CategoryResponse;
import com.example.miniStore.entity.Category;
import com.example.miniStore.exception.BadRequestException;
import com.example.miniStore.exception.ResourceNotFoundException;
import com.example.miniStore.repository.CategoryRepository;
import com.example.miniStore.repository.ProductRepository;
import com.example.miniStore.service.CategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll(Sort.by(Sort.Direction.ASC, "name"))
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getCategory(Long id) {
        return toResponse(findCategory(id));
    }

    @Override
    public CategoryResponse createCategory(CategoryRequest request) {
        String name = normalizeName(request.name());
        if (categoryRepository.existsByNameIgnoreCase(name)) {
            log.warn("Category creation rejected because the name already exists");
            throw new BadRequestException("A category with this name already exists");
        }

        Category category = new Category();
        category.setName(name);
        category.setDescription(normalizeDescription(request.description()));
        Category saved = categoryRepository.save(category);
        log.info("Created category id={} name={}", saved.getId(), saved.getName());
        return toResponse(saved);
    }

    @Override
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = findCategory(id);
        String name = normalizeName(request.name());
        if (categoryRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            log.warn("Category update rejected because the name already exists categoryId={}", id);
            throw new BadRequestException("A category with this name already exists");
        }

        category.setName(name);
        category.setDescription(normalizeDescription(request.description()));
        Category saved = categoryRepository.save(category);
        log.info("Updated category id={} name={}", saved.getId(), saved.getName());
        return toResponse(saved);
    }

    @Override
    public void deleteCategory(Long id) {
        Category category = findCategory(id);
        if (productRepository.existsByCategory_Id(id)) {
            log.warn("Category deletion rejected because products still reference it categoryId={}", id);
            throw new BadRequestException("Cannot delete this category while it has products");
        }
        categoryRepository.delete(category);
        log.info("Deleted category id={} name={}", id, category.getName());
    }

    private Category findCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id " + id));
    }

    private CategoryResponse toResponse(Category category) {
        return new CategoryResponse(category.getId(), category.getName(), category.getDescription());
    }

    private String normalizeName(String name) {
        return name.trim();
    }

    private String normalizeDescription(String description) {
        if (description == null || description.isBlank()) {
            return null;
        }
        return description.trim();
    }
}
