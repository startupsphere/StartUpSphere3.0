package com.startupsphere.capstone.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "recents")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Recents {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "startup_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Startup startup;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stakeholder_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Stakeholder stakeholder;

    private LocalDateTime viewedAt;

    public Recents() {}

    public Recents(User user, Startup startup, Stakeholder stakeholder, LocalDateTime viewedAt) {
        this.user = user;
        this.startup = startup;
        this.stakeholder = stakeholder;
        this.viewedAt = viewedAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Startup getStartup() { return startup; }
    public void setStartup(Startup startup) { this.startup = startup; }

    public Stakeholder getStakeholder() { return stakeholder; }
    public void setStakeholder(Stakeholder stakeholder) { this.stakeholder = stakeholder; }

    public LocalDateTime getViewedAt() { return viewedAt; }
    public void setViewedAt(LocalDateTime viewedAt) { this.viewedAt = viewedAt; }
}
