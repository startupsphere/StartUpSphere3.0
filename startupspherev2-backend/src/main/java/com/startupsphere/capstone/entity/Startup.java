package com.startupsphere.capstone.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "startups", indexes = {
    @Index(name = "idx_user_id", columnList = "user_id"),
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_industry", columnList = "industry"),
    @Index(name = "idx_region", columnList = "region"),
    @Index(name = "idx_is_draft", columnList = "is_draft"),
    @Index(name = "idx_email_verified", columnList = "email_verified"),
    @Index(name = "idx_company_name", columnList = "companyName"),
    @Index(name = "idx_contact_email", columnList = "contactEmail"),
    @Index(name = "idx_last_updated", columnList = "last_updated"),
    @Index(name = "idx_created_at", columnList = "created_at"),
    @Index(name = "idx_user_draft", columnList = "user_id, is_draft")
})
@JsonIgnoreProperties({"startupStakeholders", "likes", "bookmarks", "views", "notifications"})
public class Startup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @JsonIgnore
    @OneToMany(mappedBy = "startup", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Like> likes = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "startup", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Bookmarks> bookmarks = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "startup", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Views> views = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "startup", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<StartupStakeholder> startupStakeholders = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "startup", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Notifications> notifications;

    @JsonIgnore
    @OneToMany(mappedBy = "startup", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Recents> recents = new ArrayList<>();

    @Column(name = "views_count", nullable = false)
    private Integer viewsCount = 0;

    private String companyName;
    
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String companyDescription;
    
    private String foundedDate;
    private String typeOfCompany;
    private String numberOfEmployees;
    private String phoneNumber;
    private String contactEmail;
    private String streetAddress;
    private String city;
    private String province;
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
    private String startupCode;
    private String status;

    private double revenue;
    private Double annualRevenue;
    private Double paidUpCapital;
    private String fundingStage;
    private String businessActivity;
    private String operatingHours;
    private int numberOfActiveStartups;
    private int numberOfNewStartupsThisYear;
    private double averageStartupGrowthRate;
    private double startupSurvivalRate;
    private double totalStartupFundingReceived;
    private double averageFundingPerStartup;
    private int numberOfFundingRounds;
    private int numberOfStartupsWithForeignInvestment;
    private double amountOfGovernmentGrantsOrSubsidiesReceived;
    private int numberOfStartupIncubatorsOrAccelerators;
    private int numberOfStartupsInIncubationPrograms;
    private int numberOfMentorsOrAdvisorsInvolved;
    private int publicPrivatePartnershipsInvolvingStartups;
    private String region;
    private String barangay;

    @Column(name = "verification_code")
    private String verificationCode;

    @Column(name = "email_verified", nullable = false)
    private Boolean emailVerified = false;

    @Lob
    @Column(name = "photo", columnDefinition = "LONGBLOB")
    private byte[] photo;

    @Column(name = "created_at", nullable = true, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "last_updated", nullable = true)
    private LocalDateTime lastUpdated;

    // Registration & Compliance fields
    @Column(name = "is_government_registered")
    private Boolean isGovernmentRegistered;

    @Column(name = "registration_agency")
    private String registrationAgency;

    @Column(name = "registration_number")
    private String registrationNumber;

    @Column(name = "registration_date")
    private String registrationDate;

    @Column(name = "other_registration_agency")
    private String otherRegistrationAgency;

    @Column(name = "business_license_number")
    private String businessLicenseNumber;

    @Column(name = "tin")
    private String tin;

    @Column(name = "is_draft", nullable = false)
    private Boolean isDraft = false;

    // Registration certificate as file (image, any extension)
    @Lob
    @Column(name = "registration_certificate", columnDefinition = "LONGBLOB")
    private byte[] registrationCertificate;

    public Startup() {
    }

    public Startup(Long id, User user, List<Like> likes, List<Bookmarks> bookmarks, Integer viewsCount,
            String companyName, String companyDescription, String foundedDate, String typeOfCompany,
            String numberOfEmployees, String phoneNumber, String contactEmail, String streetAddress,
            String city, String province, String postalCode, String industry, String website,
            String facebook, String twitter, String instagram, String linkedIn, Double locationLat,
            Double locationLng, String locationName, String startupCode, double revenue, Double annualRevenue,
            Double paidUpCapital, String fundingStage, String businessActivity, String operatingHours,
            int numberOfActiveStartups, int numberOfNewStartupsThisYear, double averageStartupGrowthRate,
            double startupSurvivalRate, double totalStartupFundingReceived, double averageFundingPerStartup,
            int numberOfFundingRounds, int numberOfStartupsWithForeignInvestment,
            double amountOfGovernmentGrantsOrSubsidiesReceived, int numberOfStartupIncubatorsOrAccelerators,
            int numberOfStartupsInIncubationPrograms, int numberOfMentorsOrAdvisorsInvolved,
            int publicPrivatePartnershipsInvolvingStartups, String verificationCode, Boolean emailVerified,
            String status, String region, String barangay, LocalDateTime createdAt, LocalDateTime lastUpdated) {
        this.id = id;
        this.user = user;
        this.likes = likes;
        this.bookmarks = bookmarks;
        this.viewsCount = viewsCount;
        this.companyName = companyName;
        this.companyDescription = companyDescription;
        this.foundedDate = foundedDate;
        this.typeOfCompany = typeOfCompany;
        this.numberOfEmployees = numberOfEmployees;
        this.phoneNumber = phoneNumber;
        this.contactEmail = contactEmail;
        this.streetAddress = streetAddress;
        this.city = city;
        this.province = province;
        this.postalCode = postalCode;
        this.industry = industry;
        this.website = website;
        this.facebook = facebook;
        this.twitter = twitter;
        this.instagram = instagram;
        this.linkedIn = linkedIn;
        this.locationLat = locationLat;
        this.locationLng = locationLng;
        this.locationName = locationName;
        this.startupCode = startupCode;
        this.revenue = revenue;
        this.annualRevenue = annualRevenue;
        this.paidUpCapital = paidUpCapital;
        this.fundingStage = fundingStage;
        this.businessActivity = businessActivity;
        this.operatingHours = operatingHours;
        this.numberOfActiveStartups = numberOfActiveStartups;
        this.numberOfNewStartupsThisYear = numberOfNewStartupsThisYear;
        this.averageStartupGrowthRate = averageStartupGrowthRate;
        this.startupSurvivalRate = startupSurvivalRate;
        this.totalStartupFundingReceived = totalStartupFundingReceived;
        this.averageFundingPerStartup = averageFundingPerStartup;
        this.numberOfFundingRounds = numberOfFundingRounds;
        this.numberOfStartupsWithForeignInvestment = numberOfStartupsWithForeignInvestment;
        this.amountOfGovernmentGrantsOrSubsidiesReceived = amountOfGovernmentGrantsOrSubsidiesReceived;
        this.numberOfStartupIncubatorsOrAccelerators = numberOfStartupIncubatorsOrAccelerators;
        this.numberOfStartupsInIncubationPrograms = numberOfStartupsInIncubationPrograms;
        this.numberOfMentorsOrAdvisorsInvolved = numberOfMentorsOrAdvisorsInvolved;
        this.publicPrivatePartnershipsInvolvingStartups = publicPrivatePartnershipsInvolvingStartups;
        this.verificationCode = verificationCode;
        this.emailVerified = emailVerified;
        this.status = status;
        this.region = region;
        this.barangay = barangay;
        this.createdAt = createdAt;
        this.lastUpdated = lastUpdated;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.lastUpdated = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.lastUpdated = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public byte[] getPhoto() {
        return photo;
    }

    public void setPhoto(byte[] photo) {
        this.photo = photo;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public List<Like> getLikes() {
        return likes;
    }

    public void setLikes(List<Like> likes) {
        this.likes = likes;
    }

    public List<Bookmarks> getBookmarks() {
        return bookmarks;
    }

    public void setBookmarks(List<Bookmarks> bookmarks) {
        this.bookmarks = bookmarks;
    }

    public Integer getViewsCount() {
        return (viewsCount == null) ? 0 : viewsCount;
    }

    public void setViewsCount(Integer viewsCount) {
        this.viewsCount = viewsCount;
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

    public void setCity(String city) {
        this.city = city;
    }

    public String getProvince() {
        return province;
    }

    public void setProvince(String province) {
        this.province = province;
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

    public String getStartupCode() {
        return startupCode;
    }

    public void setStartupCode(String startupCode) {
        this.startupCode = startupCode;
    }

    public double getRevenue() {
        return revenue;
    }

    public void setRevenue(double revenue) {
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

    public String getBusinessActivity() {
        return businessActivity;
    }

    public void setBusinessActivity(String businessActivity) {
        this.businessActivity = businessActivity;
    }

    public String getOperatingHours() {
        return operatingHours;
    }

    public void setOperatingHours(String operatingHours) {
        this.operatingHours = operatingHours;
    }

    public int getNumberOfActiveStartups() {
        return numberOfActiveStartups;
    }

    public void setNumberOfActiveStartups(int numberOfActiveStartups) {
        this.numberOfActiveStartups = numberOfActiveStartups;
    }

    public int getNumberOfNewStartupsThisYear() {
        return numberOfNewStartupsThisYear;
    }

    public void setNumberOfNewStartupsThisYear(int numberOfNewStartupsThisYear) {
        this.numberOfNewStartupsThisYear = numberOfNewStartupsThisYear;
    }

    public double getAverageStartupGrowthRate() {
        return averageStartupGrowthRate;
    }

    public void setAverageStartupGrowthRate(double averageStartupGrowthRate) {
        this.averageStartupGrowthRate = averageStartupGrowthRate;
    }

    public double getStartupSurvivalRate() {
        return startupSurvivalRate;
    }

    public void setStartupSurvivalRate(double startupSurvivalRate) {
        this.startupSurvivalRate = startupSurvivalRate;
    }

    public double getTotalStartupFundingReceived() {
        return totalStartupFundingReceived;
    }

    public void setTotalStartupFundingReceived(double totalStartupFundingReceived) {
        this.totalStartupFundingReceived = totalStartupFundingReceived;
    }

    public double getAverageFundingPerStartup() {
        return averageFundingPerStartup;
    }

    public void setAverageFundingPerStartup(double averageFundingPerStartup) {
        this.averageFundingPerStartup = averageFundingPerStartup;
    }

    public int getNumberOfFundingRounds() {
        return numberOfFundingRounds;
    }

    public void setNumberOfFundingRounds(int numberOfFundingRounds) {
        this.numberOfFundingRounds = numberOfFundingRounds;
    }

    public int getNumberOfStartupsWithForeignInvestment() {
        return numberOfStartupsWithForeignInvestment;
    }

    public void setNumberOfStartupsWithForeignInvestment(int numberOfStartupsWithForeignInvestment) {
        this.numberOfStartupsWithForeignInvestment = numberOfStartupsWithForeignInvestment;
    }

    public double getAmountOfGovernmentGrantsOrSubsidiesReceived() {
        return amountOfGovernmentGrantsOrSubsidiesReceived;
    }

    public void setAmountOfGovernmentGrantsOrSubsidiesReceived(double amountOfGovernmentGrantsOrSubsidiesReceived) {
        this.amountOfGovernmentGrantsOrSubsidiesReceived = amountOfGovernmentGrantsOrSubsidiesReceived;
    }

    public int getNumberOfStartupIncubatorsOrAccelerators() {
        return numberOfStartupIncubatorsOrAccelerators;
    }

    public void setNumberOfStartupIncubatorsOrAccelerators(int numberOfStartupIncubatorsOrAccelerators) {
        this.numberOfStartupIncubatorsOrAccelerators = numberOfStartupIncubatorsOrAccelerators;
    }

    public int getNumberOfStartupsInIncubationPrograms() {
        return numberOfStartupsInIncubationPrograms;
    }

    public void setNumberOfStartupsInIncubationPrograms(int numberOfStartupsInIncubationPrograms) {
        this.numberOfStartupsInIncubationPrograms = numberOfStartupsInIncubationPrograms;
    }

    public int getNumberOfMentorsOrAdvisorsInvolved() {
        return numberOfMentorsOrAdvisorsInvolved;
    }

    public void setNumberOfMentorsOrAdvisorsInvolved(int numberOfMentorsOrAdvisorsInvolved) {
        this.numberOfMentorsOrAdvisorsInvolved = numberOfMentorsOrAdvisorsInvolved;
    }

    public int getPublicPrivatePartnershipsInvolvingStartups() {
        return publicPrivatePartnershipsInvolvingStartups;
    }

    public void setPublicPrivatePartnershipsInvolvingStartups(int publicPrivatePartnershipsInvolvingStartups) {
        this.publicPrivatePartnershipsInvolvingStartups = publicPrivatePartnershipsInvolvingStartups;
    }

    public String getVerificationCode() {
        return verificationCode;
    }

    public void setVerificationCode(String verificationCode) {
        this.verificationCode = verificationCode;
    }

    public Boolean getEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(Boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public List<Views> getViews() {
        return views;
    }

    public void setViews(List<Views> views) {
        this.views = views;
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

    public Boolean getIsGovernmentRegistered() {
        return isGovernmentRegistered;
    }

    public void setIsGovernmentRegistered(Boolean isGovernmentRegistered) {
        this.isGovernmentRegistered = isGovernmentRegistered;
    }

    public String getRegistrationAgency() {
        return registrationAgency;
    }

    public void setRegistrationAgency(String registrationAgency) {
        this.registrationAgency = registrationAgency;
    }

    public String getRegistrationNumber() {
        return registrationNumber;
    }

    public void setRegistrationNumber(String registrationNumber) {
        this.registrationNumber = registrationNumber;
    }

    public String getRegistrationDate() {
        return registrationDate;
    }

    public void setRegistrationDate(String registrationDate) {
        this.registrationDate = registrationDate;
    }

    public String getOtherRegistrationAgency() {
        return otherRegistrationAgency;
    }

    public void setOtherRegistrationAgency(String otherRegistrationAgency) {
        this.otherRegistrationAgency = otherRegistrationAgency;
    }

    public String getBusinessLicenseNumber() {
        return businessLicenseNumber;
    }

    public void setBusinessLicenseNumber(String businessLicenseNumber) {
        this.businessLicenseNumber = businessLicenseNumber;
    }

    public String getTin() {
        return tin;
    }

    public void setTin(String tin) {
        this.tin = tin;
    }

    public byte[] getRegistrationCertificate() {
        return registrationCertificate;
    }

    public void setRegistrationCertificate(byte[] registrationCertificate) {
        this.registrationCertificate = registrationCertificate;
    }

    public Boolean getIsDraft() {
        return isDraft;
    }

    public void setIsDraft(Boolean isDraft) {
        this.isDraft = isDraft;
    }

    public List<StartupStakeholder> getStartupStakeholders() {
        return startupStakeholders;
    }

    public void setStartupStakeholders(List<StartupStakeholder> startupStakeholders) {
        this.startupStakeholders = startupStakeholders;
    }

    public List<Recents> getRecents() {
        return recents;
    }

    public void setRecents(List<Recents> recents) {
        this.recents = recents;
    }
}