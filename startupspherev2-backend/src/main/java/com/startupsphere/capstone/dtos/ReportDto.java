package com.startupsphere.capstone.dtos;

import java.time.LocalDateTime;

public class ReportDto {
    private String name;
    private String content;
    private LocalDateTime timestamp;

    public ReportDto() {
    }

    public ReportDto(String name, String content, LocalDateTime timestamp) {
        this.name = name;
        this.content = content;
        this.timestamp = timestamp;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
