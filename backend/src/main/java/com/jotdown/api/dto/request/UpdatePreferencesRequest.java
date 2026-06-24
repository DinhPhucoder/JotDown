package com.jotdown.api.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Map;

@Data
public class UpdatePreferencesRequest {

    @NotNull(message = "Preferences không được để trống")
    private Map<String, Object> preferences;
}
