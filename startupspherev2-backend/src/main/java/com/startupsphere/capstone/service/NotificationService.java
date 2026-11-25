package com.startupsphere.capstone.service;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

import com.startupsphere.capstone.dtos.InvestmentInterestRequest;
import com.startupsphere.capstone.dtos.NotificationRequest;
import com.startupsphere.capstone.entity.Notifications;
import com.startupsphere.capstone.entity.Startup;
import com.startupsphere.capstone.entity.Investor;
import com.startupsphere.capstone.entity.User;
import com.startupsphere.capstone.repository.NotificationsRepository;
import com.startupsphere.capstone.repository.StartupRepository;
import com.startupsphere.capstone.repository.UserRepository;
import com.startupsphere.capstone.responses.NotificationRemarks;
import com.startupsphere.capstone.service.EmailService;

@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    @Autowired
    private NotificationsRepository nrepo;

    @Autowired
    private StartupRepository srepo;

    @Autowired
    private UserRepository urepo;

    @Autowired
    private EmailService emailService;

    @Autowired
    private com.startupsphere.capstone.repository.InvestmentInterestRepository investmentInterestRepository;

    @CacheEvict(value = "notifications", allEntries = true)
    public Notifications createNotifications(NotificationRequest request) {
        Notifications notification = new Notifications();
        notification.setRemarks(request.getRemarks());
        notification.setComments(request.getComments());

        Startup startup = srepo.findById(request.getStartupId())
                .orElseThrow(() -> new IllegalArgumentException("Startup not found"));
        notification.setStartup(startup);

        if (request.getUserId() != null) {
            User user = urepo.findById(request.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
            notification.setUser(user);
        }

        return nrepo.save(notification);
    }

    @Cacheable(value = "notifications", key = "#pageable.pageNumber + '-' + #pageable.pageSize + '-' + #pageable.sort.toString()")
    public Page<Notifications> getAllNotifications(Pageable pageable) {
        return nrepo.findAll(pageable);
    }

    public List<Notifications> getAllNotifications() {
        return nrepo.findAll();
    }

    @CacheEvict(value = "notifications", allEntries = true)
    public Notifications updateNotifications(Notifications updatedNotifications, int id) {
        try {
            Notifications existingNotifications = nrepo.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

            existingNotifications.setRemarks(updatedNotifications.getRemarks());

            if (existingNotifications.getStartup() != null) {
                existingNotifications.setStartup(updatedNotifications.getStartup());
            }

            return nrepo.save(existingNotifications);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Error updating notification");
        } catch (Exception e) {
            throw new RuntimeException("Unexpected error while updating notification");
        }
    }

    @CacheEvict(value = "notifications", allEntries = true)
    public boolean deleteNotification(int id) {
        try {
            Notifications notifications = nrepo.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("notification not found"));

            nrepo.delete(notifications);
            return true;
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Error deleting notifcation: " + e.getMessage());
        } catch (Exception e) {
            throw new RuntimeException("Unexpected error while deleting notification: " + e.getMessage());
        }
    }

    public long getNotificationsCount() {
        try {
            return nrepo.count();
        } catch (Exception e) {
            logger.error("Error counting notifications: {}", e.getMessage());
            throw new RuntimeException("Error getting notifications count: " + e.getMessage());
        }
    }

    @CacheEvict(value = "notifications", allEntries = true)
    public Notifications markAsViewed(int id) {
        try {
            Notifications notifications = nrepo.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
            notifications.setViewed(true);
            return nrepo.save(notifications);
        } catch (Exception e) {
            logger.error("Error marking notification: {}", e.getMessage());
            throw new RuntimeException("Error marking notification as viewed", e);
        }
    }

    public long getUnviewedCount(){
        return nrepo.countByIsViewedFalse();
    }

    public List<Notifications> getUnviewedNotifications(){
        return nrepo.findByIsViewedFalse();
    }

    public List<Notifications> getUserNotifications(Integer userId){
        try {
            return nrepo.findByUserIdOrderByIdDesc(userId);
        } catch (Exception e) {
            logger.error("Error retrieving notifications: {}", e.getMessage());
            throw new RuntimeException("Error fetching notifications",e);
        }
    }

    @CacheEvict(value = "notifications", allEntries = true)
    public List<Notifications> markAllAsViewed(Integer userId) {
        try {
            List<Notifications> unviewedNotifications = nrepo.findByUserIdAndIsViewedFalseOrderByIdDesc(userId);
            for (Notifications notification : unviewedNotifications) {
                notification.setViewed(true);
            }
            return nrepo.saveAll(unviewedNotifications);
        } catch (Exception e) {
            logger.error("Error marking all notifications as viewed: {}", e.getMessage());
            throw new RuntimeException("Error marking all notifications as viewed", e);
        }
    }

    public Notifications getNotificationById(int id) {
        return nrepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found with id: " + id));
    }

    public List<Notifications> getUserUnviewedNotifications(Integer userId){
        try {
            return nrepo.findByUserIdAndIsViewedFalseOrderByIdDesc(userId);
        } catch (Exception e) {
            logger.error("Error fetching user notifications: {}", e.getMessage());
            throw new RuntimeException("Error retrieving user notifications",e);
        }
    }

    public long getUserUnviewedCount(Integer userId){
        try {
            return nrepo.countByUserIdAndIsViewedFalse(userId);
        } catch (Exception e) {
            logger.error("Error counting user unviewed notifications: {}", e.getMessage());
            throw new RuntimeException("Error counting unviewed notifications",e);
        }
    }

    public Notifications createStartupApprovalNotification(Startup startup, String status, String comments) {
        NotificationRequest request = new NotificationRequest();
        boolean isInvestor = startup.getRole() != null && startup.getRole().equalsIgnoreCase("ROLE_INVESTOR");

        switch (status.toLowerCase()) {
            case "approved":
                if (isInvestor) {
                    request.setRemarks(String.format(NotificationRemarks.INVESTOR_APPROVED, startup.getCompanyName()));
                    request.setComments("Congratulations! Your investor profile has been approved. " + (comments != null ? comments : ""));
                } else {
                    request.setRemarks(String.format(NotificationRemarks.STARTUP_APPROVED, startup.getCompanyName()));
                    request.setComments("Congratulations! Your startup has been approved. " + (comments != null ? comments : ""));
                }
                break;
            case "rejected":
                if (isInvestor) {
                    request.setRemarks(String.format(NotificationRemarks.INVESTOR_REJECTED, startup.getCompanyName()));
                    request.setComments("Your investor application has been rejected. " + (comments != null ? comments : ""));
                } else {
                    request.setRemarks(String.format(NotificationRemarks.STARTUP_REJECTED, startup.getCompanyName()));
                    request.setComments("Your startup application has been rejected. " + (comments != null ? comments : ""));
                }
                break;
            case "in review":
                if (isInvestor) {
                    request.setRemarks(String.format(NotificationRemarks.INVESTOR_SUBMITTED, startup.getCompanyName()));
                    request.setComments("Your investor application is now under review. " + (comments != null ? comments : ""));
                } else {
                    request.setRemarks(String.format(NotificationRemarks.STARTUP_SUBMITTED, startup.getCompanyName()));
                    request.setComments("Your startup application is now under review. " + (comments != null ? comments : ""));
                }
                break;
            default:
                break;
        }

        request.setStartupId(startup.getId());
        if (startup.getUser() != null) {
            request.setUserId(startup.getUser().getId());
        }

        return createNotifications(request);
    }

    public Notifications createInvestorApprovalNotification(Investor investor, String status, String comments) {
        if (investor == null || investor.getUserId() == null) {
            return null;
        }

        NotificationRequest request = new NotificationRequest();
        String investorName = (investor.getFirstname() != null ? investor.getFirstname() : "") + " " +
                             (investor.getLastname() != null ? investor.getLastname() : "");
        investorName = investorName.trim().isEmpty() ? "Investor Profile" : investorName.trim();

        switch (status.toLowerCase()) {
            case "approved":
                request.setRemarks(String.format(NotificationRemarks.INVESTOR_APPROVED, investorName));
                request.setComments("Congratulations! Your investor profile has been approved. " + (comments != null ? comments : ""));
                break;
            case "rejected":
                request.setRemarks(String.format(NotificationRemarks.INVESTOR_REJECTED, investorName));
                request.setComments("Your investor application has been rejected. " + (comments != null ? comments : ""));
                break;
            case "in review":
                request.setRemarks(String.format(NotificationRemarks.INVESTOR_SUBMITTED, investorName));
                request.setComments("Your investor application is now under review. " + (comments != null ? comments : ""));
                break;
            default:
                break;
        }

        request.setUserId(investor.getUserId().getId());
        return createNotifications(request);
    }

    public Notifications createStartupLikedNotification(Startup startup, User liker) {
        if (startup == null || startup.getUser() == null) {
            return null;
        }

        NotificationRequest request = new NotificationRequest();
        String likerName = "";
        if (liker != null) {
            likerName = ((liker.getFirstname() != null ? liker.getFirstname() : "") + " " +
                         (liker.getLastname() != null ? liker.getLastname() : "")).trim();
        }
        if (likerName.isEmpty()) {
            likerName = "A user";
        }

        boolean isSelfLike = liker != null && liker.getId() != null && liker.getId().equals(startup.getUser().getId());

        if (isSelfLike) {
            request.setRemarks(String.format(NotificationRemarks.STARTUP_LIKED_SELF, startup.getCompanyName()));
            request.setComments("Your business received a new like! Check your dashboard to view your engagement metrics.");
        } else {
            request.setRemarks(String.format(NotificationRemarks.STARTUP_LIKED, likerName, startup.getCompanyName()));
            request.setComments(likerName + " showed support by liking your business profile! Check your dashboard to view your engagement metrics.");
        }

        request.setStartupId(startup.getId());
        request.setUserId(startup.getUser().getId());

        return createNotifications(request);
    }

    public Notifications createInvestmentInterestNotification(Startup startup, InvestmentInterestRequest request, User senderUser) {
        if (startup == null || startup.getUser() == null) {
            return null;
        }

        NotificationRequest notifReq = new NotificationRequest();
        String investorName = request.getInvestorName() != null && !request.getInvestorName().isBlank()
                ? request.getInvestorName().trim()
                : (senderUser != null ? ((senderUser.getFirstname() != null ? senderUser.getFirstname() : "") + " " +
                                         (senderUser.getLastname() != null ? senderUser.getLastname() : "")).trim() : "An investor");
        if (investorName.isBlank()) {
            investorName = "An investor";
        }
        String investorType = request.getInvestorType() != null && !request.getInvestorType().isBlank()
                ? request.getInvestorType()
                : "Investor / Backer";

        String formattedRemarks = String.format(NotificationRemarks.INVESTMENT_INTEREST, investorName, startup.getCompanyName());
        if (formattedRemarks.length() > 250) {
            formattedRemarks = formattedRemarks.substring(0, 247) + "...";
        }
        notifReq.setRemarks(formattedRemarks);

        StringBuilder comments = new StringBuilder();
        comments.append("Investor / Proposer: ").append(investorName).append(" (").append(investorType).append(")\n");
        if (request.getInvestorEmail() != null && !request.getInvestorEmail().isBlank()) {
            comments.append("Email: ").append(request.getInvestorEmail().trim()).append("\n");
        }
        if (request.getInvestorPhone() != null && !request.getInvestorPhone().isBlank()) {
            comments.append("Phone: ").append(request.getInvestorPhone().trim()).append("\n");
        }
        if (request.getAmountRange() != null && !request.getAmountRange().isBlank()) {
            comments.append("Proposed Investment Amount: ").append(request.getAmountRange()).append("\n");
        }
        if (request.getProcessType() != null && !request.getProcessType().isBlank()) {
            comments.append("Discussion Process: ").append(request.getProcessType()).append("\n");
        }
        if (request.getMessage() != null && !request.getMessage().isBlank()) {
            comments.append("Proposal / Agenda: ").append(request.getMessage().trim());
        }

        notifReq.setComments(comments.toString());
        notifReq.setStartupId(startup.getId());
        notifReq.setUserId(startup.getUser().getId());

        return createNotifications(notifReq);
    }

    public Notifications processInvestmentDecision(int notificationId, String decision, String notes, User businessOwner) {
        Notifications notif = nrepo.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found with ID: " + notificationId));

        Startup startup = notif.getStartup();
        boolean isAccepted = "ACCEPT".equalsIgnoreCase(decision) || "ACCEPTED".equalsIgnoreCase(decision);

        // Parse investor info from notif.getComments()
        String investorName = "Investor";
        String investorEmail = null;
        String commentsStr = notif.getComments() != null ? notif.getComments() : "";
        for (String line : commentsStr.split("\n")) {
            if (line.startsWith("Investor / Proposer: ")) {
                String sub = line.substring("Investor / Proposer: ".length());
                int paren = sub.indexOf("(");
                if (paren != -1) {
                    investorName = sub.substring(0, paren).trim();
                } else {
                    investorName = sub.trim();
                }
            } else if (line.startsWith("Email: ")) {
                investorEmail = line.substring("Email: ".length()).trim();
            }
        }

        // If amount was specified, extract it
        Double parsedAmount = null;
        for (String line : commentsStr.split("\n")) {
            if (line.startsWith("Proposed Investment Amount: ")) {
                String amtStr = line.substring("Proposed Investment Amount: ".length()).replaceAll("[^0-9.]", "").trim();
                if (!amtStr.isEmpty()) {
                    try {
                        parsedAmount = Double.parseDouble(amtStr);
                    } catch (Exception ignored) {}
                }
            }
        }

        // When accepted, keep in initial deal stage (INITIAL_REVIEW or direct pitch) so founder and investor can negotiate and advance through stages until CLOSED_DEAL
        // NOTE: Total funding reflects once the deal reaches CLOSED_DEAL (Closed / Funded) in the pipeline!

        // Update the original notification comments to append decision record
        String decisionStatus = isAccepted ? "ACCEPTED" : "REJECTED";
        String updatedComments = commentsStr + "\n\n--- Status: " + decisionStatus + " ---\nDecision Date: "
                + java.time.LocalDateTime.now()
                + (notes != null && !notes.isBlank() ? "\nFounder Note: " + notes.trim() : "");
        notif.setComments(updatedComments);
        notif.setViewed(true);
        nrepo.save(notif);

        // Look up investor user account by email to deliver in-app notification
        User investorUser = null;
        if (investorEmail != null && !investorEmail.isBlank()) {
            final String finalEmail = investorEmail;
            investorUser = urepo.findFirstByEmailIgnoreCase(finalEmail)
                    .or(() -> urepo.findFirstByEmail(finalEmail))
                    .orElse(null);
        }

        String companyName = startup != null ? startup.getCompanyName() : "The business";

        // 1. Notify the investor if they have an account in the system
        if (investorUser != null && startup != null) {
            NotificationRequest investorNotifReq = new NotificationRequest();
            if (isAccepted) {
                investorNotifReq.setRemarks(String.format(NotificationRemarks.INVESTMENT_ACCEPTED_INVESTOR, companyName, companyName));
                investorNotifReq.setComments("Congratulations! " + companyName + " has accepted your investment proposal.\n"
                        + "Contact: " + (businessOwner != null ? businessOwner.getEmail() : startup.getContactEmail()) + "\n"
                        + (notes != null && !notes.isBlank() ? "Message from Founder: " + notes.trim() : ""));
            } else {
                investorNotifReq.setRemarks(String.format(NotificationRemarks.INVESTMENT_REJECTED_INVESTOR, companyName, companyName));
                investorNotifReq.setComments("Your investment inquiry for " + companyName + " was declined at this time."
                        + (notes != null && !notes.isBlank() ? "\nReason/Note: " + notes.trim() : ""));
            }
            investorNotifReq.setStartupId(startup.getId());
            investorNotifReq.setUserId(investorUser.getId());
            createNotifications(investorNotifReq);
        }

        // 2. Notify the business owner (in-app confirmation)
        if (businessOwner != null && startup != null) {
            NotificationRequest ownerNotifReq = new NotificationRequest();
            if (isAccepted) {
                ownerNotifReq.setRemarks(String.format(NotificationRemarks.INVESTMENT_ACCEPTED_OWNER, investorName, companyName));
                ownerNotifReq.setComments("You accepted the investment proposal from " + investorName + " for " + companyName + ".\n"
                        + "Investor Email: " + (investorEmail != null ? investorEmail : "Check original inquiry") + "\n"
                        + "The investor has been notified and will reach out to you soon.");
            } else {
                ownerNotifReq.setRemarks(String.format(NotificationRemarks.INVESTMENT_REJECTED_OWNER, investorName, companyName));
                ownerNotifReq.setComments("You declined the investment proposal from " + investorName + " for " + companyName + ".");
            }
            ownerNotifReq.setStartupId(startup.getId());
            ownerNotifReq.setUserId(businessOwner.getId());
            createNotifications(ownerNotifReq);
        }

        // 3. Send email to investor asynchronously
        if (investorEmail != null && !investorEmail.isBlank()) {
            final String targetEmail = investorEmail;
            final String targetName = investorName;
            final String cName = companyName;
            final String dStatus = decisionStatus;
            final String mNotes = notes;
            new Thread(() -> {
                try {
                    emailService.sendInvestmentDecisionEmail(targetEmail, targetName, cName, dStatus, targetName, mNotes);
                } catch (Exception ex) {
                    logger.warn("Failed to dispatch investment decision email to {}: {}", targetEmail, ex.getMessage());
                }
            }).start();
        }

        // 4. Synchronize Deal Flow & Pipeline Management (InvestmentInterest)
        try {
            if (startup != null && startup.getId() != null) {
                List<com.startupsphere.capstone.entity.InvestmentInterest> existingInterests =
                        investmentInterestRepository.findByStartup_IdOrderByCreatedAtDesc(startup.getId());
                com.startupsphere.capstone.entity.InvestmentInterest targetInterest = null;

                // Match existing interest by investor email or investorUser
                for (com.startupsphere.capstone.entity.InvestmentInterest ii : existingInterests) {
                    if (investorEmail != null && investorEmail.equalsIgnoreCase(ii.getInvestorEmail())) {
                        targetInterest = ii;
                        break;
                    }
                    if (investorUser != null && ii.getInvestorUser() != null && investorUser.getId().equals(ii.getInvestorUser().getId())) {
                        targetInterest = ii;
                        break;
                    }
                }

                // If not found, create a new record so deal flow has full tracking
                if (targetInterest == null) {
                    targetInterest = new com.startupsphere.capstone.entity.InvestmentInterest();
                    targetInterest.setStartup(startup);
                    targetInterest.setInvestorUser(investorUser);
                    targetInterest.setInvestorName(investorName);
                    targetInterest.setInvestorEmail(investorEmail);
                    targetInterest.setInvestorType("Verified Investor / Backer");
                    targetInterest.setAmountRange(parsedAmount != null && parsedAmount > 0 ? "₱" + String.format("%,.0f", parsedAmount) : "Undisclosed");
                    targetInterest.setProcessType("Direct Platform Inquiry");
                    targetInterest.setMessage(commentsStr);
                }

                // Reflect stage: If ACCEPTED -> move to INITIAL_REVIEW (Screening & Discussion) so both parties can progress deals through stages to CLOSED_DEAL. If REJECTED -> PASSED (Archived).
                targetInterest.setStage(isAccepted ? "INITIAL_REVIEW" : "PASSED");
                String updatedNotes = (targetInterest.getNotes() != null && !targetInterest.getNotes().isBlank())
                        ? targetInterest.getNotes() + "\n[Decision]: " + decisionStatus + (notes != null && !notes.isBlank() ? " - " + notes.trim() : "")
                        : "[Decision]: " + decisionStatus + (notes != null && !notes.isBlank() ? " - " + notes.trim() : "");
                targetInterest.setNotes(updatedNotes);
                investmentInterestRepository.save(targetInterest);
            }
        } catch (Exception ex) {
            logger.error("Failed to sync investment interest deal flow on decision: {}", ex.getMessage());
        }

        return notif;
    }

}
