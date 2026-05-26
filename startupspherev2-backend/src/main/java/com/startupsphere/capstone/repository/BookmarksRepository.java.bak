package com.startupsphere.capstone.repository;

import com.startupsphere.capstone.entity.Bookmarks;
import com.startupsphere.capstone.entity.Investor;
import com.startupsphere.capstone.entity.Startup;
import com.startupsphere.capstone.entity.User;
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

public interface BookmarksRepository extends JpaRepository<Bookmarks, Long> {
        Page<Bookmarks> findByUser(User user, Pageable pageable);
        List<Bookmarks> findByUser(User user);

        Page<Bookmarks> findByStartup(Startup startup, Pageable pageable);
        List<Bookmarks> findByStartup(Startup startup);

        @Modifying
        @Query("DELETE FROM Bookmarks b WHERE b.startup = :startup")
        void deleteByStartup(@Param("startup") Startup startup);

        @Modifying
        @Transactional
        @Query("DELETE FROM Bookmarks b WHERE b.startup.id = :startupId")
        void deleteByStartupId(@Param("startupId") Long startupId);

        Optional<Bookmarks> findByUserAndStartupAndInvestor(User user, Startup startup, Investor investor);

        long countByStartup_Id(Long startupId);

        @Query("SELECT MONTH(b.timestamp) AS month, COUNT(b) AS count " +
                        "FROM Bookmarks b " +
                        "WHERE b.startup.id = :startupId " +
                        "GROUP BY MONTH(b.timestamp) " +
                        "ORDER BY MONTH(b.timestamp)")
        List<Object[]> countBookmarksGroupedByMonthForStartup(@Param("startupId") Long startupId);

        @Query("SELECT COUNT(b) FROM Bookmarks b WHERE b.startup.user.id = :userId")
        long countBookmarksByStartupOwner(@Param("userId") Integer userId);

        @Query("SELECT MONTH(b.timestamp) AS month, COUNT(b) AS count " +
                        "FROM Bookmarks b " +
                        "WHERE b.startup.user.id = :userId " +
                        "GROUP BY MONTH(b.timestamp) " +
                        "ORDER BY MONTH(b.timestamp)")
        List<Object[]> countBookmarksGroupedByMonthForUserOwnedStartups(@Param("userId") Integer userId);
}