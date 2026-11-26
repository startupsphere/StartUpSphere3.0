package com.startupsphere.capstone.dtos;

public class InvestmentApplicationRequest {
    private Long startupId;
    private String applicantName;
    private String applicantEmail;
    private String applicantPhone;
    private String fundingStage;
    private String requestedAmount;
    private String equityOrTerms;
    private String pitchMessage;

    public InvestmentApplicationRequest() {
    }

    public Long getStartupId() {
        return startupId;
    }

    public void setStartupId(Long startupId) {
        this.startupId = startupId;
    }

    public String getApplicantName() {
        return applicantName;
    }

    public void setApplicantName(String applicantName) {
        this.applicantName = applicantName;
    }

    public String getApplicantEmail() {
        return applicantEmail;
    }

    public void setApplicantEmail(String applicantEmail) {
        this.applicantEmail = applicantEmail;
    }

    public String getApplicantPhone() {
        return applicantPhone;
    }

    public void setApplicantPhone(String applicantPhone) {
        this.applicantPhone = applicantPhone;
    }

    public String getFundingStage() {
        return fundingStage;
    }

    public void setFundingStage(String fundingStage) {
        this.fundingStage = fundingStage;
    }

    public String getRequestedAmount() {
        return requestedAmount;
    }

    public void setRequestedAmount(String requestedAmount) {
        this.requestedAmount = requestedAmount;
    }

    public String getEquityOrTerms() {
        return equityOrTerms;
    }

    public void setEquityOrTerms(String equityOrTerms) {
        this.equityOrTerms = equityOrTerms;
    }

    public String getPitchMessage() {
        return pitchMessage;
    }

    public void setPitchMessage(String pitchMessage) {
        this.pitchMessage = pitchMessage;
    }
}
