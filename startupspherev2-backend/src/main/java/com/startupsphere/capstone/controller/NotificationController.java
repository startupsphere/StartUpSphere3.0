package com.startupsphere.capstone.controller;

import java.util.List;

import org.apache.catalina.security.SecurityUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.startupsphere.capstone.configs.SecurityUtils;
import com.startupsphere.capstone.dtos.NotificationRequest;
import com.startupsphere.capstone.entity.Notifications;
import com.startupsphere.capstone.entity.Startup;
import com.startupsphere.capstone.repository.StartupRepository;
import com.startupsphere.capstone.responses.ApiResponse;
import com.startupsphere.capstone.service.NotificationService;
import com.startupsphere.capstone.service.StartupService;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private static final Logger logger = LoggerFactory.getLogger(NotificationController.class);

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private StartupService startupService;

    @Autowired 
    private StartupRepository srepo;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<ApiResponse> createNotification(@RequestBody NotificationRequest request) {
        try {
            logger.info("Creating new notification");
            Startup startup = srepo.findById(request.getStartupId()).orElseThrow(()-> new IllegalArgumentException("Startup not found"));
            Notifications notifications = notificationService.createStartupApprovalNotification(startup, "in review", request.getComments());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ApiResponse(true, "Notification created successfully", notifications));
        } catch (Exception e) {
            logger.error("Error creating notification: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Failed to create notification: " + e.getMessage(), null));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse> getAllNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        try {
            logger.info("Fetching paginated notifications");
            Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
            Pageable pageable = PageRequest.of(page, size, sort);
            Page<Notifications> notifications = notificationService.getAllNotifications(pageable);
            return ResponseEntity.status(HttpStatus.OK)
                    .body(new ApiResponse(true, "Notifications retrieved successfully", notifications));
        } catch (Exception e) {
            logger.error("Error retrieving notifications: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Failed to fetch all notifications", null));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse> updateNotifications(@RequestBody Notifications notifications,
            @PathVariable int id) {
        try {
            logger.info("Updating notification with id: {}", id);
            Notifications updated = notificationService.updateNotifications(notifications, id);
            return ResponseEntity.ok(new ApiResponse(true, "Notification updated successfully", updated));
        } catch (IllegalArgumentException e) {
            logger.warn("Notification not found with id: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse(false, e.getMessage(), null));
        } catch (Exception e) {
            logger.error("Error updating notification with id: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Failed to update notification", null));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteNotification(@PathVariable int id) {
        try {
            logger.info("Deleting notification with id: {}", id);
            boolean deleted = notificationService.deleteNotification(id);
            return ResponseEntity.ok(new ApiResponse(deleted, "Notification deleted successfully", null));
        } catch (IllegalArgumentException e) {
            logger.warn("Notification not found with id: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse(false, "Notification not found with id: {}", id));
        } catch (Exception e) {
            logger.error("Error deleting notifcation: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Error deleting notification", null));
        }
    }

    @GetMapping("/count")
    public ResponseEntity<ApiResponse> getNotificationsCount() {
        try {
            logger.info("Fetching notifications count");
            long count = notificationService.getNotificationsCount();
            return ResponseEntity.ok()
                    .body(new ApiResponse(true, "Notifications count fetched successfully", count));
        } catch (Exception e) {
            logger.error("Error retrieving notifications count: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Failed to get notifications count", null));
        }
    }

    @GetMapping("/unviewed/count")
    public ResponseEntity<ApiResponse> getUnviewedCount() {
        try {
            long count = notificationService.getUnviewedCount();
            return ResponseEntity.ok()
                    .body(new ApiResponse(true, "Unviewed count retrieved", count));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Error getting unviewed count", null));
        }
    }

    @GetMapping("/new")
    public ResponseEntity<ApiResponse> getUnviewedNotifications() {
        try {
            List<Notifications> notifications = notificationService.getUnviewedNotifications();
            return ResponseEntity.ok()
                    .body(new ApiResponse(true, "Unviewed Notifications retrieved successfully", notifications));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Error retrieving unviewed notifications", null));
        }
    }

    @PutMapping("/{id}/view")
    public ResponseEntity<ApiResponse> markAsViewed(@PathVariable int id) {
        try {
            Notifications viewed = notificationService.markAsViewed(id);
            return ResponseEntity.ok()
                    .body(new ApiResponse(true, "Marked as viewed successfully", viewed));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Error marking as viewed", null));
        }
    }



    @GetMapping("/my")
    public ResponseEntity<ApiResponse> getUserNotifications() {
        try {
            Integer currentUserId = SecurityUtils.getCurrentUserId();
            logger.info("fetching user notifications with id: ", currentUserId);
            List<Notifications> notifications = notificationService.getUserNotifications(currentUserId);
            return ResponseEntity.ok()
                    .body(new ApiResponse(true, "User notifications successfully fetched", notifications));
        } catch (Exception e) {
            logger.error("Error fetching user notifications: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Error fetching user notifications", null));
        }
    }

    @GetMapping("/my/{id}")
    public ResponseEntity<ApiResponse> getUserNotificationById(@PathVariable int id) {
        try {
            Integer currentUserId = SecurityUtils.getCurrentUserId();
            logger.info("Fetching notification id: {} for user: {}", id, currentUserId);

            // Get the notification from the repository
            Notifications notification = notificationService.getNotificationById(id);

            // Check if the notification belongs to the current user
            if (notification.getUser() != null && notification.getUser().getId().equals(currentUserId)) {
                return ResponseEntity.ok()
                        .body(new ApiResponse(true, "Notification fetched successfully", notification));
            } else {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ApiResponse(false, "Access denied", null));
            }
        } catch (IllegalArgumentException e) {
            logger.warn("Notification not found with id: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse(false, "Notification not found", null));
        } catch (Exception e) {
            logger.error("Error fetching notification: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Error fetching notification", null));
        }
    }

    @PutMapping("/my/markAllRead")
    public ResponseEntity<ApiResponse> markAllNotificationsAsRead() {
        try {
            Integer currentUserId = SecurityUtils.getCurrentUserId();
            logger.info("Marking all notifications as read for user: {}", currentUserId);

            List<Notifications> updatedNotifications = notificationService.markAllAsViewed(currentUserId);
            return ResponseEntity.ok()
                    .body(new ApiResponse(true, "All notifications marked as read", updatedNotifications));
        } catch (Exception e) {
            logger.error("Error marking all notifications as read: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Error marking all notifications as read", null));
        }
    }

    @GetMapping("/my/new")
    public ResponseEntity<ApiResponse> getUserUnviewedNotifications() {
        try {
            Integer currentUserId = SecurityUtils.getCurrentUserId();
            logger.info("Fetching user unviewed notifications: {}", currentUserId);
            List<Notifications> notifications = notificationService.getUserUnviewedNotifications(currentUserId);
            return ResponseEntity.ok()
                    .body(new ApiResponse(true, "Users new notifications fetched successfully", notifications));
        } catch (Exception e) {
            logger.error("Error fetching users new notifications: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Error fetching users new notifications", null));
        }
    }

    @GetMapping("/new/count")
    public ResponseEntity<ApiResponse> getUserUnviewedCount() {
        try {
            Integer currentUserId = SecurityUtils.getCurrentUserId();
            logger.info("Fetching count new notifications: ", currentUserId);
            long count = notificationService.getUserUnviewedCount(currentUserId);
            return ResponseEntity.ok()
                    .body(new ApiResponse(true, "Count of new notifications fetched successfully", count));
        } catch (Exception e) {
            logger.error("Error fetching count of new notifications: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Error fetching count of new user notifications", null));
        }
    }

    @PutMapping("/startups/{id}/approve")
    public ResponseEntity<ApiResponse> approveStartup(@PathVariable long id, @RequestBody NotificationRequest request) {
        try {
            Startup startup = startupService.approveStartup(id);
            Notifications notifications = notificationService.createStartupApprovalNotification(
                    startup,
                    "approved",
                    request.getComments()
            );
            return ResponseEntity.ok()
                    .body(new ApiResponse(true, "Startup approved successfully", startup));
        } catch (Exception e) {
            logger.error("Error approving startup: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Error approving startup", null));
        }
    }

    @PutMapping("/startups/{id}/reject")
    public ResponseEntity<ApiResponse> rejectStartup(@PathVariable long id, @RequestBody NotificationRequest request) {
        try {
            Startup startup = startupService.rejectStartup(id);
            Notifications notifications = notificationService.createStartupApprovalNotification(startup, "rejected", request.getComments());
            return ResponseEntity.ok()
                    .body(new ApiResponse(true, "Startup rejected successfully", startup));
        } catch (Exception e) {
            logger.error("Error rejecting startup: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ApiResponse(false,"Error rejecting startup: {}", e.getMessage()));
        }
    }

}
