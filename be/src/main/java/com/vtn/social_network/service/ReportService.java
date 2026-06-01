package com.vtn.social_network.service;

import com.vtn.social_network.entity.Report;
import com.vtn.social_network.entity.User;
import com.vtn.social_network.enums.*;
import com.vtn.social_network.repository.ReportRepository;
import com.vtn.social_network.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;

    @Transactional
    public void createReport(String username, ReportRequest request) {
        User reporter = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(ErrorCode.USER_NOT_FOUND.getMessage()));

        Report report = Report.builder()
                .reporter(reporter)
                .targetType(request.getTargetType())
                .targetId(request.getTargetId())
                .reason(request.getReason())
                .description(request.getDescription())
                .build();

        reportRepository.save(report);
        log.info("User {} đã báo cáo {} #{} vì {}", username, request.getTargetType(),
                request.getTargetId(), request.getReason());
    }

    @Transactional(readOnly = true)
    public Page<ReportResponse> getReports(ReportStatus status, Pageable pageable) {
        Page<Report> reports;
        if (status != null) {
            reports = reportRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        } else {
            reports = reportRepository.findAllByOrderByCreatedAtDesc(pageable);
        }
        return reports.map(this::toReportResponse);
    }

    @Transactional
    public void updateReportStatus(Long reportId, ReportStatus newStatus) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy báo cáo"));

        report.setStatus(newStatus);
        report.setReviewedAt(LocalDateTime.now());
        reportRepository.save(report);
        log.info("Admin đã cập nhật báo cáo #{} thành {}", reportId, newStatus);
    }

    private ReportResponse toReportResponse(Report report) {
        return ReportResponse.builder()
                .id(report.getId())
                .reporterUsername(report.getReporter().getUsername())
                .targetType(report.getTargetType())
                .targetId(report.getTargetId())
                .reason(report.getReason())
                .description(report.getDescription())
                .status(report.getStatus())
                .createdAt(report.getCreatedAt())
                .reviewedAt(report.getReviewedAt())
                .build();
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ReportRequest {
        private TargetType targetType;
        private Long targetId;
        private ReportReason reason;
        private String description;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ReportResponse {
        private Long id;
        private String reporterUsername;
        private TargetType targetType;
        private Long targetId;
        private ReportReason reason;
        private String description;
        private ReportStatus status;
        private LocalDateTime createdAt;
        private LocalDateTime reviewedAt;
    }

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class StatusUpdateRequest {
        private ReportStatus status;
    }
}
