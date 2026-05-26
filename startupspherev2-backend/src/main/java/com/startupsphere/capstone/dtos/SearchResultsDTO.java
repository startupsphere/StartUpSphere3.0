package com.startupsphere.capstone.dtos;

import java.util.List;

public class SearchResultsDTO {
    private List<StartupDTO> startups;
    private List<StakeholderDTO> stakeholders;

    public SearchResultsDTO(List<StartupDTO> startups, List<StakeholderDTO> stakeholders) {
        this.startups = startups;
        this.stakeholders = stakeholders;
    }

    // Getters and setters
    public List<StartupDTO> getStartups() {
        return startups;
    }

    public void setStartups(List<StartupDTO> startups) {
        this.startups = startups;
    }

    public List<StakeholderDTO> getStakeholders() {
        return stakeholders;
    }

    public void setStakeholders(List<StakeholderDTO> stakeholders) {
        this.stakeholders = stakeholders;
    }
}