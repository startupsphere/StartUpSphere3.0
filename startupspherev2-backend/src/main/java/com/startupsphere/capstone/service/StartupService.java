package com.startupsphere.capstone.service;

import java.io.IOException;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

import com.startupsphere.capstone.dtos.StartupEngagementDTO;

import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.startupsphere.capstone.entity.Startup;
import com.startupsphere.capstone.entity.User;
import com.startupsphere.capstone.repository.BookmarksRepository;
import com.startupsphere.capstone.repository.LikeRepository;
import com.startupsphere.capstone.repository.StartupRepository;
import com.startupsphere.capstone.repository.ViewsRepository;

@Service
public class StartupService {

    private static final Logger logger = LoggerFactory.getLogger(StartupService.class);
    
    private final StartupRepository startupRepository;
    private final ViewsRepository viewsRepository;
    private final LikeRepository likeRepository;
    private final BookmarksRepository bookmarksRepository;
    private final EntityManager entityManager;
    private final EmailService emailService;

    @Autowired
    private com.startupsphere.capstone.repository.InvestmentInterestRepository investmentInterestRepository;

    public StartupService(
            StartupRepository startupRepository,
            ViewsRepository viewsRepository,
            LikeRepository likeRepository,
            BookmarksRepository bookmarksRepository,
            EntityManager entityManager,
            EmailService emailService) {
        this.startupRepository = startupRepository;
        this.viewsRepository = viewsRepository;
        this.likeRepository = likeRepository;
        this.bookmarksRepository = bookmarksRepository;
        this.entityManager = entityManager;
        this.emailService = emailService;
    }

    @Transactional
    @CacheEvict(value = {"startups", "submittedStartups", "filteredStartups"}, allEntries = true)
    public Startup createStartup(Startup startup) {
        logger.info("Saving startup: {}", startup.getCompanyName());

        startup.setStatus("In Review");
        startup.setIsDraft(false);
        startup.setTotalStartupFundingReceived(0.0);
        startup.setNumberOfFundingRounds(0);
        startup.setAverageFundingPerStartup(0.0);
        return startupRepository.save(startup);
    }

    @Transactional
    public Startup saveDraft(Startup startup) {
        logger.info("Saving draft: {}", startup.getCompanyName());

        startup.setIsDraft(true);
        startup.setStatus("Draft");
        startup.setEmailVerified(false);
        return startupRepository.save(startup);
    }

    @Transactional
    @CacheEvict(value = {"startups", "startupById", "approvedStartups", "submittedStartups", "emailVerifiedStartups", "searchStartups", "filteredStartups"}, allEntries = true)
    public Startup submitDraft(Long draftId, Integer userId) {
        logger.info("Submitting draft with ID: {}", draftId);
        
        Startup draft = startupRepository.findById(draftId)
                .orElseThrow(() -> new RuntimeException("Draft not found with id: " + draftId));
        
        // Verify the draft belongs to the user
        if (!draft.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized: Draft does not belong to user");
        }
        
        // Verify it's actually a draft
        if (!draft.getIsDraft()) {
            throw new RuntimeException("Startup is not a draft");
        }
        
        draft.setIsDraft(false);
        draft.setStatus("In Review");
        return startupRepository.save(draft);
    }

    @Cacheable(value = "startups", key = "#pageable.pageNumber + '-' + #pageable.pageSize + '-' + #pageable.sort.toString()")
    public Page<Startup> getAllStartups(Pageable pageable) {
        return startupRepository.findAll(pageable);
    }

    public List<Startup> getAllStartups() {
        return startupRepository.findAll();
    }

    @org.springframework.context.event.EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
    @Transactional
    public void syncAllStartupsExternalFundingOnStartup() {
        try {
            List<Startup> all = startupRepository.findAll();
            for (Startup s : all) {
                double actual = calculateActualExternalFunding(s.getId());
                int rounds = countClosedDeals(s.getId());
                Double current = s.getTotalStartupFundingReceived();
                Integer curRounds = s.getNumberOfFundingRounds();
                if (current == null || Math.abs(current - actual) > 0.001 || curRounds == null || curRounds != rounds) {
                    s.setTotalStartupFundingReceived(actual);
                    s.setNumberOfFundingRounds(rounds);
                    s.setAverageFundingPerStartup(rounds > 0 ? actual / rounds : 0.0);
                    startupRepository.save(s);
                }
            }
            logger.info("Universal startup funding sync completed: all businesses aligned to verified deal flow.");
        } catch (Exception e) {
            logger.warn("Non-fatal startup funding sync error on boot: {}", e.getMessage());
        }
    }

    @Cacheable(value = "startupById", key = "#id")
    public Optional<Startup> getStartupById(Long id) {
        return startupRepository.findById(id).map(s -> {
            s.setTotalStartupFundingReceived(calculateActualExternalFunding(s.getId()));
            s.setNumberOfFundingRounds(countClosedDeals(s.getId()));
            return s;
        });
    }

