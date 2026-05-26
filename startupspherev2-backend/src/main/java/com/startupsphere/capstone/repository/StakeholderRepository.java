package com.startupsphere.capstone.repository;

import com.startupsphere.capstone.entity.Stakeholder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StakeholderRepository extends JpaRepository<Stakeholder, Long> {
    Optional<Stakeholder> findByEmail(String email);

    @Query("SELECT s FROM Stakeholder s WHERE " +
            "LOWER(s.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(s.locationName) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Stakeholder> searchByFields(@Param("query") String query);
}