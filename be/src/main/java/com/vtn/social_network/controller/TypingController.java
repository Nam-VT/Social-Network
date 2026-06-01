package com.vtn.social_network.controller;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Slf4j
@Controller
@RequiredArgsConstructor
public class TypingController {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat/{roomId}/typing")
    public void handleTyping(
            @DestinationVariable Long roomId,
            @Payload TypingPayload payload,
            Principal principal) {

        String username = principal.getName();
        payload.setUsername(username);

        // Broadcast tới tất cả người nghe trong phòng chat
        messagingTemplate.convertAndSend("/topic/chat/" + roomId + "/typing", payload);
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TypingPayload {
        private String username;
        private boolean isTyping;
    }
}
