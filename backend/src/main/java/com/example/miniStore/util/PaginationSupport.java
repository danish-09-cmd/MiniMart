package com.example.miniStore.util;

import com.example.miniStore.exception.BadRequestException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.Set;

public final class PaginationSupport {

    private static final int MAX_PAGE_SIZE = 50;
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("name", "price", "createdAt");

    private PaginationSupport() {
    }

    public static Pageable create(int page, int size, String sortBy, String sortDir) {
        if (page < 0) {
            throw new BadRequestException("page must be 0 or greater");
        }
        if (size < 1 || size > MAX_PAGE_SIZE) {
            throw new BadRequestException("size must be between 1 and 50");
        }
        if (sortBy == null || !ALLOWED_SORT_FIELDS.contains(sortBy)) {
            throw new BadRequestException("sortBy must be one of: name, price, createdAt");
        }

        Sort.Direction direction;
        try {
            direction = Sort.Direction.fromString(sortDir);
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("sortDir must be either asc or desc");
        }
        return PageRequest.of(page, size, Sort.by(direction, sortBy));
    }
}
