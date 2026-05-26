package com.startupsphere.capstone.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Table(name = "investors")
@Entity
public class Investor {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "investorId", nullable = false)
    private Integer investorId;

    @JsonIgnore
    @OneToMany(mappedBy = "investor", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<Bookmarks> bookmarks = new ArrayList<>();

    @Column(nullable = false)
    private String firstname;

    @Column(nullable = false)
    private String lastname;

    @Column(nullable = false)
    private String emailAddress;

    @Column(nullable = false)
    private String contactInformation;

    @Column(nullable = false)
    private boolean isDeleted;

    @Column(nullable = false)
    private String gender;

    @Column(nullable = false)
    private String website;

    @Column(nullable = false)
    private String facebook;

    @Column(nullable = false)
    private String twitter;

    @Column(nullable = false)
    private String instagram;

    @Column(nullable = false)
    private String linkedin;

    @Column(nullable = false)
    private String biography;

    @Column(nullable = false)
    private String locationLat;

    @Column(nullable = false)
    private String locationLang;

    @Column(nullable = false)
    private String locationName;

    @Column(nullable = false)
    private int views;

    /*
     * @ManyToOne
     * 
     * @JoinColumn(name = "likes", nullable = false)
     * private Like likes;
     * 
     * @ManyToOne
     * 
     * @JoinColumn(name = "bookmarks", nullable = false)
     * private Bookmark bookmarks;
     * 
     * @ManyToOne
     * 
     * @JoinColumn(name = "views", nullable = false)
     * private View views;
     */

    @ManyToOne
    @JoinColumn(name = "users", nullable = false)
    private User user_id;

    public Investor() {
    }

    /*
     * public Investor(String firstname, String lastname, String emailAddress,
     * String contactInformation, boolean isDeleted, String gender, String website,
     * String facebook, String twitter, String instagram, String linkedin,
     * String biography, String locationLat, String locationLang, String
     * locationName,
     * Like likes, Bookmark bookmarks, View views, User user_id) {
     * this.firstname = firstname;
     * this.lastname = lastname;
     * this.emailAddress = emailAddress;
     * this.contactInformation = contactInformation;
     * this.isDeleted = isDeleted;
     * this.gender = gender;
     * this.website = website;
     * this.facebook = facebook;
     * this.twitter = twitter;
     * this.instagram = instagram;
     * this.linkedin = linkedin;
     * this.biography = biography;
     * this.locationLat = locationLat;
     * this.locationLang = locationLang;
     * this.locationName = locationName;
     * this.likes = likes;
     * this.bookmarks = bookmarks;
     * this.views = views;
     * this.user_id = user_id;
     * }
     */

    public List<Bookmarks> getBookmarks() {
        return bookmarks;
    }

    public void setBookmarks(List<Bookmarks> bookmarks) {
        this.bookmarks = bookmarks;
    }

    public Integer getInvestorId() {
        return investorId;
    }

    public void setInvestorId(Integer investorId) {
        this.investorId = investorId;
    }

    public String getFirstname() {
        return firstname;
    }

    public void setFirstname(String firstname) {
        this.firstname = firstname;
    }

    public String getLastname() {
        return lastname;
    }

    public void setLastname(String lastname) {
        this.lastname = lastname;
    }

    public String getEmailAddress() {
        return emailAddress;
    }

    public void setEmailAddress(String emailAddress) {
        this.emailAddress = emailAddress;
    }

    public String getContactInformation() {
        return contactInformation;
    }

    public void setContactInformation(String contactInformation) {
        this.contactInformation = contactInformation;
    }

    public boolean isDeleted() {
        return isDeleted;
    }

    public void setDeleted(boolean deleted) {
        isDeleted = deleted;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
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

    public String getLinkedin() {
        return linkedin;
    }

    public void setLinkedin(String linkedin) {
        this.linkedin = linkedin;
    }

    public String getBiography() {
        return biography;
    }

    public void setBiography(String biography) {
        this.biography = biography;
    }

    public String getLocationLat() {
        return locationLat;
    }

    public void setLocationLat(String locationLat) {
        this.locationLat = locationLat;
    }

    public String getLocationLang() {
        return locationLang;
    }

    public void setLocationLang(String locationLang) {
        this.locationLang = locationLang;
    }

    public String getLocationName() {
        return locationName;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
    }

    /*
     * public Like getLikes() {
     * return likes;
     * }
     * 
     * public void setLikes(Like likes) {
     * this.likes = likes;
     * }
     * 
     * public Bookmark getBookmarks() {
     * return bookmarks;
     * }
     * 
     * public void setBookmarks(Bookmark bookmarks) {
     * this.bookmarks = bookmarks;
     * }
     * 
     * public View getViews() {
     * return views;
     * }
     * 
     * public void setViews(View views) {
     * this.views = views;
     * }
     */

    public User getUserId() {
        return user_id;
    }

    public void setUserId(User user_id) {
        this.user_id = user_id;
    }

    public int getViews() {
        return views;
    }
    
    public void setViews(int views) {
        this.views = views;
    }

}