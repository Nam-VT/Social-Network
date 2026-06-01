package com.vtn.social_network.controller;

import com.vtn.social_network.dto.ApiResponse;
import com.vtn.social_network.enums.ErrorCode;
import com.vtn.social_network.enums.ReportStatus;
import com.vtn.social_network.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    /**
     * User tạo báo cáo vi phạm.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Object>> createReport(
            Authentication authentication,
            @RequestBody ReportService.ReportRequest request) {
        reportService.createReport(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.builder()
                .status(ErrorCode.CREATED.getStatus())
                .message("Đã gửi báo cáo vi phạm")
                .build());
    }

    /**
     * Admin xem danh sách báo cáo.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ReportService.ReportResponse>>> getReports(
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.<Page<ReportService.ReportResponse>>builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .data(reportService.getReports(status, PageRequest.of(page, size)))
                .build());
    }

    /**
     * Admin cập nhật trạng thái báo cáo.
     */
    @PutMapping("/{reportId}")
    public ResponseEntity<ApiResponse<Object>> updateReportStatus(
            @PathVariable Long reportId,
            @RequestBody ReportService.StatusUpdateRequest request) {
        reportService.updateReportStatus(reportId, request.getStatus());
        return ResponseEntity.ok(ApiResponse.builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .message("Đã cập nhật trạng thái báo cáo")
                .build());
    }
}
