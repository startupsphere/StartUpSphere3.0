package com.startupsphere.capstone.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.startupsphere.capstone.entity.Startup;
import org.springframework.data.repository.query.Param;

public interface StartupRepository extends JpaRepository<Startup, Long> {
    Page<Startup> findByCompanyNameContainingIgnoreCase(String query, Pageable pageable);
    List<Startup> findByCompanyNameContainingIgnoreCase(String query);

    Page<Startup> findByUser_Id(Integer userId, Pageable pageable);
    List<Startup> findByUser_Id(Integer userId);

    Page<Startup> findByUser_IdAndIsDraftFalse(Integer userId, Pageable pageable);
    List<Startup> findByUser_IdAndIsDraftFalse(Integer userId);

    Page<Startup> findByUser_IdAndIsDraftTrue(Integer userId, Pageable pageable);
    List<Startup> findByUser_IdAndIsDraftTrue(Integer userId);

    Optional<Startup> findByContactEmailAndVerificationCode(String contactEmail, String verificationCode);

    boolean existsByContactEmailAndEmailVerifiedTrue(String contactEmail);

    Page<Startup> findByStatusAndIsDraftFalse(String status, Pageable pageable);
    List<Startup> findByStatusAndIsDraftFalse(String status);

    @Query("SELECT s FROM Startup s WHERE s.emailVerified = true")
    Page<Startup> findAllVerifiedEmailStartups(Pageable pageable);
    
    @Query("SELECT s FROM Startup s WHERE s.emailVerified = true")
    List<Startup> findAllVerifiedEmailStartups();

    @Query("SELECT s FROM Startup s WHERE s.status = 'Approved'")
    Page<Startup> findAllApprovedStartups(Pageable pageable);
    
    @Query("SELECT s FROM Startup s WHERE s.status = 'Approved'")
    List<Startup> findAllApprovedStartups();

    @Query("SELECT s FROM Startup s WHERE " +
            "s.isDraft = false AND " +
            "(:industry IS NULL OR s.industry = :industry) AND " +
            "(:status IS NULL OR s.status = :status) AND " +
            "(:region IS NULL OR s.region = :region) AND " +
            "(:search IS NULL OR LOWER(s.companyName) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
            "(:startDate IS NULL OR s.createdAt >= :startDate) AND " +
            "(:endDate IS NULL OR s.createdAt <= :endDate)")
    Page<Startup> findStartupsWithFilters(
            @Param("industry") String industry,
            @Param("status") String status,
            @Param("region") String region,
            @Param("search") String search,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );
    
    @Query("SELECT s FROM Startup s WHERE " +
            "s.isDraft = false AND " +
            "(:industry IS NULL OR s.industry = :industry) AND " +
            "(:status IS NULL OR s.status = :status) AND " +
            "(:region IS NULL OR s.region = :region) AND " +
            "(:search IS NULL OR LOWER(s.companyName) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
            "(:startDate IS NULL OR s.createdAt >= :startDate) AND " +
            "(:endDate IS NULL OR s.createdAt <= :endDate)")
    List<Startup> findStartupsWithFilters(
            @Param("industry") String industry,
            @Param("status") String status,
            @Param("region") String region,
            @Param("search") String search,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("SELECT s FROM Startup s WHERE s.lastUpdated < :threshold AND s.emailVerified = true")
    List<Startup> findStartupsNotUpdatedSince(LocalDateTime threshold);

    @Query("SELECT DISTINCT s.industry FROM Startup s WHERE s.industry IS NOT NULL")
    List<String> findDistinctIndustries();

    @Query("SELECT s FROM Startup s WHERE " +
            "LOWER(s.companyName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(s.locationName) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Startup> searchByFields(@Param("query") String query, Pageable pageable);
    
    @Query("SELECT s FROM Startup s WHERE " +
            "LOWER(s.companyName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(s.locationName) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Startup> searchByFields(@Param("query") String query);
}