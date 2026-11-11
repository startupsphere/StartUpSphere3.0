package com.startupsphere.capstone.dtos;

public class StartupEngagementDTO {
    private Long id;
    private String name;
    private Double locationLat;
    private Double locationLng;
    private String facebook;
    private int facebookLikes;
    private long startupSphereLikes;
    private long totalLikes;
    private int views;
    private long bookmarks;
    private long engagementScore;
    private String heatmapColor;
    private String heatmapColorHex;

    public StartupEngagementDTO() {
    }

    public StartupEngagementDTO(Long id, String name, Double locationLat, Double locationLng,
                                int facebookLikes, long startupSphereLikes, int views, long bookmarks) {
        this(id, name, locationLat, locationLng, null, facebookLikes, startupSphereLikes, views, bookmarks);
    }

    public StartupEngagementDTO(Long id, String name, Double locationLat, Double locationLng,
                                String facebook, int facebookLikes, long startupSphereLikes, int views, long bookmarks) {
        this.id = id;
        this.name = name != null ? name : "Startup";
        this.locationLat = locationLat;
        this.locationLng = locationLng;
        boolean hasFbLink = facebook != null && !facebook.trim().isEmpty();
        this.facebook = hasFbLink ? facebook.trim() : null;
        // Facebook likes must only be included if the business provides a facebook link
        this.facebookLikes = hasFbLink ? facebookLikes : 0;
        this.startupSphereLikes = startupSphereLikes;
        this.totalLikes = (long) this.facebookLikes + startupSphereLikes;
        this.views = views;
        this.bookmarks = bookmarks;
        this.engagementScore = this.totalLikes + this.views + this.bookmarks;

        updateColorClassification();
    }

    private void updateColorClassification() {
        // Color classification based on exact Engagement Summary Score requirements:
        // 0: Blue
        // 1-10: Cyan
        // 11-20: Yellow
        // 21-30: Orange
        // 31+: Red
        if (this.engagementScore == 0) {
            this.heatmapColor = "Blue";
            this.heatmapColorHex = "#2563eb";
        } else if (this.engagementScore <= 10) {
            this.heatmapColor = "Cyan";
            this.heatmapColorHex = "#06b6d4";
        } else if (this.engagementScore <= 20) {
            this.heatmapColor = "Yellow";
            this.heatmapColorHex = "#eab308";
        } else if (this.engagementScore <= 30) {
            this.heatmapColor = "Orange";
            this.heatmapColorHex = "#f97316";
        } else {
            this.heatmapColor = "Red";
            this.heatmapColorHex = "#ef4444";
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Double getLocationLat() {
        return locationLat;
    }

    public void setLocationLat(Double locationLat) {
        this.locationLat = locationLat;
    }

    public Double getLocationLng() {
        return locationLng;
    }

    public void setLocationLng(Double locationLng) {
        this.locationLng = locationLng;
    }

    public String getFacebook() {
        return facebook;
    }

    public void setFacebook(String facebook) {
        boolean hasFbLink = facebook != null && !facebook.trim().isEmpty();
        this.facebook = hasFbLink ? facebook.trim() : null;
        if (!hasFbLink) {
            this.facebookLikes = 0;
        }
        recalculate();
    }

    public int getFacebookLikes() {
        return facebookLikes;
    }

    public void setFacebookLikes(int facebookLikes) {
        boolean hasFbLink = this.facebook != null && !this.facebook.trim().isEmpty();
        this.facebookLikes = hasFbLink ? facebookLikes : 0;
        recalculate();
    }

    public long getStartupSphereLikes() {
        return startupSphereLikes;
    }

    public void setStartupSphereLikes(long startupSphereLikes) {
        this.startupSphereLikes = startupSphereLikes;
        recalculate();
    }

    public long getTotalLikes() {
        return totalLikes;
    }

    public void setTotalLikes(long totalLikes) {
        this.totalLikes = totalLikes;
    }

    public int getViews() {
        return views;
    }

    public void setViews(int views) {
        this.views = views;
        recalculate();
    }

    public long getBookmarks() {
        return bookmarks;
    }

    public void setBookmarks(long bookmarks) {
        this.bookmarks = bookmarks;
        recalculate();
    }

    public long getEngagementScore() {
        return engagementScore;
    }

    public void setEngagementScore(long engagementScore) {
        this.engagementScore = engagementScore;
    }

    public String getHeatmapColor() {
        return heatmapColor;
    }

    public void setHeatmapColor(String heatmapColor) {
        this.heatmapColor = heatmapColor;
    }

    public String getHeatmapColorHex() {
        return heatmapColorHex;
    }

    public void setHeatmapColorHex(String heatmapColorHex) {
        this.heatmapColorHex = heatmapColorHex;
    }

    private void recalculate() {
        boolean hasFbLink = this.facebook != null && !this.facebook.trim().isEmpty();
        if (!hasFbLink) {
            this.facebookLikes = 0;
        }
        this.totalLikes = (long) this.facebookLikes + this.startupSphereLikes;
        this.engagementScore = this.totalLikes + this.views + this.bookmarks;
        updateColorClassification();
    }
}

