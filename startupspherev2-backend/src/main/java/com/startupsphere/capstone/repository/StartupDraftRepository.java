package com.startupsphere.capstone.repository;

import com.startupsphere.capstone.entity.StartupDraft;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface StartupDraftRepository extends JpaRepository<StartupDraft, Long> {
    Optional<StartupDraft> findByUserId(Integer userId);
}