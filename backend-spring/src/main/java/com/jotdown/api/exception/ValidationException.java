package com.jotdown.api.exception;

import lombok.Getter;
import java.util.HashMap;
import java.util.Map;

@Getter
public class ValidationException extends RuntimeException {
    private final Map<String, String> errors;

    public ValidationException(String message, Map<String, String> errors) {
        super(message);
        this.errors = errors;
    }

    public ValidationException(String field, String message) {
        super("The given data was invalid.");
        this.errors = new HashMap<>();
        this.errors.put(field, message);
    }
}
