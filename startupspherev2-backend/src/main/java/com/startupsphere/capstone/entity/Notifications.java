package com.startupsphere.capstone.entity;

import java.time.LocalDateTime;
import java.util.Date;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "notifications", indexes = {
    @Index(name = "idx_notif_user", columnList = "user_id"),
    @Index(name = "idx_notif_startup", columnList = "startup_id"),
    @Index(name = "idx_notif_viewed", columnList = "isViewed"),
    @Index(name = "idx_notif_user_viewed", columnList = "user_id, isViewed")
})
public class Notifications {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "startup_id", nullable = false)
    private Startup startup;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = true)
    private User user;

    private String remarks;

    private boolean isViewed = false;
    private LocalDateTime viewedAt;
    private String comments;


    @CreationTimestamp
    @Column(updatable = false, name = "created_at")
    private Date createdAt;

    public Notifications(){}

    public Notifications(int id, String remarks, Startup startup, User user, boolean isViewed, LocalDateTime viewedAt, String comments, Date createdAt) {
        this.id = id;
        this.remarks = remarks;
        this.startup = startup;
        this.user = user;
        this.isViewed = isViewed;
        this.viewedAt = viewedAt;
        this.comments = comments;
        this.createdAt = createdAt;
    }

    public void setId(int id){
        this.id = id;
    }

    public int getId(){
        return id;
    }

    public void setRemarks(String remarks){
        this.remarks = remarks;
    }

    public String getRemarks(){
        return remarks;
    }

    public void setStartup(Startup startup){
        this.startup = startup;
    }

    public Startup getStartup(){
        return startup;
    }

    public void setUser(User user){
        this.user = user;
    }

    public User getUser(){
        return user;
    }

    public boolean isViewed(){
        return isViewed;
    }

    public void setViewed(boolean isViewed){
        this.isViewed = isViewed;
        if(isViewed){
            this.viewedAt = LocalDateTime.now();
        }
    }

    public LocalDateTime getViewedAt(){
        return viewedAt;
    }

    public void setComments(String comments){
        this.comments = comments;
    }

    public String getComments(){
        return comments;
    }

    public Date getCreatedAt(){
        return createdAt;
    }


}
