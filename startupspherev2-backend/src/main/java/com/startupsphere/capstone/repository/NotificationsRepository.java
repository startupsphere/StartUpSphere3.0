package com.startupsphere.capstone.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.startupsphere.capstone.entity.Notifications;

@Repository
public interface NotificationsRepository extends JpaRepository<Notifications, Integer> {
    long countByIsViewedFalse();
    Page<Notifications> findByIsViewedFalse(Pageable pageable);
    List<Notifications> findByIsViewedFalse();
    
    Page<Notifications> findByUserIdOrderByIdDesc(Integer userId, Pageable pageable);
    List<Notifications> findByUserIdOrderByIdDesc(Integer userId);
    
    Page<Notifications> findByUserIdAndIsViewedFalseOrderByIdDesc(Integer userId, Pageable pageable);
    List<Notifications> findByUserIdAndIsViewedFalseOrderByIdDesc(Integer userId);
    
    long countByUserIdAndIsViewedFalse(Integer userId);

    @Query("SELECT DISTINCT n FROM Notifications n " +
           "LEFT JOIN n.user u " +
           "LEFT JOIN n.startup s " +
           "WHERE (u.id = :userId) " +
           "   OR (:userEmail IS NOT NULL AND LOWER(u.email) = LOWER(:userEmail)) " +
           "   OR (s.id IN (SELECT st.id FROM Startup st WHERE st.user.id = :userId OR (:userEmail IS NOT NULL AND (LOWER(st.contactEmail) = LOWER(:userEmail) OR (st.user IS NOT NULL AND LOWER(st.user.email) = LOWER(:userEmail)))))) " +
           "ORDER BY n.id DESC")
    List<Notifications> findUserNotificationsComprehensive(@Param("userId") Integer userId, @Param("userEmail") String userEmail);

    @Query("SELECT DISTINCT n FROM Notifications n " +
           "LEFT JOIN n.user u " +
           "LEFT JOIN n.startup s " +
           "WHERE n.isViewed = false " +
           "  AND ((u.id = :userId) " +
           "       OR (:userEmail IS NOT NULL AND LOWER(u.email) = LOWER(:userEmail)) " +
           "       OR (s.id IN (SELECT st.id FROM Startup st WHERE st.user.id = :userId OR (:userEmail IS NOT NULL AND (LOWER(st.contactEmail) = LOWER(:userEmail) OR (st.user IS NOT NULL AND LOWER(st.user.email) = LOWER(:userEmail))))))) " +
           "ORDER BY n.id DESC")
    List<Notifications> findUserUnviewedNotificationsComprehensive(@Param("userId") Integer userId, @Param("userEmail") String userEmail);

    @Query("SELECT COUNT(DISTINCT n) FROM Notifications n " +
           "LEFT JOIN n.user u " +
           "LEFT JOIN n.startup s " +
           "WHERE n.isViewed = false " +
           "  AND ((u.id = :userId) " +
           "       OR (:userEmail IS NOT NULL AND LOWER(u.email) = LOWER(:userEmail)) " +
           "       OR (s.id IN (SELECT st.id FROM Startup st WHERE st.user.id = :userId OR (:userEmail IS NOT NULL AND (LOWER(st.contactEmail) = LOWER(:userEmail) OR (st.user IS NOT NULL AND LOWER(st.user.email) = LOWER(:userEmail)))))))")
    long countUserUnviewedNotificationsComprehensive(@Param("userId") Integer userId, @Param("userEmail") String userEmail);
}
