package com.startupsphere.capstone.controller;

import com.startupsphere.capstone.dtos.LikeRequest;
import com.startupsphere.capstone.entity.Investor;
import com.startupsphere.capstone.entity.Like;
import com.startupsphere.capstone.entity.Startup;
import com.startupsphere.capstone.entity.User;
import com.startupsphere.capstone.repository.InvestorRepository;
import com.startupsphere.capstone.repository.StartupRepository;
import com.startupsphere.capstone.repository.UserRepository;
import com.startupsphere.capstone.service.LikeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/likes")
public class LikeController {

    @Autowired
    private LikeService likeService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StartupRepository startupRepository;

    @Autowired
    private InvestorRepository investorRepository;

    @PostMapping
    public ResponseEntity<Object> toggleLike(@RequestBody LikeRequest likeRequest) {
        likeRequest.validate();

        Integer userId = likeRequest.getUserId();
        Long startupId = likeRequest.getStartupId();
        Integer investorId = likeRequest.getInvestorId();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Startup startup = null;
        if (startupId != null) {
            startup = startupRepository.findById(startupId)
                    .orElseThrow(() -> new RuntimeException("Startup not found"));
        }

        Investor investor = null;
        if (investorId != null) {
            investor = investorRepository.findById(investorId)
                    .orElseThrow(() -> new RuntimeException("Investor not found"));
        }

        Like like = new Like();
        like.setUser(user);
        like.setStartup(startup);
        like.setInvestor(investor);

        // Toggle the like (like or unlike)
        String result = likeService.toggleLike(like);

        // Return the result as a JSON response
        return ResponseEntity.ok(Map.of("message", result));
    }

    @GetMapping
    public ResponseEntity<Page<LikeRequest>> getAllLikes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "timestamp") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<LikeRequest> likes = likeService.getAllLikes(pageable).map(like -> {
            LikeRequest dto = new LikeRequest();
            dto.setId(like.getId());
            dto.setTimestamp(like.getTimestamp());
            dto.setUserId(like.getUser() != null ? like.getUser().getId() : null);
            dto.setStartupId(like.getStartup() != null ? like.getStartup().getId() : null);
            dto.setInvestorId(like.getInvestor() != null ? like.getInvestor().getInvestorId() : null);
            return dto;
        });
        return ResponseEntity.ok(likes);
    }

    @GetMapping("/{id}")
    public Optional<Like> getLikeById(@PathVariable Long id) {
        return likeService.getLikeById(id);
    }

    @DeleteMapping("/{id}")
    public void deleteLike(@PathVariable Long id) {
        likeService.deleteLike(id);
    }

    @GetMapping("/count/startup/{startupId}")
    public ResponseEntity<Long> getLikeCountByStartupId(@PathVariable Long startupId) {
        long count = likeService.getLikeCountByStartupId(startupId);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/grouped-by-month/startup/{startupId}")
    public ResponseEntity<Map<String, Long>> getLikesGroupedByMonthForStartup(@PathVariable Long startupId) {
        Map<String, Long> likesByMonth = likeService.getLikesGroupedByMonthForStartup(startupId);
        return ResponseEntity.ok(likesByMonth);
    }

    @GetMapping("/count/logged-in-user-startups")
    public ResponseEntity<Long> getTotalLikesForLoggedInUserStartups() {
        try {
            long totalLikes = likeService.getTotalLikesForLoggedInUserStartups();
            return ResponseEntity.ok(totalLikes);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(null); // Unauthorized
        }
    }

    @GetMapping("/grouped-by-month/logged-in-user-startups")
    public ResponseEntity<Map<String, Long>> getLikesGroupedByMonthForLoggedInUserStartups() {
        try {
            Map<String, Long> likesByMonth = likeService.getLikesGroupedByMonthForLoggedInUserStartups();
            return ResponseEntity.ok(likesByMonth);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(null); // Unauthorized
        }
    }
}