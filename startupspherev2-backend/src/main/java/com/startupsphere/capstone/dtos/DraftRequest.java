package com.startupsphere.capstone.dtos;

public record DraftRequest(
        String formData,      // JSON string of the whole form
        String selectedTab
) {}