package com.startupsphere.capstone.dtos;

import com.startupsphere.capstone.entity.Startup;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class StartupDTO {
    private Long id;
    private String companyName;
    private String companyDescription;
    private String foundedDate;
    private String typeOfCompany;
    private String numberOfEmployees;
    private String phoneNumber;
    private String contactEmail;
    private String streetAddress;
    private String city;
    private String province;
    private String region;
    private String barangay;
    private String postalCode;
    private String industry;
    private String website;
    private String facebook;
    private String twitter;
    private String instagram;
    private String linkedIn;
    private Double locationLat;
    private Double locationLng;
    private String locationName;
    private String status;
    private Double revenue;
    private Double annualRevenue;
    private Double paidUpCapital;
    private String fundingStage;
    private Integer viewsCount;
    private Boolean emailVerified;
    private Boolean isDraft;
    private LocalDateTime createdAt;
    private LocalDateTime lastUpdated;

    private List<StakeholderDTO> associatedStakeholders;

    // Constructors, getters, and setters
    public StartupDTO() {}

    public StartupDTO(Startup startup) {
        this(startup, true);
    }

    public StartupDTO(Startup startup, boolean includeStakeholders) {
        this.id = startup.getId();
        this.companyName = startup.getCompanyName();
        this.companyDescription = startup.getCompanyDescription();
        this.foundedDate = startup.getFoundedDate();
        this.typeOfCompany = startup.getTypeOfCompany();
        this.numberOfEmployees = startup.getNumberOfEmployees();
        this.phoneNumber = startup.getPhoneNumber();
        this.contactEmail = startup.getContactEmail();
        this.streetAddress = startup.getStreetAddress();
        this.city = startup.getCity();
        this.province = startup.getProvince();
        this.region = startup.getRegion();
        this.barangay = startup.getBarangay();
        this.postalCode = startup.getPostalCode();
        this.industry = startup.getIndustry();
        this.website = startup.getWebsite();
        this.facebook = startup.getFacebook();
        this.twitter = startup.getTwitter();
        this.instagram = startup.getInstagram();
        this.linkedIn = startup.getLinkedIn();
        this.locationLat = startup.getLocationLat();
        this.locationLng = startup.getLocationLng();
        this.locationName = startup.getLocationName();
        this.status = startup.getStatus();
        this.revenue = startup.getRevenue();
        this.annualRevenue = startup.getAnnualRevenue();
        this.paidUpCapital = startup.getPaidUpCapital();
        this.fundingStage = startup.getFundingStage();
        this.viewsCount = startup.getViewsCount();
        this.emailVerified = startup.getEmailVerified();
        this.isDraft = startup.getIsDraft();
        this.createdAt = startup.getCreatedAt();
        this.lastUpdated = startup.getLastUpdated();
        if (includeStakeholders) {
            this.associatedStakeholders = startup.getStartupStakeholders().stream()
                    .map(ss -> new StakeholderDTO(ss.getStakeholder()))
                    .collect(Collectors.toList());
        }
    }

    // Generate getters and setters for all fields

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getCompanyDescription() {
        return companyDescription;
    }

    public void setCompanyDescription(String companyDescription) {
        this.companyDescription = companyDescription;
    }

    public String getFoundedDate() {
        return foundedDate;
    }

    public void setFoundedDate(String foundedDate) {
        this.foundedDate = foundedDate;
    }

    public String getTypeOfCompany() {
        return typeOfCompany;
    }

    public void setTypeOfCompany(String typeOfCompany) {
        this.typeOfCompany = typeOfCompany;
    }

    public String getNumberOfEmployees() {
        return numberOfEmployees;
    }

    public void setNumberOfEmployees(String numberOfEmployees) {
        this.numberOfEmployees = numberOfEmployees;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getStreetAddress() {
        return streetAddress;
    }

    public void setStreetAddress(String streetAddress) {
        this.streetAddress = streetAddress;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getProvince() {
        return province;
    }

    public void setProvince(String province) {
        this.province = province;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public String getBarangay() {
        return barangay;
    }

    public void setBarangay(String barangay) {
        this.barangay = barangay;
    }

    public String getPostalCode() {
        return postalCode;
    }

    public void setPostalCode(String postalCode) {
        this.postalCode = postalCode;
    }

    public String getIndustry() {
        return industry;
    }

    public void setIndustry(String industry) {
        this.industry = industry;
    }

    public String getWebsite() {
        return website;
    }

    public void setWebsite(String website) {
        this.website = website;
    }

    public String getFacebook() {
        return facebook;
    }

    public void setFacebook(String facebook) {
        this.facebook = facebook;
    }

    public String getTwitter() {
        return twitter;
    }

    public void setTwitter(String twitter) {
        this.twitter = twitter;
    }

    public String getInstagram() {
        return instagram;
    }

    public void setInstagram(String instagram) {
        this.instagram = instagram;
    }

    public String getLinkedIn() {
        return linkedIn;
    }

    public void setLinkedIn(String linkedIn) {
        this.linkedIn = linkedIn;
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

    public String getLocationName() {
        return locationName;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Double getRevenue() {
        return revenue;
    }

    public void setRevenue(Double revenue) {
        this.revenue = revenue;
    }

    public Double getAnnualRevenue() {
        return annualRevenue;
    }

    public void setAnnualRevenue(Double annualRevenue) {
        this.annualRevenue = annualRevenue;
    }

    public Double getPaidUpCapital() {
        return paidUpCapital;
    }

    public void setPaidUpCapital(Double paidUpCapital) {
        this.paidUpCapital = paidUpCapital;
    }

    public String getFundingStage() {
        return fundingStage;
    }

    public void setFundingStage(String fundingStage) {
        this.fundingStage = fundingStage;
    }

    public Integer getViewsCount() {
        return viewsCount;
    }

    public void setViewsCount(Integer viewsCount) {
        this.viewsCount = viewsCount;
    }

    public Boolean getEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(Boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }

    public List<StakeholderDTO> getAssociatedStakeholders() {
        return associatedStakeholders;
    }

    public void setAssociatedStakeholders(List<StakeholderDTO> associatedStakeholders) {
        this.associatedStakeholders = associatedStakeholders;
    }

    public Boolean getIsDraft() {
        return isDraft;
    }

    public void setIsDraft(Boolean isDraft) {
        this.isDraft = isDraft;
    }
}