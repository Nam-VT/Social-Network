package com.vtn.social_network.exception;

import com.vtn.social_network.dto.ApiResponse;
import com.vtn.social_network.enums.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

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

        @ExceptionHandler(BadCredentialsException.class)
        public ResponseEntity<ApiResponse<Object>> handleBadCredentials(BadCredentialsException ex) {
                log.warn("Authentication failed: {}", ex.getMessage());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                .body(ApiResponse.<Object>builder()
                                                .status(ErrorCode.BAD_CREDENTIALS.getStatus())
                                                .message(ErrorCode.BAD_CREDENTIALS.getMessage())
                                                .build());
        }

        @ExceptionHandler(RuntimeException.class)
        public ResponseEntity<ApiResponse<Object>> handleRuntimeException(RuntimeException ex) {
                log.error("Runtime error: {}", ex.getMessage());
                return ResponseEntity.badRequest()
                                .body(ApiResponse.<Object>builder()
                                                .status(400)
                                                .message(ex.getMessage())
                                                .build());
        }

        @ExceptionHandler(Exception.class)
        public ResponseEntity<ApiResponse<Object>> handleException(Exception ex) {
                log.error("Unexpected error: ", ex);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(ApiResponse.<Object>builder()
                                                .status(ErrorCode.INTERNAL_ERROR.getStatus())
                                                .message(ErrorCode.INTERNAL_ERROR.getMessage())
                                                .build());
        }
}
