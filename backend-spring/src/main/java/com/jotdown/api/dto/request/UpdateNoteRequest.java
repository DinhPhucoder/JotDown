package com.jotdown.api.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateNoteRequest {

    @NotNull(message = "Version is required when updating a note")
    @Min(value = 1, message = "Version is invalid")
    private Integer version;

    @Size(max = 255, message = "Title may not be greater than 255 characters")
    private String title;

    @Size(max = 10000, message = "Content may not be greater than 10000 characters")
    private String content;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Color must be a valid hex value (example: #000000)")
    private String color;

    private Boolean isPinned;

    private Boolean isProtected;

    @Size(min = 4, max = 255, message = "Password must be between 4 and 255 characters")
    private String password;
}
