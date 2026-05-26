package com.startupsphere.capstone.dtos;

public class NotificationRequest {
    private String remarks;
    private Long startupId;
    private Integer userId;

    private String comments;

    public String getRemarks(){
        return remarks;
    }

    public void setRemarks(String remarks){
        this.remarks = remarks;
    }

    public Long getStartupId(){
        return startupId;
    }

    public void setStartupId(Long startupId){
        this.startupId = startupId;
    }

    public Integer getUserId(){
        return userId;
    }

    public void setUserId(Integer userId){
        this.userId = userId;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }
}