    @Transactional
    @CacheEvict(value = {"startups", "startupById", "approvedStartups", "submittedStartups", "emailVerifiedStartups", "searchStartups", "filteredStartups"}, allEntries = true)
    public Startup updateStartup(Long id, Startup updatedStartup) {
        return startupRepository.findById(id)
                .map(startup -> {
                    if ("Rejected".equalsIgnoreCase(startup.getStatus())) {
                        throw new IllegalStateException("Rejected businesses cannot be edited. They can only be deleted.");
                    }
                    updatedStartup.setId(startup.getId());
                    updatedStartup.setUser(startup.getUser());
                    updatedStartup.setLikes(startup.getLikes());
                    updatedStartup.setBookmarks(startup.getBookmarks());
                    updatedStartup.setViews(startup.getViews());

                    startup.setCompanyName(updatedStartup.getCompanyName());
                    startup.setCompanyDescription(updatedStartup.getCompanyDescription());
                    startup.setFoundedDate(updatedStartup.getFoundedDate());
                    startup.setTypeOfCompany(updatedStartup.getTypeOfCompany());
                    startup.setNumberOfEmployees(updatedStartup.getNumberOfEmployees());
                    startup.setPhoneNumber(updatedStartup.getPhoneNumber());
                    startup.setContactEmail(updatedStartup.getContactEmail());
                    startup.setStreetAddress(updatedStartup.getStreetAddress());
                    startup.setCity(updatedStartup.getCity());
                    if (updatedStartup.getStatus() != null && !updatedStartup.getStatus().trim().isEmpty()) {
                        startup.setStatus(updatedStartup.getStatus());
                    }
                    startup.setProvince(updatedStartup.getProvince());
                    startup.setPostalCode(updatedStartup.getPostalCode());
                    startup.setIndustry(updatedStartup.getIndustry());
                    startup.setWebsite(updatedStartup.getWebsite());
                    startup.setFacebook(updatedStartup.getFacebook());
                    startup.setTwitter(updatedStartup.getTwitter());
                    startup.setInstagram(updatedStartup.getInstagram());
                    startup.setLinkedIn(updatedStartup.getLinkedIn());
                    startup.setLocationLat(updatedStartup.getLocationLat());
                    startup.setLocationLng(updatedStartup.getLocationLng());
                    startup.setLocationName(updatedStartup.getLocationName());
                    startup.setStartupCode(updatedStartup.getStartupCode());
                    startup.setRevenue(updatedStartup.getRevenue());
                    startup.setAnnualRevenue(updatedStartup.getAnnualRevenue());
                    if (startup.getPaidUpCapital() == null || startup.getPaidUpCapital() <= 0) {
                        if (updatedStartup.getPaidUpCapital() != null && updatedStartup.getPaidUpCapital() > 0) {
                            startup.setPaidUpCapital(updatedStartup.getPaidUpCapital());
                        }
                    }
                    startup.setFundingStage(updatedStartup.getFundingStage());
                    startup.setBusinessActivity(updatedStartup.getBusinessActivity());
                    startup.setOperatingHours(updatedStartup.getOperatingHours());
                    startup.setNumberOfActiveStartups(updatedStartup.getNumberOfActiveStartups());
                    startup.setNumberOfNewStartupsThisYear(updatedStartup.getNumberOfNewStartupsThisYear());
                    startup.setAverageStartupGrowthRate(updatedStartup.getAverageStartupGrowthRate());
                    startup.setStartupSurvivalRate(updatedStartup.getStartupSurvivalRate());
                    double verifiedFunding = calculateActualExternalFunding(startup.getId());
                    startup.setTotalStartupFundingReceived(verifiedFunding);
                    int verifiedRounds = countClosedDeals(startup.getId());
                    startup.setNumberOfFundingRounds(verifiedRounds);
                    startup.setAverageFundingPerStartup(verifiedRounds > 0 ? verifiedFunding / verifiedRounds : 0.0);
                    startup.setRegion(updatedStartup.getRegion());
                    startup.setBarangay(updatedStartup.getBarangay());
                    startup.setNumberOfStartupsWithForeignInvestment(
                            updatedStartup.getNumberOfStartupsWithForeignInvestment());
                    startup.setAmountOfGovernmentGrantsOrSubsidiesReceived(
                            updatedStartup.getAmountOfGovernmentGrantsOrSubsidiesReceived());
                    startup.setNumberOfStartupIncubatorsOrAccelerators(
                            updatedStartup.getNumberOfStartupIncubatorsOrAccelerators());
                    startup.setNumberOfStartupsInIncubationPrograms(
                            updatedStartup.getNumberOfStartupsInIncubationPrograms());
                    startup.setNumberOfMentorsOrAdvisorsInvolved(updatedStartup.getNumberOfMentorsOrAdvisorsInvolved());
                    startup.setPublicPrivatePartnershipsInvolvingStartups(
                            updatedStartup.getPublicPrivatePartnershipsInvolvingStartups());
                    if (updatedStartup.getVerificationCode() != null) {
                        startup.setVerificationCode(updatedStartup.getVerificationCode());
                    }
                    if (updatedStartup.getVerificationCodeExpiresAt() != null) {
                        startup.setVerificationCodeExpiresAt(updatedStartup.getVerificationCodeExpiresAt());
                    }
                    if (Boolean.TRUE.equals(updatedStartup.getEmailVerified())) {
                        startup.setEmailVerified(true);
                    }
                    startup.setTrlLevel(updatedStartup.getTrlLevel());
                    startup.setVerifiedCredentials(updatedStartup.getVerifiedCredentials());
                    startup.setHasSupports(updatedStartup.getHasSupports());
                    startup.setSupportProvider(updatedStartup.getSupportProvider());
                    startup.setSupportProgram(updatedStartup.getSupportProgram());

                    // Social metrics
                    if (updatedStartup.getFacebookFollowers() != null) {
                        startup.setFacebookFollowers(updatedStartup.getFacebookFollowers());
                    }
                    if (updatedStartup.getFacebookLikes() != null) {
                        startup.setFacebookLikes(updatedStartup.getFacebookLikes());
                    }
                    if (updatedStartup.getInstagramFollowers() != null) {
                        startup.setInstagramFollowers(updatedStartup.getInstagramFollowers());
                    }

                    // Registration & Compliance fields
                    startup.setIsGovernmentRegistered(updatedStartup.getIsGovernmentRegistered());
                    startup.setRegistrationAgency(updatedStartup.getRegistrationAgency());
                    startup.setRegistrationNumber(updatedStartup.getRegistrationNumber());
                    startup.setRegistrationDate(updatedStartup.getRegistrationDate());
                    startup.setOtherRegistrationAgency(updatedStartup.getOtherRegistrationAgency());
                    startup.setBusinessLicenseNumber(updatedStartup.getBusinessLicenseNumber());
                    startup.setTin(updatedStartup.getTin());

                    if (updatedStartup.getIsDraft() != null) {
                        startup.setIsDraft(updatedStartup.getIsDraft());
                    }

                    if (updatedStartup.getPhoto() != null) {
                        startup.setPhoto(updatedStartup.getPhoto());
                    }
                    if (updatedStartup.getRegistrationCertificate() != null) {
                        startup.setRegistrationCertificate(updatedStartup.getRegistrationCertificate());
                    }

                    return startupRepository.save(startup);
                })
                .orElseThrow(() -> new RuntimeException("Startup not found with id: " + id));
    }

    @Transactional
    public void deleteStartup(Long id) {
        logger.info("Attempting to delete startup with id: {}", id);

        try {
            // First verify the startup exists
            if (!startupRepository.existsById(id)) {
                throw new RuntimeException("Startup not found with id: " + id);
            }

            // Delete related entities first using bulk operations to avoid cascade issues
            // This approach bypasses the entity relationships and directly deletes from DB
            viewsRepository.deleteByStartupId(id);
            likeRepository.deleteByStartupId(id);
            bookmarksRepository.deleteByStartupId(id);

            // Force flush to ensure all related entities are deleted
            startupRepository.flush();

            // Now safely delete the startup
            startupRepository.deleteById(id);

            logger.info("Successfully deleted startup with id: {}", id);

        } catch (Exception e) {
            logger.error("Error deleting startup with id: {}. Error: {}", id, e.getMessage(), e);
            throw new RuntimeException("Failed to delete startup with id: " + id + ". Error: " + e.getMessage());
        }
    }

