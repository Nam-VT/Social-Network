package com.vtn.social_network.config;

import tools.jackson.databind.ObjectMapper;
import com.vtn.social_network.dto.ApiResponse;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.codec.ByteArrayCodec;
import io.lettuce.core.codec.RedisCodec;
import io.lettuce.core.codec.StringCodec;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.function.Supplier;

/**
 * Rate Limiting Filter sử dụng Bucket4j + Redis.
 * Các quy tắc:
 * - POST /api/auth/signin → 10 requests / phút / IP
 * - POST /api/auth/signup → 5 requests / phút / IP
 * - (các endpoint khác không bị giới hạn)
 */
@Slf4j
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final ProxyManager<String> proxyManager;
    private final ObjectMapper objectMapper;

    // Cấu hình giới hạn
    private static final int SIGNIN_LIMIT = 10;
    private static final int SIGNUP_LIMIT = 5;
    private static final int POST_LIMIT = 30;
    private static final int COMMENT_LIMIT = 60;
    private static final int FRIEND_REQ_LIMIT = 30;
    private static final int GLOBAL_LIMIT = 150;
    private static final Duration WINDOW = Duration.ofMinutes(1);

    public RateLimitFilter(
            @Value("${spring.data.redis.url:redis://localhost:6379}") String redisUrl,
            ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        RedisClient redisClient = RedisClient.create(redisUrl);
        StatefulRedisConnection<String, byte[]> connection = redisClient
                .connect(RedisCodec.of(StringCodec.UTF8, ByteArrayCodec.INSTANCE));
        this.proxyManager = LettuceBasedProxyManager.builderFor(connection)
                .build();
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain chain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();

        // Chỉ rate-limit một số endpoint cụ thể
        Integer limit = resolveLimit(method, path);
        if (limit == null) {
            chain.doFilter(request, response);
            return;
        }

        // Key: endpoint + IP để tránh nhầm lẫn giữa các endpoint
        String clientIp = getClientIp(request);
        String bucketKey = "rate:" + path.replaceAll("/", "_") + ":" + clientIp;

        Supplier<BucketConfiguration> config = () -> BucketConfiguration.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(limit)
                        .refillIntervally(limit, WINDOW)
                        .build())
                .build();

        io.github.bucket4j.Bucket bucket = proxyManager.builder().build(bucketKey, config);

        if (bucket.tryConsume(1)) {
            chain.doFilter(request, response);
        } else {
            log.warn("Rate limit exceeded — path={} ip={}", path, clientIp);
            sendTooManyRequests(response);
        }
    }

    // ===== Helpers =====

    /** Trả về giới hạn cho endpoint, null = không áp dụng */
    private Integer resolveLimit(String method, String path) {
        if ("POST".equalsIgnoreCase(method)) {
            if (path.equals("/api/auth/signin"))
                return SIGNIN_LIMIT;
            if (path.equals("/api/auth/signup"))
                return SIGNUP_LIMIT;
            if (path.equals("/api/posts"))
                return POST_LIMIT;
            if (path.equals("/api/comments"))
                return COMMENT_LIMIT;
            if (path.matches("^/api/friends/request/[0-9]+$"))
                return FRIEND_REQ_LIMIT;
        }

        // Tấm khiên toàn cầu cho tất cả các API còn lại
        if (path.startsWith("/api/")) {
            return GLOBAL_LIMIT;
        }

        return null;
    }

    /** Lấy IP thực của client (hỗ trợ proxy / load balancer) */
    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    /** Trả về response 429 dạng JSON */
    private void sendTooManyRequests(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        ApiResponse<Object> body = ApiResponse.builder()
                .status(429)
                .message("Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút.")
                .build();
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
