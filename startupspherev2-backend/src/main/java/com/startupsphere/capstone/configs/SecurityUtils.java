package com.startupsphere.capstone.configs;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import com.startupsphere.capstone.repository.UserRepository;
import com.startupsphere.capstone.entity.User;

@Component
public class SecurityUtils {
    
    private static UserRepository userRepository;
    
    @Autowired
    public SecurityUtils(UserRepository userRepository) {
        SecurityUtils.userRepository = userRepository;
    }

    public static Integer getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if(authentication != null && authentication.isAuthenticated()) {
            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found with email: " + email));
            return user.getId();
        }
        throw new IllegalStateException("No authenticated user found");
    }
}