package com.startupsphere.capstone.repository;

import com.startupsphere.capstone.entity.Like;
import com.startupsphere.capstone.entity.Startup;
import com.startupsphere.capstone.entity.Views;

import jakarta.transaction.Transactional;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface LikeRepository extends JpaRepository<Like, Long> {
        Optional<Like> findByUserIdAndStartupId(Integer userId, Long startupId);

        Page<Like> findByStartup(Startup startup, Pageable pageable);
        List<Like> findByStartup(Startup startup);

        @Modifying
        @Query("DELETE FROM Like l WHERE l.startup = :startup")
        void deleteByStartup(@Param("startup") Startup startup);

        @Modifying
        @Transactional
        @Query("DELETE FROM Like l WHERE l.startup.id = :startupId")
        void deleteByStartupId(@Param("startupId") Long startupId);

        // Corrected method to reference the 'investorId' field in the 'Investor' entity
        Optional<Like> findByUserIdAndInvestor_InvestorId(Integer userId, Integer investorId);

        long countByStartupId(Long startupId);

        @Query("SELECT MONTH(l.timestamp) AS month, COUNT(l) AS count " +
                        "FROM Like l " +
                        "WHERE l.startup.id = :startupId " +
                        "GROUP BY MONTH(l.timestamp) " +
                        "ORDER BY MONTH(l.timestamp)")
        List<Object[]> countLikesGroupedByMonthForStartup(@Param("startupId") Long startupId);

        @Query("SELECT COUNT(l) FROM Like l WHERE l.startup.user.id = :userId")
        long countLikesByStartupOwner(@Param("userId") Integer userId);

        @Query("SELECT MONTH(l.timestamp) AS month, COUNT(l) AS count " +
                        "FROM Like l " +
                        "WHERE l.startup.user.id = :userId " +
                        "GROUP BY MONTH(l.timestamp) " +
                        "ORDER BY MONTH(l.timestamp)")
        List<Object[]> countLikesGroupedByMonthForUserOwnedStartups(@Param("userId") Integer userId);
}