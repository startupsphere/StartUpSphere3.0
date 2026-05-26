package com.startupsphere.capstone.repository;

import com.startupsphere.capstone.entity.Startup;
import com.startupsphere.capstone.entity.User;
import com.startupsphere.capstone.entity.Views;

import jakarta.transaction.Transactional;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ViewsRepository extends JpaRepository<Views, Long> {
        boolean existsByUserAndStartup(User user, Startup startup);

        Page<Views> findByStartup(Startup startup, Pageable pageable);
        List<Views> findByStartup(Startup startup);

        @Modifying
        @Query("DELETE FROM Views v WHERE v.startup = :startup")
        void deleteByStartup(@Param("startup") Startup startup);

        @Modifying
        @Query("DELETE FROM Views v WHERE v.startup.id = :startupId")
        void deleteByStartupId(@Param("startupId") Long startupId);

        @Query("SELECT FUNCTION('MONTH', v.timestamp) AS month, COUNT(v) AS count " +
                        "FROM Views v WHERE v.startup.id = :startupId " +
                        "GROUP BY FUNCTION('MONTH', v.timestamp) " +
                        "ORDER BY month")
        List<Object[]> countViewsByMonthAndStartup(@Param("startupId") Long startupId);

        @Query("SELECT COUNT(v) FROM Views v WHERE v.startup.user.id = :userId")
        long countViewsByStartupOwner(@Param("userId") Integer userId);

        @Query("SELECT MONTH(v.timestamp) AS month, COUNT(v) AS count " +
                        "FROM Views v " +
                        "WHERE v.startup.user.id = :userId " +
                        "GROUP BY MONTH(v.timestamp) " +
                        "ORDER BY MONTH(v.timestamp)")
        List<Object[]> countViewsGroupedByMonthForUserOwnedStartups(@Param("userId") Integer userId);
}