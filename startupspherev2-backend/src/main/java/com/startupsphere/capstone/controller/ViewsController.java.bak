package com.startupsphere.capstone.controller;

import com.startupsphere.capstone.entity.Startup;
import com.startupsphere.capstone.entity.User;
import com.startupsphere.capstone.entity.Views;
import com.startupsphere.capstone.service.ViewsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/views")
public class ViewsController {

    private final ViewsService viewsService;

    @Autowired
    public ViewsController(ViewsService viewsService) {
        this.viewsService = viewsService;
    }

    // Create a view
    @PostMapping
    public ResponseEntity<?> createView(@RequestBody Startup startup) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(401).body("Unauthorized: No user is logged in");
        }

        User loggedInUser = (User) authentication.getPrincipal(); // Get the logged-in user

        try {
            Views savedView = viewsService.createView(loggedInUser, startup);
            return ResponseEntity.ok(savedView);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Get all views with pagination
    @GetMapping
    public ResponseEntity<Page<Views>> getAllViews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "timestamp") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Views> views = viewsService.getAllViews(pageable);
        return ResponseEntity.ok(views);
    }

    // Get a view by ID
    @GetMapping("/{id}")
    public ResponseEntity<Views> getViewById(@PathVariable Long id) {
        Optional<Views> view = viewsService.getViewById(id);
        return view.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Delete a view by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteView(@PathVariable Long id) {
        try {
            viewsService.deleteView(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/count-by-month/{startupId}")
    public ResponseEntity<Map<String, Long>> getViewCountsByMonth(@PathVariable Long startupId) {
        Map<String, Long> viewCountsByMonth = viewsService.getViewCountsByMonth(startupId);
        return ResponseEntity.ok(viewCountsByMonth);
    }

    @GetMapping("/count/logged-in-user-startups")
    public ResponseEntity<Long> getTotalViewsForLoggedInUserStartups() {
        try {
            long totalViews = viewsService.getTotalViewsForLoggedInUserStartups();
            return ResponseEntity.ok(totalViews);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(null);
        }
    }

    @GetMapping("/grouped-by-month/logged-in-user-startups")
    public ResponseEntity<Map<String, Long>> getViewsGroupedByMonthForLoggedInUserStartups() {
        try {
            Map<String, Long> viewsByMonth = viewsService.getViewsGroupedByMonthForLoggedInUserStartups();
            return ResponseEntity.ok(viewsByMonth);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(null); // Unauthorized
        }
    }
}