package com.startupsphere.capstone.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.startupsphere.capstone.entity.User;
import com.startupsphere.capstone.repository.UserRepository;

import java.util.*;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<User> allUsers() {
        List<User> users = new ArrayList<>();

        userRepository.findAll().forEach(users::add);

        return users;
    }


    public Optional<User> findById(Integer id) {
        return userRepository.findById(id);
    }

    public User updateProfile(Integer id, String displayUsername, String contactNumber, String profilePicture, boolean removeProfilePicture) {
        return userRepository.findById(id)
                .map(existingUser -> {
                    if (displayUsername != null) {
                        String trimmed = displayUsername.trim();
                        existingUser.setDisplayUsername(trimmed.isEmpty() ? null : trimmed);
                    }
                    if (contactNumber != null) {
                        String trimmed = contactNumber.trim();
                        existingUser.setContactNumber(trimmed.isEmpty() ? null : trimmed);
                    }
                    if (removeProfilePicture) {
                        existingUser.setProfilePicture(null);
                    } else if (profilePicture != null && !profilePicture.isBlank()) {
                        existingUser.setProfilePicture(profilePicture);
                    }
                    return userRepository.save(existingUser);
                }).orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User updateUser(Integer id, User updatedUser) {
        return userRepository.findById(id)
                .map(existingUser -> {
                    existingUser.setFirstname(updatedUser.getFirstname());
                    existingUser.setLastname(updatedUser.getLastname());
                    existingUser.setEmail(updatedUser.getEmail());  
                    existingUser.setRole(updatedUser.getRole());
                    return userRepository.save(existingUser);
                }).orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User updatePassword(Integer id, String newPassword) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setPassword(passwordEncoder.encode(newPassword));
                    return userRepository.save(user);
                }).orElseThrow(() -> new RuntimeException("User not found"));
    }
    

}
