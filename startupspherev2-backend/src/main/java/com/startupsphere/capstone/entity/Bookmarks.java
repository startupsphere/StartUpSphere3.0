package com.startupsphere.capstone.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "bookmarks", indexes = {
    @Index(name = "idx_bookmark_user", columnList = "users"),
    @Index(name = "idx_bookmark_startup", columnList = "startupId"),
    @Index(name = "idx_bookmark_investor", columnList = "investorId")
})
public class Bookmarks {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Instant timestamp = Instant.now();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "users", nullable = true)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "startupId", nullable = true)
    private Startup startup;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "investorId", nullable = true)
    private Investor investor;

    public Bookmarks() {
        // Default constructor
    }

    public Bookmarks(User user, Startup startup, Investor investor) {
        this.user = user;
        this.startup = startup;
        this.investor = investor;
        this.timestamp = Instant.now();
    }

    // --- Getters and Setters ---

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Startup getStartup() {
        return startup;
    }

    public void setStartup(Startup startup) {
        this.startup = startup;
    }

    public Investor getInvestor() {
        return investor;
    }

    public void setInvestor(Investor investor) {
        this.investor = investor;
    }
}
