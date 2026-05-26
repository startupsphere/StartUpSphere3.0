package com.startupsphere.capstone.dtos;

import com.startupsphere.capstone.entity.Stakeholder;

import java.time.LocalDateTime;

public class StakeholderInfoDTO {
    private Stakeholder stakeholder;
    private String role;
    private String status;
    private LocalDateTime dateJoined;

    private boolean isConnected;

    private Long id;

    public StakeholderInfoDTO(Stakeholder stakeholder, Long id, String role, String status, LocalDateTime dateJoined) {
        this.stakeholder = stakeholder;
        this.role = role;
        this.status = status;
        this.dateJoined = dateJoined;
        this.id = id;

    }

    public StakeholderInfoDTO(Long id, Stakeholder stakeholder, String role, String status, LocalDateTime dateJoined,boolean isConnected) {
        this.id = id;
        this.stakeholder = stakeholder;
        this.role = role;
        this.status = status;
        this.dateJoined = dateJoined;
        this.isConnected = isConnected;
    }

    public Stakeholder getStakeholder() {
        return stakeholder;
    }

    public Long getId() {
        return id;
    }

    public boolean isConnected() {
        return isConnected;
    }

    public void setConnected(boolean isConnected) {
        this.isConnected = isConnected;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setStakeholder(Stakeholder stakeholder) {
        this.stakeholder = stakeholder;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getDateJoined() {
        return dateJoined;
    }

    public void setDateJoined(LocalDateTime dateJoined) {
        this.dateJoined = dateJoined;
    }
}