package com.vtn.social_network.exception;

import com.vtn.social_network.dto.ApiResponse;
import com.vtn.social_network.enums.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ===== Validation (400) =====

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidationException(MethodArgumentNotValidException ex) {
        String errors = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));

        log.warn("Validation error: {}", errors);
        return ResponseEntity.badRequest()
                .body(ApiResponse.<Object>builder()
                        .status(ErrorCode.INVALID_INPUT.getStatus())
                        .message(errors)
                        .build());
    }

    // ===== Auth (401) =====

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Object>> handleBadCredentials(BadCredentialsException ex) {
        log.warn("Authentication failed: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.<Object>builder()
                        .status(ErrorCode.BAD_CREDENTIALS.getStatus())
                        .message(ErrorCode.BAD_CREDENTIALS.getMessage())
                        .build());
    }

    // ===== Access Denied (403) =====

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Object>> handleAccessDenied(AccessDeniedException ex) {
        log.warn("Access denied: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.<Object>builder()
                        .status(ErrorCode.UNAUTHORIZED.getStatus())
                        .message(ErrorCode.UNAUTHORIZED.getMessage())
                        .build());
    }

    // ===== RuntimeException — smart mapping theo message =====

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<Object>> handleRuntimeException(RuntimeException ex) {
        String message = ex.getMessage();
        log.warn("Runtime error: {}", message);

        HttpStatus status = resolveStatus(message);
        return ResponseEntity.status(status)
                .body(ApiResponse.<Object>builder()
                        .status(status.value())
                        .message(message != null ? message : ErrorCode.INTERNAL_ERROR.getMessage())
                        .build());
    }

    // ===== Generic fallback (500) =====

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleException(Exception ex) {
        log.error("Unexpected error: ", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.<Object>builder()
                        .status(ErrorCode.INTERNAL_ERROR.getStatus())
                        .message(ErrorCode.INTERNAL_ERROR.getMessage())
                        .build());
    }

    // ===== Helper: map message → HTTP status =====

    private HttpStatus resolveStatus(String message) {
        if (message == null) return HttpStatus.INTERNAL_SERVER_ERROR;

        // Khớp chính xác với ErrorCode trước
        for (ErrorCode ec : ErrorCode.values()) {
            if (message.equals(ec.getMessage())) {
                return HttpStatus.valueOf(ec.getStatus());
            }
        }

        // Heuristic theo từ khóa tiếng Việt / English
        String lower = message.toLowerCase();
        if (lower.contains("không tìm thấy") || lower.contains("not found")) {
            return HttpStatus.NOT_FOUND;
        }
        if (lower.contains("không có quyền") || lower.contains("chỉ tác giả")
                || lower.contains("chỉ admin") || lower.contains("chỉ thành viên")
                || lower.contains("chỉ chủ")) {
            return HttpStatus.FORBIDDEN;
        }
        if (lower.contains("đã tồn tại") || lower.contains("already")
                || lower.contains("quá thời gian") || lower.contains("không thể")) {
            return HttpStatus.BAD_REQUEST;
        }

        return HttpStatus.BAD_REQUEST;
    }
}
