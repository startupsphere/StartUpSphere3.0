package com.startupsphere.capstone.dtos;

import com.startupsphere.capstone.entity.Stakeholder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class StakeholderDTO {
    private Long id;
    private String name;
    private String email;
    private String phoneNumber;
    private String region;
    private String regionCode;
    private String province;
    private String provinceCode;
    private String city;
    private String cityCode;
    private String barangay;
    private String barangayCode;
    private String street;
    private String postalCode;
    private String facebook;
    private String linkedIn;
    private Double locationLat;
    private Double locationLng;
    private String locationName;
    private LocalDateTime createdAt;
    private LocalDateTime lastUpdated;

    private List<StartupDTO> associatedStartups;

    // Constructors
    public StakeholderDTO() {}

    public StakeholderDTO(Stakeholder stakeholder) {
        this.id = stakeholder.getId();
        this.name = stakeholder.getName();
        this.email = stakeholder.getEmail();
        this.phoneNumber = stakeholder.getPhoneNumber();
        this.region = stakeholder.getRegion();
        this.regionCode = stakeholder.getRegionCode();
        this.province = stakeholder.getProvince();
        this.provinceCode = stakeholder.getProvinceCode();
        this.city = stakeholder.getCity();
        this.cityCode = stakeholder.getCityCode();
        this.barangay = stakeholder.getBarangay();
        this.barangayCode = stakeholder.getBarangayCode();
        this.street = stakeholder.getStreet();
        this.postalCode = stakeholder.getPostalCode();
        this.facebook = stakeholder.getFacebook();
        this.linkedIn = stakeholder.getLinkedIn();
        this.locationLat = stakeholder.getLocationLat();
        this.locationLng = stakeholder.getLocationLng();
        this.locationName = stakeholder.getLocationName();
        this.createdAt = stakeholder.getCreatedAt();
        this.lastUpdated = stakeholder.getLastUpdated();
        this.associatedStartups = stakeholder.getStartupStakeholders().stream()
                .map(ss -> new StartupDTO(ss.getStartup(), false)) // false to prevent infinite recursion
                .collect(Collectors.toList());
    }

    // Generate getters and setters for all fields

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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public String getRegionCode() {
        return regionCode;
    }

    public void setRegionCode(String regionCode) {
        this.regionCode = regionCode;
    }

    public String getProvince() {
        return province;
    }

    public void setProvince(String province) {
        this.province = province;
    }

    public String getProvinceCode() {
        return provinceCode;
    }

    public void setProvinceCode(String provinceCode) {
        this.provinceCode = provinceCode;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getCityCode() {
        return cityCode;
    }

    public void setCityCode(String cityCode) {
        this.cityCode = cityCode;
    }

    public String getBarangay() {
        return barangay;
    }

    public void setBarangay(String barangay) {
        this.barangay = barangay;
    }

    public String getBarangayCode() {
        return barangayCode;
    }

    public void setBarangayCode(String barangayCode) {
        this.barangayCode = barangayCode;
    }

    public String getStreet() {
        return street;
    }

    public void setStreet(String street) {
        this.street = street;
    }

    public String getPostalCode() {
        return postalCode;
    }

    public void setPostalCode(String postalCode) {
        this.postalCode = postalCode;
    }

    public String getFacebook() {
        return facebook;
    }

    public void setFacebook(String facebook) {
        this.facebook = facebook;
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

    public List<StartupDTO> getAssociatedStartups() {
        return associatedStartups;
    }

    public void setAssociatedStartups(List<StartupDTO> associatedStartups) {
        this.associatedStartups = associatedStartups;
    }
}