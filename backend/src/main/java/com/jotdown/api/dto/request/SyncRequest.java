package com.jotdown.api.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SyncRequest {
    @NotNull(message = "Danh sách thay đổi là bắt buộc.")
    private List<Map<String, Object>> changes;
}
