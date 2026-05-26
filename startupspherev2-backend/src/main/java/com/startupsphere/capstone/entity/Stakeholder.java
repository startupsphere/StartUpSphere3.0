package com.startupsphere.capstone.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "stakeholders")
@JsonIgnoreProperties({"startupStakeholders"})
public class Stakeholder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @OneToMany(mappedBy = "stakeholder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<StartupStakeholder> startupStakeholders;

        @JsonIgnore
        @OneToMany(mappedBy = "stakeholder", cascade = CascadeType.ALL, orphanRemoval = true)
        private List<Recents> recents = new ArrayList<>();
    private String phoneNumber;
    private String region;
    private String regionCode;

    private String provinceCode;
    private String province;
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

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime lastUpdated;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.lastUpdated = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.lastUpdated = LocalDateTime.now();
    }

    public Stakeholder(Long id, String name, String locationName,String barangayCode, String regionCode, String provinceCode,String province, String cityCode, String email, List<StartupStakeholder> startupStakeholders, String phoneNumber, String region, String city, String barangay, String street, String postalCode, String facebook, String linkedIn, Double locationLat, Double locationLng, LocalDateTime createdAt, LocalDateTime lastUpdated) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.startupStakeholders = startupStakeholders;
        this.phoneNumber = phoneNumber;
        this.region = region;
        this.city = city;
        this.barangay = barangay;
        this.street = street;
        this.postalCode = postalCode;
        this.facebook = facebook;
        this.linkedIn = linkedIn;
        this.locationLat = locationLat;
        this.locationLng = locationLng;
        this.createdAt = createdAt;
        this.lastUpdated = lastUpdated;
        this.locationName = locationName;
        this.barangayCode = barangayCode;
        this.regionCode = regionCode;
        this.provinceCode = provinceCode;
        this.cityCode = cityCode;
        this.province = province;


    }

    public Stakeholder() {
    }



    public String getRegionCode() {
        return regionCode;
    }

    public void setRegionCode(String regionCode) {
        this.regionCode = regionCode;
    }

    public String getProvinceCode() {
        return provinceCode;
    }

    public void setProvinceCode(String provinceCode) {
        this.provinceCode = provinceCode;
    }

    public String getProvince() {
        return province;
    }

    public void setProvince(String province) {
        this.province = province;
    }

    public String getCityCode() {
        return cityCode;
    }

    public void setCityCode(String cityCode) {
        this.cityCode = cityCode;
    }

    public String getBarangayCode() {
        return barangayCode;
    }

    public void setBarangayCode(String barangayCode) {
        this.barangayCode = barangayCode;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getLocationName() {
        return locationName;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
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

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getBarangay() {
        return barangay;
    }

    public void setBarangay(String barangay) {
        this.barangay = barangay;
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

    public List<StartupStakeholder> getStartupStakeholders() {
        return startupStakeholders;
    }

    public void setStartupStakeholders(List<StartupStakeholder> startupStakeholders) {
        this.startupStakeholders = startupStakeholders;
    }

}

