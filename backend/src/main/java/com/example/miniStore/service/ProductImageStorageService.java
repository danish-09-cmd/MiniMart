package com.example.miniStore.service;

import com.example.miniStore.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
public class ProductImageStorageService {

    private static final long MAX_IMAGE_SIZE = 2L * 1024 * 1024;
    private static final Map<String, String> MIME_BY_EXTENSION = Map.of(
            "jpg", "image/jpeg",
            "jpeg", "image/jpeg",
            "png", "image/png",
            "webp", "image/webp"
    );

    private final Path uploadDirectory;

    public ProductImageStorageService(@Value("${app.upload-dir:./uploads}") String uploadDirectory) {
        this.uploadDirectory = Path.of(uploadDirectory).toAbsolutePath().normalize();
    }

    public String store(MultipartFile file) {
        String extension = validate(file);
        String filename = UUID.randomUUID() + "." + extension;
        Path destination = uploadDirectory.resolve(filename).normalize();
        if (!destination.startsWith(uploadDirectory)) {
            log.warn("Product image upload rejected because the generated destination escaped the upload directory");
            throw new BadRequestException("Invalid image file name");
        }

        try {
            Files.createDirectories(uploadDirectory);
            try (var input = file.getInputStream()) {
                Files.copy(input, destination, StandardCopyOption.REPLACE_EXISTING);
            }
            log.info("Saved product image {}", filename);
            return "/uploads/" + filename;
        } catch (IOException exception) {
            throw new UncheckedIOException("Could not save the uploaded image", exception);
        }
    }

    public void deleteManagedImage(String imageUrl) {
        if (imageUrl == null || !imageUrl.startsWith("/uploads/")) {
            return;
        }

        String filename = imageUrl.substring("/uploads/".length());
        if (filename.isBlank() || filename.contains("/") || filename.contains("\\")) {
            return;
        }

        Path image = uploadDirectory.resolve(filename).normalize();
        if (!image.startsWith(uploadDirectory)) {
            return;
        }
        try {
            Files.deleteIfExists(image);
            log.info("Removed replaced product image {}", filename);
        } catch (IOException exception) {
            log.warn("Could not remove replaced product image {}", filename, exception);
        }
    }

    private String validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            log.warn("Product image upload rejected because the file is empty");
            throw new BadRequestException("Image file is required and must not be empty");
        }
        if (file.getSize() > MAX_IMAGE_SIZE) {
            log.warn("Product image upload rejected because the file exceeds the size limit");
            throw new BadRequestException("Image file must not exceed 2 MB");
        }

        String extension = extensionOf(file.getOriginalFilename());
        String expectedMimeType = MIME_BY_EXTENSION.get(extension);
        if (expectedMimeType == null) {
            log.warn("Product image upload rejected because the file extension is unsupported");
            throw new BadRequestException("Only jpg, jpeg, png, and webp images are allowed");
        }

        String contentType = file.getContentType();
        if (contentType == null || !expectedMimeType.equals(contentType.split(";", 2)[0].trim().toLowerCase(Locale.ROOT))) {
            log.warn("Product image upload rejected because content type does not match its extension");
            throw new BadRequestException("Image content type must match its jpg, jpeg, png, or webp file extension");
        }

        try (var input = file.getInputStream()) {
            byte[] signature = input.readNBytes(12);
            if (!hasMatchingSignature(extension, signature)) {
                log.warn("Product image upload rejected because the file signature is invalid");
                throw new BadRequestException("The uploaded file content is not a valid " + extension.toUpperCase(Locale.ROOT) + " image");
            }
        } catch (IOException exception) {
            throw new UncheckedIOException("Could not read the uploaded image", exception);
        }
        return extension;
    }

    private String extensionOf(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) {
            log.warn("Product image upload rejected because the file has no name");
            throw new BadRequestException("Image file must have a jpg, jpeg, png, or webp file extension");
        }
        String portableName = originalFilename.replace('\\', '/');
        String filename = portableName.substring(portableName.lastIndexOf('/') + 1);
        int dot = filename.lastIndexOf('.');
        if (dot < 0 || dot == filename.length() - 1) {
            return "";
        }
        return filename.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private boolean hasMatchingSignature(String extension, byte[] bytes) {
        return switch (extension) {
            case "jpg", "jpeg" -> bytes.length >= 3
                    && (bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8 && (bytes[2] & 0xFF) == 0xFF;
            case "png" -> bytes.length >= 8
                    && (bytes[0] & 0xFF) == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E
                    && bytes[3] == 0x47 && bytes[4] == 0x0D && bytes[5] == 0x0A
                    && bytes[6] == 0x1A && bytes[7] == 0x0A;
            case "webp" -> bytes.length >= 12 && bytes[0] == 'R' && bytes[1] == 'I'
                    && bytes[2] == 'F' && bytes[3] == 'F' && bytes[8] == 'W'
                    && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P';
            default -> false;
        };
    }
}
