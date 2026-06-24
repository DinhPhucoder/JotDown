package com.jotdown.api.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateLabelRequest {

    @Size(max = 100, message = "Tên nhãn không được vượt quá 100 ký tự")
    private String name;
}
