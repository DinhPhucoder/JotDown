package com.jotdown.api.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;

import com.jotdown.api.entity.Note;
import com.jotdown.api.entity.NoteAttachment;
import com.jotdown.api.exception.ValidationException;

@Service
@Slf4j
public class CloudinaryService {

    @Value("${app.cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${app.cloudinary.api-key:}")
    private String apiKey;

    @Value("${app.cloudinary.api-secret:}")
    private String apiSecret;

    @Value("${app.cloudinary.folder:note-attachments}")
    private String defaultFolder;

    private static final int MAX_ATTACHMENTS = 3;
    private static final long MAX_TOTAL_BYTES = 15728640L; // 15MB

    private final RestTemplate restTemplate = new RestTemplate();

    public boolean isConfigured() {
        return cloudName != null && !cloudName.isEmpty() &&
               apiKey != null && !apiKey.isEmpty() &&
               apiSecret != null && !apiSecret.isEmpty();
    }

    /**
     * Upload an image file directly from the server to Cloudinary.
     * Used for avatar uploads.
     */
    public String uploadAvatar(MultipartFile file) throws IOException {
        if (!isConfigured()) {
            throw new IllegalStateException("Cloudinary is not configured on the server.");
        }

        long timestamp = System.currentTimeMillis() / 1000L;
        String folder = "avatars";
        String transformation = "c_fill,g_face,w_256,h_256";

        Map<String, Object> params = new HashMap<>();
        params.put("folder", folder);
        params.put("timestamp", timestamp);
        params.put("transformation", transformation);

        String signature = generateSignature(params);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename();
            }
        });
        body.add("api_key", apiKey);
        body.add("timestamp", String.valueOf(timestamp));
        body.add("folder", folder);
        body.add("transformation", transformation);
        body.add("signature", signature);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
        String url = "https://api.cloudinary.com/v1_1/" + cloudName + "/image/upload";

        @SuppressWarnings("rawtypes")
        ResponseEntity<Map> response = restTemplate.postForEntity(url, requestEntity, Map.class);
        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            return (String) response.getBody().get("secure_url");
        } else {
            throw new IOException("Failed to upload image to Cloudinary: " + response.getStatusCode());
        }
    }

    /**
     * Generate signature for client-side direct uploads or server uploads.
     */
    public String generateSignature(Map<String, Object> params) {
        // Sort parameters alphabetically
        List<String> sortedKeys = new ArrayList<>(params.keySet());
        Collections.sort(sortedKeys);

        StringBuilder queryBuilder = new StringBuilder();
        for (String key : sortedKeys) {
            if (queryBuilder.length() > 0) {
                queryBuilder.append("&");
            }
            queryBuilder.append(key).append("=").append(params.get(key));
        }

        // Append api_secret without query separator
        String toSign = queryBuilder.toString() + apiSecret;
        return sha1(toSign);
    }

    private String sha1(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-1");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-1 algorithm not found", e);
        }
    }

    public String getBlurredUrl(String url) {
        if (url == null) return null;
        return url.replace("/upload/", "/upload/e_blur:2000/");
    }

    public void assertValidCloudinaryUrl(String url) {
        if (!isConfigured()) {
            throw new IllegalStateException("Cloudinary is not configured.");
        }
        String prefix = "https://res.cloudinary.com/" + cloudName + "/image/upload/";
        if (url == null || !url.startsWith(prefix)) {
            throw new ValidationException("file_url", "URL ảnh không hợp lệ hoặc không thuộc Cloudinary.");
        }
        if (defaultFolder != null && !defaultFolder.isEmpty() && !url.contains("/" + defaultFolder + "/")) {
            throw new ValidationException("file_url", "Ảnh không thuộc thư mục upload được cho phép.");
        }
    }

    public void assertAttachmentLimit(Note note, long incomingFileSize) {
        int currentCount = note.getAttachments() != null ? note.getAttachments().size() : 0;
        if (currentCount >= MAX_ATTACHMENTS) {
            throw new ValidationException("file_url", "Mỗi ghi chú chỉ được tối đa 3 ảnh.");
        }

        long currentTotalSize = 0;
        if (note.getAttachments() != null) {
            for (NoteAttachment attachment : note.getAttachments()) {
                currentTotalSize += attachment.getFileSize();
            }
        }

        if (currentTotalSize + incomingFileSize > MAX_TOTAL_BYTES) {
            throw new ValidationException("file_size", "Tổng dung lượng ảnh của ghi chú không được vượt quá 15MB.");
        }
    }

    public String normalizeFileType(String fileType) {
        if (fileType == null) {
            throw new ValidationException("file_type", "Chỉ hỗ trợ ảnh định dạng JPG hoặc PNG.");
        }
        String normalized = fileType.toLowerCase().trim();
        switch (normalized) {
            case "jpg":
            case "jpeg":
            case "image/jpeg":
                return "image/jpeg";
            case "png":
            case "image/png":
                return "image/png";
            default:
                throw new ValidationException("file_type", "Chỉ hỗ trợ ảnh định dạng JPG hoặc PNG.");
        }
    }

    public Map<String, Object> buildSignaturePayload() {
        if (!isConfigured()) {
            throw new ValidationException("cloudinary", "Cloudinary chưa được cấu hình đầy đủ trên server.");
        }

        long timestamp = System.currentTimeMillis() / 1000L;
        String folder = defaultFolder != null ? defaultFolder.trim() : "note-attachments";

        Map<String, Object> params = new HashMap<>();
        params.put("folder", folder);
        params.put("timestamp", timestamp);

        String signature = generateSignature(params);

        Map<String, Object> payload = new HashMap<>();
        payload.put("signature", signature);
        payload.put("timestamp", timestamp);
        payload.put("api_key", apiKey);
        payload.put("cloud_name", cloudName);
        payload.put("folder", folder);
        payload.put("upload_url", "https://api.cloudinary.com/v1_1/" + cloudName + "/image/upload");

        return payload;
    }
}
