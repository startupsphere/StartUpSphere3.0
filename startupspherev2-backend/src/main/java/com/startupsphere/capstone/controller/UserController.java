package com.startupsphere.capstone.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.startupsphere.capstone.entity.User;
import com.startupsphere.capstone.service.UserService;

import java.util.*;

@RequestMapping("/users")
@RestController
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<User> authenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof User)) {
            return ResponseEntity.status(401).build();
        }

        User currentUser = (User) authentication.getPrincipal();
        User freshUser = userService.findById(currentUser.getId()).orElse(currentUser);

        return ResponseEntity.ok(freshUser);
    }

    @PutMapping("/me/profile")
    public ResponseEntity<?> updateMyProfile(@RequestBody Map<String, Object> payload) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof User)) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        User currentUser = (User) authentication.getPrincipal();
        String displayUsername = payload.containsKey("displayUsername")
                ? (payload.get("displayUsername") != null ? String.valueOf(payload.get("displayUsername")) : "")
                : null;
        String contactNumber = payload.containsKey("contactNumber")
                ? (payload.get("contactNumber") != null ? String.valueOf(payload.get("contactNumber")) : "")
                : null;
        String profilePicture = payload.containsKey("profilePicture") && payload.get("profilePicture") != null
                ? String.valueOf(payload.get("profilePicture"))
                : null;
        boolean removeProfilePicture = Boolean.TRUE.equals(payload.get("removeProfilePicture"));

        // Basic size guard (~2MB max base64 string)
        if (profilePicture != null && profilePicture.length() > 2_800_000) {
            return ResponseEntity.badRequest().body(Map.of("error", "Profile image is too large. Please upload a smaller image."));
        }

        User updated = userService.updateProfile(
                currentUser.getId(),
                displayUsername,
                contactNumber,
                profilePicture,
                removeProfilePicture
        );
        return ResponseEntity.ok(updated);
    }

    @GetMapping
    public ResponseEntity<List<User>> allUsers() {
        List<User> users = userService.allUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/me/role")
    public ResponseEntity<String> getLoggedInUserRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof User)) {
            return ResponseEntity.status(401).body("Unauthorized: No user is logged in");
        }

        User currentUser = (User) authentication.getPrincipal();
        String role = currentUser.getRole();

        return ResponseEntity.ok(role);
    }
}
