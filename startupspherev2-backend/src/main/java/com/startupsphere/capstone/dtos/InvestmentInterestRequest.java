package com.startupsphere.capstone.dtos;

public class InvestmentInterestRequest {
    private String investorName;
    private String investorEmail;
    private String investorPhone;
    private String investorType;
    private String amountRange;
    private String processType;
    private String message;

    public InvestmentInterestRequest() {}

    public InvestmentInterestRequest(String investorName, String investorEmail, String investorPhone,
                                     String investorType, String amountRange, String processType, String message) {
        this.investorName = investorName;
        this.investorEmail = investorEmail;
        this.investorPhone = investorPhone;
        this.investorType = investorType;
        this.amountRange = amountRange;
        this.processType = processType;
        this.message = message;
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
}
