package com.startupsphere.capstone.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.startupsphere.capstone.entity.Investor;

@Repository
public interface InvestorRepository extends JpaRepository<Investor, Integer> {
    @Query("SELECT i FROM Investor i WHERE " +
           "LOWER(i.firstname) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(i.lastname) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(i.biography) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(i.locationName) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Investor> searchAllFields(@Param("query") String query, Pageable pageable);

    @Query("SELECT i FROM Investor i WHERE " +
           "LOWER(i.firstname) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(i.lastname) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(i.biography) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(i.locationName) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Investor> searchAllFields(@Param("query") String query);

    @Query("SELECT i FROM Investor i WHERE i.user_id.id = :userId")
    Optional<Investor> findByUserId(@Param("userId") Integer userId);
}
