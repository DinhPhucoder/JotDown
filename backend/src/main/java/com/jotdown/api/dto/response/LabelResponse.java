package com.jotdown.api.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LabelResponse {
    private Long id;
    private String name;
}

