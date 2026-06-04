package com.vtn.social_network.security;

import com.vtn.social_network.dto.auth.response.AuthResponse;
import com.vtn.social_network.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@Component
public class OAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    @org.springframework.context.annotation.Lazy
    @org.springframework.beans.factory.annotation.Autowired
    private AuthService authService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        log.info("OAuth2 login success for: {}", (Object) oAuth2User.getAttribute("email"));

        AuthResponse authResponse = authService.processOAuth2Login(oAuth2User);

        // Redirect về Frontend kèm token trong URL params
        String baseUrl = request.getScheme() + "://" + request.getServerName();
        if (request.getServerPort() != 80 && request.getServerPort() != 443) {
            baseUrl += ":" + request.getServerPort();
        }
        
        String redirectUrl = baseUrl + "/oauth2/callback"
                + "?token=" + URLEncoder.encode(authResponse.getToken(), StandardCharsets.UTF_8)
                + "&refreshToken=" + URLEncoder.encode(authResponse.getRefreshToken(), StandardCharsets.UTF_8);
        
        response.sendRedirect(redirectUrl);
    }
}
