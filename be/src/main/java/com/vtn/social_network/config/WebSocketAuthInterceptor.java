package com.vtn.social_network.config;

import com.vtn.social_network.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Interceptor kiểm tra JWT khi client gửi gói tin STOMP CONNECT.
 * Nếu token hợp lệ → set Principal cho phiên WebSocket.
 * Nếu không hợp lệ → reject (trả về null để ngắt kết nối).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtUtils jwtUtils;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null)
            return message;

        // Chỉ kiểm tra khi CONNECT
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.warn("WebSocket CONNECT bị từ chối: thiếu Authorization header");
                return null; // reject connection
            }

            String token = authHeader.substring(7);

            if (!jwtUtils.isValidToken(token)) {
                log.warn("WebSocket CONNECT bị từ chối: token không hợp lệ hoặc đã hết hạn");
                return null; // reject connection
            }

            String username = jwtUtils.extractUsername(token);
            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    username, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
            accessor.setUser(auth);

            log.info("WebSocket CONNECT được xác thực: user={}", username);
        }

        return message;
    }
}
