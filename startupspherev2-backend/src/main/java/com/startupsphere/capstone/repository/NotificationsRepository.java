package com.startupsphere.capstone.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
