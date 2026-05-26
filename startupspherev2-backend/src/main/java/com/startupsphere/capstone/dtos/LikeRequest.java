package com.startupsphere.capstone.dtos;

import java.time.Instant;

public class LikeRequest {
    private Long id;
    private Instant timestamp;
    private Integer userId;
    private Long startupId;
    private Integer investorId;

    public LikeRequest(Long id, Instant timestamp, Integer userId, Long startupId, Integer investorId) {
        this.id = id;
        this.timestamp = timestamp;
        this.userId = userId;
        this.startupId = startupId;
        this.investorId = investorId;
    }

    public LikeRequest() {
    }

    public Long getId() {
        return id;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public Long getStartupId() {
        return startupId;
    }

    public void setStartupId(Long startupId) {
        this.startupId = startupId;
    }

    public Integer getInvestorId() {
        return investorId;
    }

    public void setInvestorId(Integer investorId) {
        this.investorId = investorId;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    // Custom validation method
    public void validate() {
        if (userId == null) {
            throw new IllegalArgumentException("User ID must not be null");
        }
        if (startupId == null && investorId == null) {
            throw new IllegalArgumentException("Either startupId or investorId must be provided");
        }
    }
}