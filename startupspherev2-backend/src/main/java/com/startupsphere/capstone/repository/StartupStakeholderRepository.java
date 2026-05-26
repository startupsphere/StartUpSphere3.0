package com.startupsphere.capstone.repository;

import com.startupsphere.capstone.entity.Stakeholder;
import com.startupsphere.capstone.entity.StartupStakeholder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StartupStakeholderRepository extends JpaRepository<StartupStakeholder, Long> {
    List<StartupStakeholder> findByStartupId(Long startupId);

    @Query("SELECT new com.startupsphere.capstone.dtos.StakeholderInfoDTO(ss.id, ss.stakeholder, ss.role, ss.status, ss.dateJoined, ss.isConnected) FROM StartupStakeholder ss WHERE ss.startup.id = :startupId")
    List<com.startupsphere.capstone.dtos.StakeholderInfoDTO> findStakeholderInfoByStartupId(@Param("startupId") Long startupId);
}