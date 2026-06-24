package com.jotdown.api.exception;

import lombok.Getter;

@Getter
public class ConflictException extends RuntimeException {
    private final int clientVersion;
    private final int serverVersion;
    private final Object serverNote;

    public ConflictException(String message, int clientVersion, int serverVersion, Object serverNote) {
        super(message);
        this.clientVersion = clientVersion;
        this.serverVersion = serverVersion;
        this.serverNote = serverNote;
    }
}
