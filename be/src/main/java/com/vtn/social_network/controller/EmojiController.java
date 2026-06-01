package com.vtn.social_network.controller;

import com.vtn.social_network.dto.ApiResponse;
import com.vtn.social_network.enums.ErrorCode;
import lombok.Builder;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Trả về danh sách emoji có sẵn theo category.
 * Hardcoded — không cần database.
 */
@RestController
@RequestMapping("/api/emojis")
public class EmojiController {

    @Data
    @Builder
    public static class EmojiCategory {
        private String name;
        private List<String> emojis;
    }

    private static final List<EmojiCategory> EMOJI_LIST = List.of(
            EmojiCategory.builder()
                    .name("Smileys")
                    .emojis(List.of("😀", "😂", "🤣", "😊", "😍", "🥰", "😘", "😎", "🤩", "😇",
                            "🤗", "🤔", "😏", "😢", "😭", "😤", "😡", "🤯", "😱", "🥺"))
                    .build(),
            EmojiCategory.builder()
                    .name("Gestures")
                    .emojis(List.of("👍", "👎", "👌", "✌️", "🤞", "🤟", "🤙", "👏", "🙌", "🤝",
                            "💪", "🙏", "✋", "🤚", "👋", "🖐️", "☝️", "👆", "👇", "👈"))
                    .build(),
            EmojiCategory.builder()
                    .name("Hearts")
                    .emojis(List.of("❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
                            "❤️‍🔥", "💖", "💗", "💓", "💞", "💕", "💝", "💘", "💟", "♥️"))
                    .build(),
            EmojiCategory.builder()
                    .name("Animals")
                    .emojis(List.of("🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
                            "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🦅", "🦋"))
                    .build(),
            EmojiCategory.builder()
                    .name("Food")
                    .emojis(List.of("🍎", "🍕", "🍔", "🍟", "🌭", "🌮", "🍣", "🍜", "🍩", "🎂",
                            "🍰", "☕", "🍺", "🍷", "🥤", "🧃", "🍦", "🍫", "🍿", "🥂"))
                    .build(),
            EmojiCategory.builder()
                    .name("Activities")
                    .emojis(List.of("⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🎮", "🎯", "🎲", "🎭",
                            "🎬", "🎤", "🎧", "🎵", "🎶", "🎪", "🎨", "🏆", "🥇", "🎖️"))
                    .build(),
            EmojiCategory.builder()
                    .name("Objects")
                    .emojis(List.of("🔥", "⭐", "🌟", "💫", "✨", "💥", "💯", "🎉", "🎊", "🏠",
                            "🚗", "✈️", "🚀", "💻", "📱", "⏰", "💡", "📷", "🎁", "📌"))
                    .build());

    @GetMapping
    public ResponseEntity<ApiResponse<List<EmojiCategory>>> getEmojis() {
        return ResponseEntity.ok(ApiResponse.<List<EmojiCategory>>builder()
                .status(ErrorCode.SUCCESS.getStatus())
                .message(ErrorCode.SUCCESS.getMessage())
                .data(EMOJI_LIST)
                .build());
    }
}
