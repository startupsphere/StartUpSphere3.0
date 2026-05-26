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

import com.startupsphere.capstone.controller.NotificationController;
import com.startupsphere.capstone.dtos.NotificationRequest;
import com.startupsphere.capstone.entity.Notifications;
import com.startupsphere.capstone.entity.Startup;
import com.startupsphere.capstone.entity.User;
import com.startupsphere.capstone.repository.NotificationsRepository;
import com.startupsphere.capstone.repository.StartupRepository;
import com.startupsphere.capstone.repository.UserRepository;
import com.startupsphere.capstone.responses.NotificationRemarks;

@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    @Autowired
    private NotificationsRepository nrepo;

    @Autowired
    private StartupRepository srepo;

    @Autowired
    private UserRepository urepo;

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

        switch (status.toLowerCase()) {
            case "approved":
                request.setRemarks(String.format(NotificationRemarks.STARTUP_APPROVED, startup.getCompanyName()));
                request.setComments("Congratulations! Your startup has been approved. " + comments);
                break;
            case "rejected":
                request.setRemarks(String.format(NotificationRemarks.STARTUP_REJECTED, startup.getCompanyName()));
                request.setComments("Your startup application has been rejected. " + comments);
                break;
            case "in review":
                request.setRemarks(String.format(NotificationRemarks.STARTUP_SUBMITTED, startup.getCompanyName()));
                request.setComments("Your startup application is now under review. " + comments);
                break;
            default:
                break;
        }

        request.setStartupId(startup.getId());
        request.setUserId(startup.getUser().getId());

        return createNotifications(request);
    }

}
