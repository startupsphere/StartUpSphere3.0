package com.startupsphere.capstone.entity;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity
@Table(name = "views", indexes = {
    @Index(name = "idx_view_user", columnList = "user_id"),
    @Index(name = "idx_view_startup", columnList = "startup_id")
})
public class Views {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    private Instant timestamp = Instant.now();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = true)
    @JsonIgnoreProperties({"startups", "likes", "bookmarks", "views", "notifications", "recents", "password", "authorities"})
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "startup_id", nullable = true)
    @JsonIgnoreProperties({"user", "likes", "bookmarks", "views"})
    private Startup startup;

    public Views() {
    }

    // Parameterized constructor
    public Views(User user, Startup startup, Instant timestamp) {
        this.user = user;
        this.startup = startup;
        this.timestamp = timestamp;
    }

    // Getters and Setters
    public long getId() {
        return id;
    }

    public void setId(long id) {
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
}