package com.startupsphere.capstone.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "investment_interests")
public class InvestmentInterest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "startup_id", nullable = false)
    @JsonIgnoreProperties({"user", "bookmarks", "likes"})
    private Startup startup;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "investor_user_id")
    @JsonIgnoreProperties({"password", "authorities"})
    private User investorUser;

    @Column(name = "investor_name")
    private String investorName;

    @Column(name = "investor_email")
    private String investorEmail;

    @Column(name = "investor_phone")
    private String investorPhone;

    @Column(name = "investor_type")
    private String investorType;

    @Column(name = "amount_range")
    private String amountRange;

    @Column(name = "process_type")
    private String processType;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "stage", nullable = false)
    private String stage = "NEW_INQUIRY"; // NEW_INQUIRY, INITIAL_REVIEW, PITCH_MEETING, DUE_DILIGENCE, TERM_SHEET, CLOSED_DEAL, PASSED

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "fund_disbursed")
    private Boolean fundDisbursed = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public InvestmentInterest() {}

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.stage == null || this.stage.isBlank()) {
            this.stage = "NEW_INQUIRY";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Startup getStartup() {
        return startup;
    }

    public void setStartup(Startup startup) {
        this.startup = startup;
    }

    public User getInvestorUser() {
        return investorUser;
    }

    public void setInvestorUser(User investorUser) {
        this.investorUser = investorUser;
    }

    public String getInvestorName() {
        return investorName;
    }

    public void setInvestorName(String investorName) {
        this.investorName = investorName;
    }

    public String getInvestorEmail() {
        return investorEmail;
    }

    public void setInvestorEmail(String investorEmail) {
        this.investorEmail = investorEmail;
    }

    public String getInvestorPhone() {
        return investorPhone;
    }

    public void setInvestorPhone(String investorPhone) {
        this.investorPhone = investorPhone;
    }

    public String getInvestorType() {
        return investorType;
    }

    public void setInvestorType(String investorType) {
        this.investorType = investorType;
    }

    public String getAmountRange() {
        return amountRange;
    }

    public void setAmountRange(String amountRange) {
        this.amountRange = amountRange;
    }

    public String getProcessType() {
        return processType;
    }

    public void setProcessType(String processType) {
        this.processType = processType;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getStage() {
        return stage;
    }

    public void setStage(String stage) {
        this.stage = stage;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Boolean getFundDisbursed() {
        return fundDisbursed;
    }

    public void setFundDisbursed(Boolean fundDisbursed) {
        this.fundDisbursed = fundDisbursed;
    }
}
