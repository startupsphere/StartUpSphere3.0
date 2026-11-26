package com.startupsphere.capstone.service;

import com.startupsphere.capstone.entity.Bookmarks;
import com.startupsphere.capstone.entity.User;
import com.startupsphere.capstone.repository.BookmarksRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class BookmarksService {

    private final BookmarksRepository bookmarksRepository;

    @Autowired
    public BookmarksService(BookmarksRepository bookmarksRepository) {
        this.bookmarksRepository = bookmarksRepository;
    }

    @CacheEvict(value = "bookmarks", allEntries = true)
    public Bookmarks createBookmark(Bookmarks bookmark) {
        return bookmarksRepository.save(bookmark);
    }

    @CacheEvict(value = "bookmarks", allEntries = true)
    public Bookmarks createOrGetBookmark(User user, com.startupsphere.capstone.entity.Startup startup, com.startupsphere.capstone.entity.Investor investor) {
        if (startup != null) {
            List<Bookmarks> existing = bookmarksRepository.findByUserAndStartup(user, startup);
            if (!existing.isEmpty()) {
                return existing.get(0);
            }
        } else if (investor != null) {
            List<Bookmarks> existing = bookmarksRepository.findByUserAndInvestor(user, investor);
            if (!existing.isEmpty()) {
                return existing.get(0);
            }
        }
        Bookmarks bookmark = new Bookmarks();
        bookmark.setUser(user);
        bookmark.setStartup(startup);
        bookmark.setInvestor(investor);
        return bookmarksRepository.save(bookmark);
    }

    public List<Bookmarks> getBookmarksByUser(User user) {
        List<Bookmarks> raw = bookmarksRepository.findByUser(user);
        Map<String, Bookmarks> uniqueMap = new LinkedHashMap<>();
        for (Bookmarks b : raw) {
            String key = null;
            if (b.getStartup() != null && b.getStartup().getId() != null) {
                key = "startup_" + b.getStartup().getId();
            } else if (b.getInvestor() != null && b.getInvestor().getInvestorId() != null) {
                key = "investor_" + b.getInvestor().getInvestorId();
            }
            if (key != null) {
                if (!uniqueMap.containsKey(key)) {
                    uniqueMap.put(key, b);
                }
            } else {
                uniqueMap.put("bookmark_" + b.getId(), b);
            }
        }
        return new java.util.ArrayList<>(uniqueMap.values());
    }

    @Cacheable(value = "bookmarks", key = "#pageable.pageNumber + '-' + #pageable.pageSize + '-' + #pageable.sort.toString()")
    public Page<Bookmarks> getAllBookmarks(Pageable pageable) {
        return bookmarksRepository.findAll(pageable);
    }

    public List<Bookmarks> getAllBookmarks() {
        return bookmarksRepository.findAll();
    }

    @Transactional
    @CacheEvict(value = "bookmarks", allEntries = true)
    public boolean deleteBookmark(Long id) {
        try {
            if (bookmarksRepository.existsById(id)) {
                System.out.println("Deleting bookmark with id: " + id);
                Bookmarks bookmark = bookmarksRepository.findById(id).orElse(null);
                if (bookmark != null) {
                    User u = bookmark.getUser();
                    com.startupsphere.capstone.entity.Startup s = bookmark.getStartup();
                    com.startupsphere.capstone.entity.Investor inv = bookmark.getInvestor();
                    if (u != null && s != null) {
                        List<Bookmarks> duplicates = bookmarksRepository.findByUserAndStartup(u, s);
                        for (Bookmarks dup : duplicates) {
                            if (dup.getUser() != null) dup.getUser().getBookmarks().remove(dup);
                            if (dup.getStartup() != null) dup.getStartup().getBookmarks().remove(dup);
                        }
                        bookmarksRepository.deleteAll(duplicates);
                    } else if (u != null && inv != null) {
                        List<Bookmarks> duplicates = bookmarksRepository.findByUserAndInvestor(u, inv);
                        for (Bookmarks dup : duplicates) {
                            if (dup.getUser() != null) dup.getUser().getBookmarks().remove(dup);
                            if (dup.getInvestor() != null) dup.getInvestor().getBookmarks().remove(dup);
                        }
                        bookmarksRepository.deleteAll(duplicates);
                    } else {
                        if (bookmark.getUser() != null) bookmark.getUser().getBookmarks().remove(bookmark);
                        if (bookmark.getStartup() != null) bookmark.getStartup().getBookmarks().remove(bookmark);
                        if (bookmark.getInvestor() != null) bookmark.getInvestor().getBookmarks().remove(bookmark);
                        bookmarksRepository.delete(bookmark);
                    }
                    return true;
                }
            }
            System.out.println("Bookmark with id " + id + " not found");
            return false;
        } catch (Exception e) {
            System.err.println("Error deleting bookmark: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    public long getBookmarkCountByStartupId(Long startupId) {
        return bookmarksRepository.countByStartup_Id(startupId);
    }

    public Map<String, Long> getBookmarksGroupedByMonthForStartup(Long startupId) {
        List<Object[]> results = bookmarksRepository.countBookmarksGroupedByMonthForStartup(startupId);
        Map<String, Long> bookmarksByMonth = new LinkedHashMap<>();

        String[] monthNames = {
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
        };

        for (Object[] result : results) {
            Integer month = (Integer) result[0];
            Long count = (Long) result[1];
            bookmarksByMonth.put(monthNames[month - 1], count);
        }

        return bookmarksByMonth;
    }

    public long getTotalBookmarksForLoggedInUserStartups() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            throw new RuntimeException("Unauthorized: No user is logged in");
        }

        User loggedInUser = (User) authentication.getPrincipal(); // Get the logged-in user
        return bookmarksRepository.countBookmarksByStartupOwner(loggedInUser.getId());
    }

    public Map<String, Long> getBookmarksGroupedByMonthForLoggedInUserStartups() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            throw new RuntimeException("Unauthorized: No user is logged in");
        }
    
        User loggedInUser = (User) authentication.getPrincipal(); // Get the logged-in user
        List<Object[]> results = bookmarksRepository.countBookmarksGroupedByMonthForUserOwnedStartups(loggedInUser.getId());
    
        Map<String, Long> bookmarksByMonth = new LinkedHashMap<>();
        String[] monthNames = {
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
        };
    
        for (Object[] result : results) {
            Integer month = (Integer) result[0];
            Long count = (Long) result[1];
            bookmarksByMonth.put(monthNames[month - 1], count);
        }
    
        return bookmarksByMonth;
    }
}
