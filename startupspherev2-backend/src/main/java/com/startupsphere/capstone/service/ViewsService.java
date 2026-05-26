package com.startupsphere.capstone.service;

import com.startupsphere.capstone.entity.Startup;
import com.startupsphere.capstone.entity.User;
import com.startupsphere.capstone.entity.Views;
import com.startupsphere.capstone.repository.ViewsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

import java.time.Instant;
import java.time.Month;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ViewsService {

    private final ViewsRepository viewsRepository;

    @Autowired
    public ViewsService(ViewsRepository viewsRepository) {
        this.viewsRepository = viewsRepository;
    }

    // Create a view
    @CacheEvict(value = "views", allEntries = true)
    public Views createView(User user, Startup startup) {
        // Check if a view already exists for the same user and startup
        boolean exists = viewsRepository.existsByUserAndStartup(user, startup);
        if (exists) {
            throw new RuntimeException("User already viewed this startup");
        }

        // Create and save the view
        Views view = new Views(user, startup, Instant.now());
        return viewsRepository.save(view);
    }

    // Create or update a view
    public Views saveView(Views view) {
        return viewsRepository.save(view);
    }

    // Get all views with pagination
    @Cacheable(value = "views", key = "#pageable.pageNumber + '-' + #pageable.pageSize + '-' + #pageable.sort.toString()")
    public Page<Views> getAllViews(Pageable pageable) {
        return viewsRepository.findAll(pageable);
    }

    // Get all views
    public List<Views> getAllViews() {
        return viewsRepository.findAll();
    }

    // Get a view by ID
    public Optional<Views> getViewById(Long id) {
        return viewsRepository.findById(id);
    }

    // Delete a view by ID
    @CacheEvict(value = "views", allEntries = true)
    public void deleteView(Long id) {
        if (viewsRepository.existsById(id)) {
            viewsRepository.deleteById(id);
        } else {
            throw new RuntimeException("View with ID " + id + " not found");
        }
    }

    public Map<String, Long> getViewCountsByMonth(Long startupId) {
        List<Object[]> results = viewsRepository.countViewsByMonthAndStartup(startupId);
        Map<String, Long> viewCountsByMonth = new HashMap<>();
        for (Object[] result : results) {
            Integer monthNumber = (Integer) result[0];
            Long count = (Long) result[1];
            String monthName = Month.of(monthNumber).name(); // Convert month number to name
            viewCountsByMonth.put(monthName.substring(0, 1).toUpperCase() + monthName.substring(1).toLowerCase(),
                    count);
        }
        return viewCountsByMonth;
    }

    public long getTotalViewsForLoggedInUserStartups() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getPrincipal().equals("anonymousUser")) {
            throw new RuntimeException("Unauthorized: No user is logged in");
        }

        User loggedInUser = (User) authentication.getPrincipal(); // Get the logged-in user
        return viewsRepository.countViewsByStartupOwner(loggedInUser.getId());

    }

    public Map<String, Long> getViewsGroupedByMonthForLoggedInUserStartups() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getPrincipal().equals("anonymousUser")) {
            throw new RuntimeException("Unauthorized: No user is logged in");
        }

        User loggedInUser = (User) authentication.getPrincipal(); // Get the logged-in user
        List<Object[]> results = viewsRepository.countViewsGroupedByMonthForUserOwnedStartups(loggedInUser.getId());

        Map<String, Long> viewsByMonth = new LinkedHashMap<>();
        String[] monthNames = {
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
        };

        for (Object[] result : results) {
            Integer month = (Integer) result[0];
            Long count = (Long) result[1];
            viewsByMonth.put(monthNames[month - 1], count);
        }

        return viewsByMonth;
    }
}