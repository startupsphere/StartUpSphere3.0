package com.startupsphere.capstone.controller;

import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.Cookie;

import com.startupsphere.capstone.dtos.LoginUserDto;
import com.startupsphere.capstone.dtos.RegisterUserDto;
import com.startupsphere.capstone.entity.User;
import com.startupsphere.capstone.responses.LoginResponse;
import com.startupsphere.capstone.service.AuthenticationService;
import com.startupsphere.capstone.service.JwtService;

import jakarta.servlet.http.HttpServletResponse;

@RequestMapping("/auth")
@RestController
public class AuthenticationController {
    private final JwtService jwtService;
    private final AuthenticationService authenticationService;

    public AuthenticationController(JwtService jwtService, AuthenticationService authenticationService) {
        this.jwtService = jwtService;
        this.authenticationService = authenticationService;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> register(@RequestBody RegisterUserDto registerUserDto) {
        try {
            User registeredUser = authenticationService.signup(registerUserDto);
            return ResponseEntity.ok(registeredUser);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            String msg = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
            if (msg.contains("users_pkey") || msg.contains("duplicate key")) {
                return ResponseEntity.status(409)
                        .body(java.util.Map.of("error", "An account registration conflict occurred. Please try submitting again."));
            }
            return ResponseEntity.status(400)
                    .body(java.util.Map.of("error", "Registration could not be completed. Please check your information and try again."));
        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : "";
            if (msg.toLowerCase().contains("email already exists")) {
                return ResponseEntity.status(409)
                        .body(java.util.Map.of("error", "This email address is already registered. Please sign in or use a different email."));
            }
            return ResponseEntity.status(400)
                    .body(java.util.Map.of("error", "Registration failed. Please verify your details and try again."));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticate(
            @RequestBody LoginUserDto loginUserDto,
            HttpServletResponse response) {
        try {
            User authenticatedUser = authenticationService.authenticate(loginUserDto);

            String jwtToken = jwtService.generateToken(authenticatedUser);

            // Create an HTTP-only cookie
            ResponseCookie cookie = ResponseCookie.from("token", jwtToken)
                    .httpOnly(true)
                    .secure(true) // Set to true if using HTTPS
                    .path("/")
                    .sameSite("None")
                    .maxAge(3600)
                    .build();

            // Add the cookie to the response
            response.addHeader("Set-Cookie", cookie.toString());

            // Return the response body (optional)
            LoginResponse loginResponse = new LoginResponse()
                    .setToken(jwtToken);

            return ResponseEntity.ok(loginResponse);
        } catch (Exception e) {
            return ResponseEntity.status(401)
                    .body(java.util.Map.of("error", "Invalid email or password. Please try again."));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("token", "")
                .httpOnly(true)
                .secure(true) // Set to true if using HTTPS
                .path("/")
                .sameSite("None")
                .maxAge(0) // Expire the cookie immediately
                .build();
                

        response.addHeader("Set-Cookie", cookie.toString());

        return ResponseEntity.noContent().build(); // Return 204 No Content
    }

    @GetMapping("/check")
    public ResponseEntity<Boolean> checkAuthentication() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        boolean isAuthenticated = authentication != null && authentication.isAuthenticated()
                && !(authentication.getPrincipal() instanceof String
                        && authentication.getPrincipal().equals("anonymousUser"));

        return ResponseEntity.ok(isAuthenticated);
    }
}