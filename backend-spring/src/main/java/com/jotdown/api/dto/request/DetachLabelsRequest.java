package com.jotdown.api.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import java.util.List;

@Data
public class DetachLabelsRequest {

    @NotEmpty(message = "Phải chọn ít nhất một nhãn")
    private List<Long> labelIds;
}
