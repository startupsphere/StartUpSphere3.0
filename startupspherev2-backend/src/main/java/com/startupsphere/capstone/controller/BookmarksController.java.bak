package com.startupsphere.capstone.controller;

import com.startupsphere.capstone.dtos.BookmarksRequest;
import com.startupsphere.capstone.entity.Bookmarks;
import com.startupsphere.capstone.entity.Investor;
import com.startupsphere.capstone.entity.Startup;
import com.startupsphere.capstone.entity.User;
import com.startupsphere.capstone.repository.InvestorRepository;
import com.startupsphere.capstone.repository.StartupRepository;
import com.startupsphere.capstone.repository.UserRepository;
import com.startupsphere.capstone.service.BookmarksService;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookmarks")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = { RequestMethod.GET, RequestMethod.POST,
        RequestMethod.DELETE, RequestMethod.OPTIONS })
public class BookmarksController {

    private final BookmarksService bookmarksService;
    private final UserRepository userRepository;
    private final StartupRepository startupRepository;
    private final InvestorRepository investorRepository;

    @Autowired
    public BookmarksController(BookmarksService bookmarksService,
            UserRepository userRepository,
            StartupRepository startupRepository,
            InvestorRepository investorRepository) {
        this.bookmarksService = bookmarksService;
        this.userRepository = userRepository;
        this.startupRepository = startupRepository;
        this.investorRepository = investorRepository;
    }

    @PostMapping
    public ResponseEntity<Bookmarks> createBookmark(@RequestBody BookmarksRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

        Startup startup = null;
        Investor investor = null;

        // Only look up startup if ID is provided
        if (request.getStartupId() != null) {
            startup = startupRepository.findById(request.getStartupId())
                    .orElseThrow(() -> new RuntimeException("Startup not found"));
        }

        // Only look up investor if ID is provided
        if (request.getInvestorId() != null) {
            investor = investorRepository.findById(request.getInvestorId())
                    .orElseThrow(() -> new RuntimeException("Investor not found"));
        }

        // Ensure at least one of startup or investor is present
        if (startup == null && investor == null) {
            return ResponseEntity.badRequest().build(); // Bad Request if neither is provided
        }

        // Create and save the bookmark
        Bookmarks bookmark = new Bookmarks();
        bookmark.setUser(user);
        bookmark.setStartup(startup);
        bookmark.setInvestor(investor); // Can be null if no investor is provided

        Bookmarks savedBookmark = bookmarksService.createBookmark(bookmark);
        return ResponseEntity.ok(savedBookmark); // Return the created bookmark
    }

    @GetMapping
    public ResponseEntity<List<Bookmarks>> getUserBookmarks() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

        List<Bookmarks> userBookmarks = bookmarksService.getBookmarksByUser(user);
        return ResponseEntity.ok(userBookmarks);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> deleteBookmark(@PathVariable Long id) {
        boolean isDeleted = bookmarksService.deleteBookmark(id);
        if (isDeleted) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/count/startup/{startupId}")
    public ResponseEntity<Long> getBookmarkCountByStartupId(@PathVariable Long startupId) {
        long count = bookmarksService.getBookmarkCountByStartupId(startupId);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/grouped-by-month/startup/{startupId}")
    public ResponseEntity<Map<String, Long>> getBookmarksGroupedByMonthForStartup(@PathVariable Long startupId) {
        Map<String, Long> bookmarksByMonth = bookmarksService.getBookmarksGroupedByMonthForStartup(startupId);
        return ResponseEntity.ok(bookmarksByMonth);
    }

    @GetMapping("/count/logged-in-user-startups")
    public ResponseEntity<Long> getTotalBookmarksForLoggedInUserStartups() {
        try {
            long totalBookmarks = bookmarksService.getTotalBookmarksForLoggedInUserStartups();
            return ResponseEntity.ok(totalBookmarks);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(null); // Unauthorized
        }
    }

    @GetMapping("/grouped-by-month/logged-in-user-startups")
    public ResponseEntity<Map<String, Long>> getBookmarksGroupedByMonthForLoggedInUserStartups() {
        try {
            Map<String, Long> bookmarksByMonth = bookmarksService.getBookmarksGroupedByMonthForLoggedInUserStartups();
            return ResponseEntity.ok(bookmarksByMonth);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(null); // Unauthorized
        }
    }
}