    // Alternative Option 2: Manual deletion with proper repository methods
    @Transactional
    public void deleteStartupManual(Long id) {
        logger.info("Attempting to delete startup with id: {}", id);

        try {
            Startup startup = startupRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Startup not found with id: " + id));

            // Delete related entities using repository methods (bulk operations)
            viewsRepository.deleteByStartup(startup);
            likeRepository.deleteByStartup(startup);
            bookmarksRepository.deleteByStartup(startup);

            // Now delete the startup
            startupRepository.delete(startup);

            logger.info("Successfully deleted startup with id: {}", id);

        } catch (Exception e) {
            logger.error("Error deleting startup with id: {}. Error: {}", id, e.getMessage(), e);
            throw new RuntimeException("Failed to delete startup with id: " + id + ". Error: " + e.getMessage());
        }
    }

    // Option 3: Using JPQL bulk delete (most efficient for large datasets)
    @Transactional
    public void deleteStartupBulk(Long id) {
        logger.info("Attempting to delete startup with id: {}", id);

        try {
            // Verify startup exists
            if (!startupRepository.existsById(id)) {
                throw new RuntimeException("Startup not found with id: " + id);
            }

            // Delete related entities using bulk operations
            viewsRepository.deleteByStartupId(id);
            likeRepository.deleteByStartupId(id);
            bookmarksRepository.deleteByStartupId(id);

            // Delete the startup
            startupRepository.deleteById(id);

            logger.info("Successfully deleted startup with id: {}", id);

        } catch (Exception e) {
            logger.error("Error deleting startup with id: {}. Error: {}", id, e.getMessage(), e);
            throw new RuntimeException("Failed to delete startup with id: " + id + ". Error: " + e.getMessage());
        }
    }

    public Page<Startup> searchStartups(String query, Pageable pageable) {
        return startupRepository.searchAllFields(query, pageable);
    }

    public List<Startup> searchStartups(String query) {
        return startupRepository.searchAllFields(query);
    }

    public List<Long> getStartupIdsByLoggedInUser(Authentication authentication) {
        List<Startup> startups = getStartupsByLoggedInUser(authentication);
        return startups.stream().map(Startup::getId).toList();
    }

    public Page<Startup> getAllSubmittedStartups(Pageable pageable) {
        logger.info("Fetching paginated submitted startups (non-drafts only)");
        return startupRepository.findByStatusAndIsDraftFalse("In Review", pageable);
    }

    public List<Startup> getAllSubmittedStartups() {
        logger.info("Fetching all submitted startups (non-drafts only)");
        return startupRepository.findByStatusAndIsDraftFalse("In Review");
    }

    public List<Startup> getStartupsByLoggedInUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getPrincipal().equals("anonymousUser")) {
            throw new RuntimeException("User not authenticated");
        }
        User loggedInUser = (User) authentication.getPrincipal();
        Integer userId = loggedInUser.getId();
        String email = loggedInUser.getEmail();

        List<Startup> list;
        boolean isAdmin = loggedInUser.getRole() != null && 
                ("ROLE_ADMIN".equalsIgnoreCase(loggedInUser.getRole()) || "ADMIN".equalsIgnoreCase(loggedInUser.getRole()));
        
        if (isAdmin) {
            list = startupRepository.findAll();
        } else {
            list = startupRepository.findByUserIdOrContactEmail(userId, email != null ? email.trim() : "");
        }

        for (Startup s : list) {
            s.setTotalStartupFundingReceived(calculateActualExternalFunding(s.getId()));
            s.setNumberOfFundingRounds(countClosedDeals(s.getId()));
        }
        return list;
    }

    public List<Startup> getDraftsByLoggedInUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getPrincipal().equals("anonymousUser")) {
            throw new RuntimeException("User not authenticated");
        }
        User loggedInUser = (User) authentication.getPrincipal();
        logger.info("Fetching drafts for user ID: {}", loggedInUser.getId());
        return startupRepository.findByUser_IdAndIsDraftTrue(loggedInUser.getId());
    }

    public Startup getDraftById(Long id, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getPrincipal().equals("anonymousUser")) {
            throw new RuntimeException("User not authenticated");
        }
        User loggedInUser = (User) authentication.getPrincipal();
        
        Startup startup = startupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Draft not found with id: " + id));
        
        // Verify it's a draft
        if (!startup.getIsDraft()) {
            throw new RuntimeException("Startup with id " + id + " is not a draft");
        }
        
        // Verify it belongs to the logged-in user
        if (!startup.getUser().getId().equals(loggedInUser.getId())) {
            throw new RuntimeException("Unauthorized: Draft does not belong to user");
        }
        
        logger.info("Fetched draft with ID: {} for user ID: {}", id, loggedInUser.getId());
        return startup;
    }

    @Transactional
    public Startup updateDraft(Long id, Startup updatedDraft, Integer userId) {
        logger.info("Updating draft with ID: {}", id);
        
        Startup existingDraft = startupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Draft not found with id: " + id));
        
        // Verify the draft belongs to the user
        if (!existingDraft.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized: Draft does not belong to user");
        }
        
        // Verify it's actually a draft
        if (!existingDraft.getIsDraft()) {
            throw new RuntimeException("Startup with id " + id + " is not a draft");
        }
        
        // Update all fields while maintaining draft status
        existingDraft.setCompanyName(updatedDraft.getCompanyName());
        existingDraft.setCompanyDescription(updatedDraft.getCompanyDescription());
        existingDraft.setFoundedDate(updatedDraft.getFoundedDate());
        existingDraft.setTypeOfCompany(updatedDraft.getTypeOfCompany());
        existingDraft.setNumberOfEmployees(updatedDraft.getNumberOfEmployees());
        existingDraft.setPhoneNumber(updatedDraft.getPhoneNumber());
        existingDraft.setContactEmail(updatedDraft.getContactEmail());
        existingDraft.setStreetAddress(updatedDraft.getStreetAddress());
        existingDraft.setCity(updatedDraft.getCity());
        existingDraft.setProvince(updatedDraft.getProvince());
        existingDraft.setRegion(updatedDraft.getRegion());
        existingDraft.setBarangay(updatedDraft.getBarangay());
        existingDraft.setPostalCode(updatedDraft.getPostalCode());
        existingDraft.setIndustry(updatedDraft.getIndustry());
        existingDraft.setWebsite(updatedDraft.getWebsite());
        existingDraft.setFacebook(updatedDraft.getFacebook());
        existingDraft.setTwitter(updatedDraft.getTwitter());
        existingDraft.setInstagram(updatedDraft.getInstagram());
        existingDraft.setLinkedIn(updatedDraft.getLinkedIn());
        if (updatedDraft.getFacebookFollowers() != null) {
            existingDraft.setFacebookFollowers(updatedDraft.getFacebookFollowers());
        }
        if (updatedDraft.getFacebookLikes() != null) {
            existingDraft.setFacebookLikes(updatedDraft.getFacebookLikes());
        }
        if (updatedDraft.getInstagramFollowers() != null) {
            existingDraft.setInstagramFollowers(updatedDraft.getInstagramFollowers());
        }
        existingDraft.setLocationLat(updatedDraft.getLocationLat());
        existingDraft.setLocationLng(updatedDraft.getLocationLng());
        existingDraft.setLocationName(updatedDraft.getLocationName());
        existingDraft.setStartupCode(updatedDraft.getStartupCode());
        existingDraft.setRevenue(updatedDraft.getRevenue());
        existingDraft.setAnnualRevenue(updatedDraft.getAnnualRevenue());
        existingDraft.setPaidUpCapital(updatedDraft.getPaidUpCapital());
        existingDraft.setFundingStage(updatedDraft.getFundingStage());
        existingDraft.setBusinessActivity(updatedDraft.getBusinessActivity());
        existingDraft.setOperatingHours(updatedDraft.getOperatingHours());
        existingDraft.setNumberOfActiveStartups(updatedDraft.getNumberOfActiveStartups());
        existingDraft.setNumberOfNewStartupsThisYear(updatedDraft.getNumberOfNewStartupsThisYear());
        existingDraft.setAverageStartupGrowthRate(updatedDraft.getAverageStartupGrowthRate());
        existingDraft.setStartupSurvivalRate(updatedDraft.getStartupSurvivalRate());
        existingDraft.setTotalStartupFundingReceived(updatedDraft.getTotalStartupFundingReceived());
        existingDraft.setAverageFundingPerStartup(updatedDraft.getAverageFundingPerStartup());
        existingDraft.setNumberOfFundingRounds(updatedDraft.getNumberOfFundingRounds());
        existingDraft.setNumberOfStartupsWithForeignInvestment(updatedDraft.getNumberOfStartupsWithForeignInvestment());
        existingDraft.setAmountOfGovernmentGrantsOrSubsidiesReceived(updatedDraft.getAmountOfGovernmentGrantsOrSubsidiesReceived());
        existingDraft.setNumberOfStartupIncubatorsOrAccelerators(updatedDraft.getNumberOfStartupIncubatorsOrAccelerators());
        existingDraft.setNumberOfStartupsInIncubationPrograms(updatedDraft.getNumberOfStartupsInIncubationPrograms());
        existingDraft.setNumberOfMentorsOrAdvisorsInvolved(updatedDraft.getNumberOfMentorsOrAdvisorsInvolved());
        existingDraft.setPublicPrivatePartnershipsInvolvingStartups(updatedDraft.getPublicPrivatePartnershipsInvolvingStartups());
        existingDraft.setIsGovernmentRegistered(updatedDraft.getIsGovernmentRegistered());
        existingDraft.setRegistrationAgency(updatedDraft.getRegistrationAgency());
        existingDraft.setRegistrationNumber(updatedDraft.getRegistrationNumber());
        existingDraft.setRegistrationDate(updatedDraft.getRegistrationDate());
        existingDraft.setOtherRegistrationAgency(updatedDraft.getOtherRegistrationAgency());
        existingDraft.setBusinessLicenseNumber(updatedDraft.getBusinessLicenseNumber());
        existingDraft.setTin(updatedDraft.getTin());
        existingDraft.setTrlLevel(updatedDraft.getTrlLevel());
        existingDraft.setVerifiedCredentials(updatedDraft.getVerifiedCredentials());
        existingDraft.setHasSupports(updatedDraft.getHasSupports());
        existingDraft.setSupportProvider(updatedDraft.getSupportProvider());
        existingDraft.setSupportProgram(updatedDraft.getSupportProgram());
        
        // Keep draft status and draft flag
        existingDraft.setIsDraft(true);
        existingDraft.setStatus("Draft");
        
        Startup saved = startupRepository.save(existingDraft);
        logger.info("Successfully updated draft with ID: {}", id);
        return saved;
    }

    @Transactional
    public void deleteDraft(Long id, Integer userId) {
        logger.info("Deleting draft with ID: {}", id);
        
        Startup draft = startupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Draft not found with id: " + id));
        
        // Verify the draft belongs to the user
        if (!draft.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized: Draft does not belong to user");
        }
        
        // Verify it's actually a draft
        if (!draft.getIsDraft()) {
            throw new RuntimeException("Startup with id " + id + " is not a draft. Cannot delete non-draft startups through this endpoint.");
        }
        
        startupRepository.delete(draft);
        logger.info("Successfully deleted draft with ID: {}", id);
    }

    public void sendVerificationEmail(Long startupId, String email) {
        logger.info("Attempting to send verification email for startup ID: {} to email: {}", startupId, email);

        Startup startup = startupRepository.findById(startupId)
                .orElseThrow(() -> {
                    logger.error("Startup not found with id: {}", startupId);
                    return new RuntimeException("Startup not found with id: " + startupId);
                });

        String recipientEmail = (email != null && !email.isBlank()) ? email.trim() : startup.getContactEmail();
        if (recipientEmail == null || recipientEmail.isBlank()) {
            throw new RuntimeException("No email address provided for verification.");
        }

        // Generate a secure 6-digit verification code using SecureRandom
        SecureRandom secureRandom = new SecureRandom();
        String verificationCode = String.format("%06d", 100000 + secureRandom.nextInt(900000));
        startup.setVerificationCode(verificationCode);
        startup.setVerificationCodeExpiresAt(LocalDateTime.now().plusMinutes(10));
        startup.setEmailVerified(false);
        startupRepository.save(startup);

        emailService.sendOtpVerificationEmail(recipientEmail, startup.getCompanyName(), verificationCode);
    }

    @Transactional
    public void verifyEmail(Long startupId, String email, String code) {
        Startup startup = startupRepository.findById(startupId)
                .orElseThrow(() -> new RuntimeException("Startup not found with id: " + startupId));

        if (code == null || code.trim().length() < 4) {
            throw new RuntimeException("Please enter a valid verification code (at least 4 digits).");
        }

        String sanitizedCode = code.trim().replace(" ", "").replace("-", "");
        if (startup.getVerificationCode() == null || !startup.getVerificationCode().trim().equals(sanitizedCode)) {
            throw new RuntimeException("Invalid verification code. Please check your email and try again.");
        }

        if (startup.getVerificationCodeExpiresAt() != null && LocalDateTime.now().isAfter(startup.getVerificationCodeExpiresAt())) {
            throw new RuntimeException("Verification code has expired. Please click 'Resend Code' to receive a new one.");
        }

        startup.setEmailVerified(true);
        startup.setVerificationCode(null);
        startup.setVerificationCodeExpiresAt(null);
        startupRepository.save(startup);
        logger.info("Email verified successfully for startup ID: {}", startupId);
    }

    public Page<Startup> getAllEmailVerifiedStartups(Pageable pageable) {
        return startupRepository.findAllVerifiedEmailStartups(pageable);
    }

    public List<Startup> getAllEmailVerifiedStartups() {
        return startupRepository.findAllVerifiedEmailStartups();
    }

    @Transactional
    @CacheEvict(value = {"startups", "startupById", "approvedStartups", "submittedStartups", "emailVerifiedStartups", "searchStartups", "filteredStartups"}, allEntries = true)
    public Startup approveStartup(Long id) {
        Startup startup = startupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Startup not found with id: " + id));

        startup.setStatus("Approved");
        return startupRepository.save(startup);
    }

    @Transactional
    @CacheEvict(value = {"startups", "startupById", "approvedStartups", "submittedStartups", "emailVerifiedStartups", "searchStartups", "filteredStartups"}, allEntries = true)
    public Startup rejectStartup(Long id) {
        Startup startup = startupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Startup not found with id: " + id));

        startup.setStatus("Rejected");
        return startupRepository.save(startup);
    }

    public Page<Startup> getAllApprovedStartups(Pageable pageable) {
        return startupRepository.findAllApprovedStartups(pageable);
    }

    public List<Startup> getAllApprovedStartups() {
        return startupRepository.findAllApprovedStartups();
    }

    @Transactional
    @CacheEvict(value = {"startups", "startupById", "approvedStartups", "submittedStartups", "emailVerifiedStartups", "searchStartups", "filteredStartups"}, allEntries = true)
    public Optional<Integer> incrementViews(Long id) {
        return startupRepository.findById(id).map(startup -> {
            int currentViews = startup.getViewsCount() != null ? startup.getViewsCount() : 0;
            startup.setViewsCount(currentViews + 1);
            startupRepository.save(startup);
            return startup.getViewsCount();
        });
    }

    @Transactional
    @CacheEvict(value = {"startups", "startupById", "approvedStartups", "submittedStartups", "emailVerifiedStartups", "searchStartups", "filteredStartups"}, allEntries = true)
    public List<Startup> saveAllStartups(List<Startup> startups) {
        return startupRepository.saveAll(startups);
    }

    /**
     * Compute individual engagement summary data for all approved businesses.
     * Each business has its own score, solid color, and metrics based on registered coordinates.
     */
    public List<StartupEngagementDTO> getEngagementHeatmapData() {
        List<Startup> approvedStartups = startupRepository.findAllApprovedStartups();

        Map<Long, Long> likeCounts = new HashMap<>();
        try {
            List<Object[]> likesGrouped = likeRepository.countLikesGroupedByStartup();
            if (likesGrouped != null) {
                for (Object[] row : likesGrouped) {
                    if (row != null && row.length >= 2 && row[0] != null && row[1] != null) {
                        likeCounts.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("Could not query grouped likes: {}", e.getMessage());
        }

        Map<Long, Long> bookmarkCounts = new HashMap<>();
        try {
            List<Object[]> bookmarksGrouped = bookmarksRepository.countBookmarksGroupedByStartup();
            if (bookmarksGrouped != null) {
                for (Object[] row : bookmarksGrouped) {
                    if (row != null && row.length >= 2 && row[0] != null && row[1] != null) {
                        bookmarkCounts.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("Could not query grouped bookmarks: {}", e.getMessage());
        }

        Map<Long, Long> viewCounts = new HashMap<>();
        try {
            List<Object[]> viewsGrouped = viewsRepository.countViewsGroupedByStartup();
            if (viewsGrouped != null) {
                for (Object[] row : viewsGrouped) {
                    if (row != null && row.length >= 2 && row[0] != null && row[1] != null) {
                        viewCounts.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("Could not query grouped views: {}", e.getMessage());
        }

        List<StartupEngagementDTO> result = new ArrayList<>();
        for (Startup s : approvedStartups) {
            if (s.getLocationLat() == null || s.getLocationLng() == null) continue;

            String fbLink = s.getFacebook();
            boolean hasFbLink = fbLink != null && !fbLink.trim().isEmpty();
            int fbLikes = (hasFbLink && s.getFacebookLikes() != null) ? s.getFacebookLikes() : 0;
            long ssLikes = likeCounts.getOrDefault(s.getId(), 0L);
            int columnViews = s.getViewsCount() != null ? s.getViewsCount() : 0;
            int tableViews = viewCounts.getOrDefault(s.getId(), 0L).intValue();
            int views = Math.max(columnViews, tableViews);
            long bookmarks = bookmarkCounts.getOrDefault(s.getId(), 0L);

            result.add(new StartupEngagementDTO(
                s.getId(),
                s.getCompanyName(),
                s.getLocationLat(),
                s.getLocationLng(),
                fbLink,
                fbLikes,
                ssLikes,
                views,
                bookmarks
            ));
        }

        return result;
    }

    /**
     * Retrieve individual business engagement performance details.
     */
    public Optional<StartupEngagementDTO> getStartupEngagement(Long startupId) {
        return startupRepository.findById(startupId).map(s -> {
            String fbLink = s.getFacebook();
            boolean hasFbLink = fbLink != null && !fbLink.trim().isEmpty();
            int fbLikes = (hasFbLink && s.getFacebookLikes() != null) ? s.getFacebookLikes() : 0;
            long ssLikes = likeRepository.countByStartupId(startupId);
            int columnViews = s.getViewsCount() != null ? s.getViewsCount() : 0;
            int tableViews = (int) viewsRepository.countByStartup_Id(startupId);
            int views = Math.max(columnViews, tableViews);
            long bookmarks = bookmarksRepository.countByStartup_Id(startupId);

            return new StartupEngagementDTO(
                s.getId(),
                s.getCompanyName(),
                s.getLocationLat(),
                s.getLocationLng(),
                fbLink,
                fbLikes,
                ssLikes,
                views,
                bookmarks
            );
        });
    }

    @Scheduled(cron = "0 0 9 * * ?")
    @Transactional
    public void sendUpdateReminderEmails() {
        logger.info("Checking for startups needing update reminders");
        LocalDateTime sixMonthsAgo = LocalDateTime.now().minusMonths(6); // Change to .minusMinutes(5) for testing
        List<Startup> startups = startupRepository.findStartupsNotUpdatedSince(sixMonthsAgo);

        for (Startup startup : startups) {
            try {
                sendReminderEmail(startup.getContactEmail(), startup.getCompanyName());
                logger.info("Reminder email sent to {} for startup ID: {}", startup.getContactEmail(), startup.getId());
            } catch (Exception e) {
                logger.error("Failed to send reminder email to {}: {}", startup.getContactEmail(), e.getMessage(), e);
            }
        }
    }

    private void sendReminderEmail(String toEmail, String companyName) {
        emailService.sendReminderEmail(toEmail, companyName);
    }

    public Page<Startup> getStartupsWithFilters(
            String industry,
            String status,
            String region,
            String search,
            String startDate,
            String endDate,
            Pageable pageable) {

        StringBuilder jpql = new StringBuilder("SELECT s FROM Startup s WHERE s.isDraft = false");
        StringBuilder countJpql = new StringBuilder("SELECT COUNT(s) FROM Startup s WHERE s.isDraft = false");
        Map<String, Object> params = new HashMap<>();

        if (industry != null && !industry.trim().isEmpty()) {
            jpql.append(" AND s.industry = :industry");
            countJpql.append(" AND s.industry = :industry");
            params.put("industry", industry);
        }
        if (status != null && !status.trim().isEmpty()) {
            String normalizedStatus = status.trim();
            if (normalizedStatus.equalsIgnoreCase("pending")) {
                normalizedStatus = "In Review";
            } else if (normalizedStatus.equalsIgnoreCase("approved")) {
                normalizedStatus = "Approved";
            } else if (normalizedStatus.equalsIgnoreCase("rejected")) {
                normalizedStatus = "Rejected";
            }
            jpql.append(" AND LOWER(s.status) = LOWER(:status)");
            countJpql.append(" AND LOWER(s.status) = LOWER(:status)");
            params.put("status", normalizedStatus);
        }
        if (region != null && !region.trim().isEmpty()) {
            jpql.append(" AND s.region = :region");
            countJpql.append(" AND s.region = :region");
            params.put("region", region);
        }
        if (search != null && !search.trim().isEmpty()) {
            jpql.append(" AND LOWER(s.companyName) LIKE :search");
            countJpql.append(" AND LOWER(s.companyName) LIKE :search");
            params.put("search", "%" + search.toLowerCase() + "%");
        }
        if (startDate != null && !startDate.trim().isEmpty()) {
            LocalDateTime parsedStartDate = LocalDate.parse(startDate).atStartOfDay();
            jpql.append(" AND s.createdAt >= :startDate");
            countJpql.append(" AND s.createdAt >= :startDate");
            params.put("startDate", parsedStartDate);
        }
        if (endDate != null && !endDate.trim().isEmpty()) {
            LocalDateTime parsedEndDate = LocalDate.parse(endDate).atTime(23, 59, 59);
            jpql.append(" AND s.createdAt <= :endDate");
            countJpql.append(" AND s.createdAt <= :endDate");
            params.put("endDate", parsedEndDate);
        }

        // Apply sorting with hierarchy: 1 = In Review, 2 = Approved, 3 = Rejected, 4 = Others
        String statusHierarchyOrder = "CASE " +
                "WHEN LOWER(s.status) LIKE '%review%' OR LOWER(s.status) = 'pending' THEN 1 " +
                "WHEN LOWER(s.status) = 'approved' THEN 2 " +
                "WHEN LOWER(s.status) = 'rejected' THEN 3 " +
                "ELSE 4 END";

        if (pageable.getSort().isSorted()) {
            boolean hasStatusSort = false;
            for (Sort.Order order : pageable.getSort()) {
                if ("status".equalsIgnoreCase(order.getProperty())) {
                    hasStatusSort = true;
                    break;
                }
            }
            if (hasStatusSort) {
                jpql.append(" ORDER BY ");
                pageable.getSort().forEach(order -> {
                    if ("status".equalsIgnoreCase(order.getProperty())) {
                        jpql.append(statusHierarchyOrder).append(" ").append(order.getDirection().name()).append(", ");
                    } else {
                        jpql.append("s.").append(order.getProperty()).append(" ").append(order.getDirection().name()).append(", ");
                    }
                });
                jpql.setLength(jpql.length() - 2);
            } else {
                jpql.append(" ORDER BY ").append(statusHierarchyOrder).append(" ASC, ");
                pageable.getSort().forEach(order -> {
                    jpql.append("s.").append(order.getProperty()).append(" ").append(order.getDirection().name()).append(", ");
                });
                jpql.setLength(jpql.length() - 2);
            }
        } else {
            jpql.append(" ORDER BY ").append(statusHierarchyOrder).append(" ASC, s.companyName ASC");
        }

        TypedQuery<Startup> query = entityManager.createQuery(jpql.toString(), Startup.class);
        TypedQuery<Long> countQuery = entityManager.createQuery(countJpql.toString(), Long.class);

        for (Map.Entry<String, Object> entry : params.entrySet()) {
            query.setParameter(entry.getKey(), entry.getValue());
            countQuery.setParameter(entry.getKey(), entry.getValue());
        }

        long total = countQuery.getSingleResult();

        query.setFirstResult((int) pageable.getOffset());
        query.setMaxResults(pageable.getPageSize());

        List<Startup> content = query.getResultList();

        return new org.springframework.data.domain.PageImpl<>(content, pageable, total);
    }

    public List<Startup> getStartupsWithFilters(
            String industry,
            String status,
            String region,
            String search,
            String startDate,
            String endDate) {

        StringBuilder jpql = new StringBuilder("SELECT s FROM Startup s WHERE s.isDraft = false");
        Map<String, Object> params = new HashMap<>();

        if (industry != null && !industry.trim().isEmpty()) {
            jpql.append(" AND s.industry = :industry");
            params.put("industry", industry);
        }
        if (status != null && !status.trim().isEmpty()) {
            String normalizedStatus = status.trim();
            if (normalizedStatus.equalsIgnoreCase("pending")) {
                normalizedStatus = "In Review";
            } else if (normalizedStatus.equalsIgnoreCase("approved")) {
                normalizedStatus = "Approved";
            } else if (normalizedStatus.equalsIgnoreCase("rejected")) {
                normalizedStatus = "Rejected";
            }
            jpql.append(" AND LOWER(s.status) = LOWER(:status)");
            params.put("status", normalizedStatus);
        }
        if (region != null && !region.trim().isEmpty()) {
            jpql.append(" AND s.region = :region");
            params.put("region", region);
        }
        if (search != null && !search.trim().isEmpty()) {
            jpql.append(" AND LOWER(s.companyName) LIKE :search");
            params.put("search", "%" + search.toLowerCase() + "%");
        }
        if (startDate != null && !startDate.trim().isEmpty()) {
            LocalDateTime parsedStartDate = LocalDate.parse(startDate).atStartOfDay();
            jpql.append(" AND s.createdAt >= :startDate");
            params.put("startDate", parsedStartDate);
        }
        if (endDate != null && !endDate.trim().isEmpty()) {
            LocalDateTime parsedEndDate = LocalDate.parse(endDate).atTime(23, 59, 59);
            jpql.append(" AND s.createdAt <= :endDate");
            params.put("endDate", parsedEndDate);
        }

        String statusHierarchyOrder = "CASE " +
                "WHEN LOWER(s.status) LIKE '%review%' OR LOWER(s.status) = 'pending' THEN 1 " +
                "WHEN LOWER(s.status) = 'approved' THEN 2 " +
                "WHEN LOWER(s.status) = 'rejected' THEN 3 " +
                "ELSE 4 END";
        jpql.append(" ORDER BY ").append(statusHierarchyOrder).append(" ASC, s.companyName ASC");

        TypedQuery<Startup> query = entityManager.createQuery(jpql.toString(), Startup.class);
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            query.setParameter(entry.getKey(), entry.getValue());
        }

        return query.getResultList();
    }

    public List<String> getDistinctIndustries() {
        return startupRepository.findDistinctIndustries();
    }

    @Scheduled(cron = "0 0 9 * * ?") // Daily at 9:00 AM
    @Transactional
    public void processStartupInactivityLifecycle() {
        logger.info("Executing daily startup inactivity & archiving lifecycle check...");
        List<Startup> allStartups = startupRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        for (Startup startup : allStartups) {
            if (Boolean.TRUE.equals(startup.getIsDraft())) continue;
            if (!"Approved".equalsIgnoreCase(startup.getStatus())) continue;

            LocalDateTime refDate = startup.getLastUpdated() != null ? startup.getLastUpdated() : startup.getCreatedAt();
            if (refDate == null) continue;

            long daysInactive = java.time.temporal.ChronoUnit.DAYS.between(refDate, now);

            if (daysInactive > 97) {
                // Moved to archive and hidden in the map after 7 days of inactivity
                if (!Boolean.TRUE.equals(startup.getIsArchived()) || !"ARCHIVED".equalsIgnoreCase(startup.getActivityStatus())) {
                    startup.setIsArchived(true);
                    startup.setActivityStatus("ARCHIVED");
                    startupRepository.save(startup);
                    logger.info("Archived inactive startup '{}' ({} days inactive). Hidden from map.",
                            startup.getCompanyName(), daysInactive);
                }
            } else if (daysInactive > 90) {
                // Categorize as inactive
                boolean modified = false;
                if (!"INACTIVE".equalsIgnoreCase(startup.getActivityStatus())) {
                    startup.setActivityStatus("INACTIVE");
                    startup.setIsArchived(false);
                    modified = true;
                }

                // Email weekly reminder
                boolean sendEmail = false;
                if (startup.getLastInactivityEmailSent() == null) {
                    sendEmail = true;
                } else {
                    long daysSinceLastEmail = java.time.temporal.ChronoUnit.DAYS.between(startup.getLastInactivityEmailSent(), now);
                    if (daysSinceLastEmail >= 7) {
                        sendEmail = true;
                    }
                }

                if (sendEmail && startup.getContactEmail() != null && !startup.getContactEmail().isBlank()) {
                    long daysRemaining = Math.max(0, 97 - daysInactive);
                    try {
                        emailService.sendInactivityWarningEmail(
                                startup.getContactEmail(),
                                startup.getCompanyName(),
                                (int) daysInactive,
                                (int) daysRemaining
                        );
                        startup.setLastInactivityEmailSent(now);
                        modified = true;
                    } catch (Exception e) {
                        logger.error("Failed to email inactivity notice to {}: {}", startup.getContactEmail(), e.getMessage());
                    }
                }

                if (modified) {
                    startupRepository.save(startup);
                }
            } else {
                // Active business (updated within 90 days)
                if (!"ACTIVE".equalsIgnoreCase(startup.getActivityStatus()) || Boolean.TRUE.equals(startup.getIsArchived())) {
                    startup.setActivityStatus("ACTIVE");
                    startup.setIsArchived(false);
                    startupRepository.save(startup);
                }
            }
        }
    }

    public Map<String, Object> getActivityDirectory(String category, String search, String industry, int page, int size) {
        List<Startup> allStartups = startupRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        List<Map<String, Object>> evaluated = new ArrayList<>();
        int activeCount = 0;
        int inactiveCount = 0;
        int archivedCount = 0;

        for (Startup s : allStartups) {
            if (Boolean.TRUE.equals(s.getIsDraft())) continue;
            if (!"Approved".equalsIgnoreCase(s.getStatus())) continue;

            LocalDateTime refDate = s.getLastUpdated() != null ? s.getLastUpdated() : s.getCreatedAt();
            long daysInactive = refDate != null ? Math.max(0, java.time.temporal.ChronoUnit.DAYS.between(refDate, now)) : 0;

            String status;
            if (Boolean.TRUE.equals(s.getIsArchived()) || daysInactive > 97) {
                status = "ARCHIVED";
                archivedCount++;
            } else if (daysInactive > 90) {
                status = "INACTIVE";
                inactiveCount++;
            } else {
                status = "ACTIVE";
                activeCount++;
            }

            // Filter by category
            if (category != null && !category.trim().isEmpty() && !"all".equalsIgnoreCase(category.trim())) {
                if (!status.equalsIgnoreCase(category.trim())) {
                    continue;
                }
            }

            // Filter by industry
            if (industry != null && !industry.trim().isEmpty() && !"all".equalsIgnoreCase(industry.trim())) {
                if (!industry.equalsIgnoreCase(s.getIndustry())) {
                    continue;
                }
            }

            // Filter by search
            if (search != null && !search.trim().isEmpty()) {
                String q = search.trim().toLowerCase();
                String name = s.getCompanyName() != null ? s.getCompanyName().toLowerCase() : "";
                String ind = s.getIndustry() != null ? s.getIndustry().toLowerCase() : "";
                String email = s.getContactEmail() != null ? s.getContactEmail().toLowerCase() : "";
                if (!name.contains(q) && !ind.contains(q) && !email.contains(q)) {
                    continue;
                }
            }

            Map<String, Object> item = new HashMap<>();
            item.put("id", s.getId());
            item.put("companyName", s.getCompanyName());
            item.put("companyDescription", s.getCompanyDescription());
            item.put("industry", s.getIndustry());
            item.put("contactEmail", s.getContactEmail());
            item.put("phoneNumber", s.getPhoneNumber());
            item.put("city", s.getCity());
            item.put("province", s.getProvince());
            item.put("trlLevel", s.getTrlLevel());
            item.put("registrationAgency", s.getRegistrationAgency());
            item.put("isGovernmentRegistered", s.getIsGovernmentRegistered());
            item.put("status", s.getStatus());
            item.put("activityStatus", status);
            item.put("isArchived", "ARCHIVED".equalsIgnoreCase(status));
            item.put("hiddenFromMap", "ARCHIVED".equalsIgnoreCase(status));
            item.put("daysInactive", daysInactive);
            item.put("daysUntilArchive", Math.max(0, 97 - daysInactive));
            item.put("lastUpdated", refDate);
            item.put("lastInactivityEmailSent", s.getLastInactivityEmailSent());
            evaluated.add(item);
        }

        evaluated.sort((a, b) -> {
            Long daysA = (Long) a.get("daysInactive");
            Long daysB = (Long) b.get("daysInactive");
            return daysB.compareTo(daysA);
        });

        int totalElements = evaluated.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int start = page * size;
        int end = Math.min(start + size, totalElements);
        List<Map<String, Object>> paginated = start < totalElements ? evaluated.subList(start, end) : Collections.emptyList();

        Map<String, Object> response = new HashMap<>();
        response.put("content", paginated);
        response.put("totalElements", totalElements);
        response.put("totalPages", totalPages);
        response.put("size", size);
        response.put("number", page);

        Map<String, Object> summary = new HashMap<>();
        summary.put("activeCount", activeCount);
        summary.put("inactiveCount", inactiveCount);
        summary.put("archivedCount", archivedCount);
        summary.put("totalApproved", activeCount + inactiveCount + archivedCount);
        response.put("summary", summary);

        return response;
    }

    @Transactional
    public Startup archiveStartup(Long id) {
        Startup startup = startupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Startup not found with id: " + id));
        startup.setIsArchived(true);
        startup.setActivityStatus("ARCHIVED");
        return startupRepository.save(startup);
    }

    @Transactional
    public Startup reactivateStartup(Long id) {
        Startup startup = startupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Startup not found with id: " + id));
        startup.setIsArchived(false);
        startup.setActivityStatus("ACTIVE");
        startup.setLastUpdated(LocalDateTime.now());
        startup.setLastInactivityEmailSent(null);
        return startupRepository.save(startup);
    }

    @Transactional
    public boolean sendManualInactivityReminder(Long id) {
        Startup startup = startupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Startup not found with id: " + id));
        if (startup.getContactEmail() == null || startup.getContactEmail().isBlank()) {
            throw new RuntimeException("Startup does not have a contact email configured.");
        }
        LocalDateTime refDate = startup.getLastUpdated() != null ? startup.getLastUpdated() : startup.getCreatedAt();
        long daysInactive = refDate != null ? java.time.temporal.ChronoUnit.DAYS.between(refDate, LocalDateTime.now()) : 91;
        long daysRemaining = Math.max(0, 97 - daysInactive);

        boolean sent = emailService.sendInactivityWarningEmail(
                startup.getContactEmail(),
                startup.getCompanyName(),
                (int) daysInactive,
                (int) daysRemaining
        );
        if (sent) {
            startup.setLastInactivityEmailSent(LocalDateTime.now());
            startupRepository.save(startup);
        }
        return sent;
    }

    public double calculateActualExternalFunding(Long startupId) {
        if (startupId == null || investmentInterestRepository == null) return 0.0;
        List<com.startupsphere.capstone.entity.InvestmentInterest> deals = investmentInterestRepository.findByStartup_IdOrderByCreatedAtDesc(startupId);
        double total = 0.0;
        for (com.startupsphere.capstone.entity.InvestmentInterest deal : deals) {
            if ("CLOSED_DEAL".equalsIgnoreCase(deal.getStage())) {
                Double amount = parseFundingAmount(deal.getAmountRange());
                if (amount == null || amount <= 0) {
                    amount = parseFundingAmount(deal.getMessage());
                }
                if (amount != null && amount > 0) {
                    total += amount;
                }
            }
        }
        return total;
    }

    public int countClosedDeals(Long startupId) {
        if (startupId == null || investmentInterestRepository == null) return 0;
        List<com.startupsphere.capstone.entity.InvestmentInterest> deals = investmentInterestRepository.findByStartup_IdOrderByCreatedAtDesc(startupId);
        int count = 0;
        for (com.startupsphere.capstone.entity.InvestmentInterest deal : deals) {
            if ("CLOSED_DEAL".equalsIgnoreCase(deal.getStage())) {
                count++;
            }
        }
        return count;
    }

    private Double parseFundingAmount(String str) {
        if (str == null || str.isBlank()) return null;
        try {
            String cleaned = str.replaceAll("[^0-9.]", "").trim();
            if (!cleaned.isEmpty()) {
                return Double.parseDouble(cleaned);
            }
        } catch (Exception ignored) {}
        return null;
    }
}