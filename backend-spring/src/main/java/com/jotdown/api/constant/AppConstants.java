package com.jotdown.api.constant;

public final class AppConstants {

    private AppConstants() {
        // Prevent instantiation
    }

    // Attachment Types
    public static final String ATTACHMENT_KIND_IMAGE = "IMAGE";

    // Sharing Permissions
    public static final String PERMISSION_EDIT = "EDIT";

    // Note Defaults
    public static final String DEFAULT_NOTE_COLOR = "#ffffff";
    public static final String PROTECTED_NOTE_MASKED_CONTENT = "<p>Đã khoá bằng mật mã Da Vinci. <br/>PSG vs Bayern <br/>Ars vs Aletico</p>";

    // Error Messages
    public static final String ERROR_NOTE_NOT_FOUND = "Ghi chú không tồn tại.";
    public static final String ERROR_NOTE_EMPTY = "Ghi chú phải có tiêu đề, nội dung hoặc ít nhất một tệp đính kèm.";
    public static final String ERROR_NOTE_CONFLICT = "Conflict detected. The note has a newer server version.";
    public static final String ERROR_PASSWORD_INCORRECT = "Mật khẩu không đúng.";
    public static final String ERROR_LABEL_NOT_FOUND = "Một hoặc nhiều nhãn không tồn tại";
    public static final String ERROR_LABEL_FORBIDDEN = "Bạn không sở hữu nhãn này.";
}
