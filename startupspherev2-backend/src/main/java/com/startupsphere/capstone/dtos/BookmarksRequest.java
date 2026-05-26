package com.startupsphere.capstone.dtos;

public class BookmarksRequest {
    private Long startupId;
    private Integer investorId;

    // Getters and Setters
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
}