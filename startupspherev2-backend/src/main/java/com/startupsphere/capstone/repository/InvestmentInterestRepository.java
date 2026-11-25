package com.startupsphere.capstone.repository;

import com.startupsphere.capstone.entity.InvestmentInterest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvestmentInterestRepository extends JpaRepository<InvestmentInterest, Long> {

    @Query("SELECT i FROM InvestmentInterest i WHERE (i.startup.user.id = :userId OR (i.startup.user.email IS NOT NULL AND LOWER(i.startup.user.email) = LOWER(:email)) OR (i.startup.contactEmail IS NOT NULL AND LOWER(i.startup.contactEmail) = LOWER(:email))) ORDER BY i.createdAt DESC")
    List<InvestmentInterest> findByStartupOwnerIdOrEmail(@Param("userId") Integer userId, @Param("email") String email);

    @Query("SELECT i FROM InvestmentInterest i WHERE (i.investorUser.id = :userId OR (i.investorEmail IS NOT NULL AND LOWER(i.investorEmail) = LOWER(:email))) ORDER BY i.createdAt DESC")
    List<InvestmentInterest> findByInvestorUserIdOrEmail(@Param("userId") Integer userId, @Param("email") String email);

    List<InvestmentInterest> findByStartup_IdOrderByCreatedAtDesc(Long startupId);
}
