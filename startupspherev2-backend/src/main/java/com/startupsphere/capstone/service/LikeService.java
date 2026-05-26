package com.startupsphere.capstone.service;

import com.startupsphere.capstone.entity.Like;
import com.startupsphere.capstone.entity.User;
import com.startupsphere.capstone.repository.LikeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class LikeService {

    @Autowired
    private LikeRepository likeRepository;

    @CacheEvict(value = "likes", allEntries = true)
    public String toggleLike(Like like) {
        if (like.getStartup() != null) {
            Optional<Like> existingLike = likeRepository.findByUserIdAndStartupId(
                    like.getUser().getId(), like.getStartup().getId());
            if (existingLike.isPresent()) {
                likeRepository.delete(existingLike.get());
                return "Like removed";
            }
        }

        if (like.getInvestor() != null) {
            Optional<Like> existingLike = likeRepository.findByUserIdAndInvestor_InvestorId(
                    like.getUser().getId(), like.getInvestor().getInvestorId());
            if (existingLike.isPresent()) {
                // If the like exists, delete it (unlike)
                likeRepository.delete(existingLike.get());
                return "Like removed";
            }
        }

        likeRepository.save(like);
        return "Like added";
    }

    @Cacheable(value = "likes", key = "#pageable.pageNumber + '-' + #pageable.pageSize + '-' + #pageable.sort.toString()")
    public Page<Like> getAllLikes(Pageable pageable) {
        return likeRepository.findAll(pageable);
    }

    public List<Like> getAllLikes() {
        return likeRepository.findAll();
    }

    public Optional<Like> getLikeById(Long id) {
        return likeRepository.findById(id);
    }

    public void deleteLike(Long id) {
        likeRepository.deleteById(id);
    }

    public long getLikeCountByStartupId(Long startupId) {
        return likeRepository.countByStartupId(startupId);
    }

    public Map<String, Long> getLikesGroupedByMonthForStartup(Long startupId) {
        List<Object[]> results = likeRepository.countLikesGroupedByMonthForStartup(startupId);
        Map<String, Long> likesByMonth = new LinkedHashMap<>();

        // Map month numbers to month names
        String[] monthNames = {
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        };

        for (Object[] result : results) {
            Integer month = (Integer) result[0];
            Long count = (Long) result[1];
            likesByMonth.put(monthNames[month - 1], count);
        }

        return likesByMonth;
    }

    public long getTotalLikesForLoggedInUserStartups() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            throw new RuntimeException("Unauthorized: No user is logged in");
        }

        User loggedInUser = (User) authentication.getPrincipal(); // Get the logged-in user
        return likeRepository.countLikesByStartupOwner(loggedInUser.getId());
    }

    public Map<String, Long> getLikesGroupedByMonthForLoggedInUserStartups() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            throw new RuntimeException("Unauthorized: No user is logged in");
        }
    
        User loggedInUser = (User) authentication.getPrincipal(); 
        List<Object[]> results = likeRepository.countLikesGroupedByMonthForUserOwnedStartups(loggedInUser.getId());
    
        Map<String, Long> likesByMonth = new LinkedHashMap<>();
        String[] monthNames = {
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
        };
    
        for (Object[] result : results) {
            Integer month = (Integer) result[0];
            Long count = (Long) result[1];
            likesByMonth.put(monthNames[month - 1], count);
        }
    
        return likesByMonth;
    }

}