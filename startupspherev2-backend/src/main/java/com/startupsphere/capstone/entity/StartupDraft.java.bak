package com.startupsphere.capstone.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "startup_draft")
public class StartupDraft {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "draft_data", columnDefinition = "TEXT")
    private String draftData;

    // Constructors
    public StartupDraft() {}

    public StartupDraft(Integer userId, String draftData) {
        this.userId = userId;
        this.draftData = draftData;
    }

    // Getters & Setters
    public Long getId() { 
        return id; 
    }
    
    public void setId(Long id) { 
        this.id = id; 
    }

    public Integer getUserId() {
         return userId; 
        }
    public void setUserId(Integer userId) {
         this.userId = userId; 
        }

    public String getDraftData() {
         return draftData; 
        }
    public void setDraftData(String draftData) {
         this.draftData = draftData; 
        }
}