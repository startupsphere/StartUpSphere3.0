package com.startupsphere.capstone.service;

import com.startupsphere.capstone.dtos.StartupStakeholderRequest;
import com.startupsphere.capstone.entity.Stakeholder;
import com.startupsphere.capstone.entity.Startup;
import com.startupsphere.capstone.entity.StartupStakeholder;
import com.startupsphere.capstone.repository.StakeholderRepository;
import com.startupsphere.capstone.repository.StartupRepository;
import com.startupsphere.capstone.repository.StartupStakeholderRepository;
import com.startupsphere.capstone.responses.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class StartupStakeholderService {

    private final StartupStakeholderRepository repository;

    @Autowired
    StartupRepository srepo;

    @Autowired
    StakeholderRepository strepo;

    @Autowired
    public StartupStakeholderService(StartupStakeholderRepository repository) {
        this.repository = repository;
    }

    public List<StartupStakeholder> findAll() {
        return repository.findAll();
    }

    public Optional<StartupStakeholder> findById(Long id) {
        return repository.findById(id);
    }

    public ApiResponse save(StartupStakeholderRequest request) {
        // Validate startup exists
        Startup startup = srepo.findById(request.getStartupId())
                .orElse(null);
        if (startup == null) {
            return new ApiResponse(false, "Startup not found with ID: " + request.getStartupId(), null);
        }
        
        // Validate stakeholder exists
        Stakeholder stakeholder = strepo.findById(request.getStakeholderId())
                .orElse(null);
        if (stakeholder == null) {
            return new ApiResponse(false, "Stakeholder not found with ID: " + request.getStakeholderId(), null);
        }
        
        // Check for duplicate stakeholder in the startup
        List<StartupStakeholder> existingStakeholders = repository.findByStartupId(request.getStartupId());
        boolean isDuplicate = existingStakeholders.stream()
                .anyMatch(ss -> ss.getStakeholder().getId().equals(request.getStakeholderId()));
        
        if (isDuplicate) {
            return new ApiResponse(false, "This stakeholder has already been added to this startup", null);
        }
        
        // Create and save new startup-stakeholder relationship
        StartupStakeholder startupStakeholder = new StartupStakeholder();
        startupStakeholder.setStartup(startup);
        startupStakeholder.setStakeholder(stakeholder);
        startupStakeholder.setRole(request.getRole());
        startupStakeholder.setStatus(request.getStatus());
        startupStakeholder.setConnected(true); // Default to connected when created
        StartupStakeholder saved = repository.save(startupStakeholder);
        
        return new ApiResponse(true, "Stakeholder successfully added to startup", saved);
    }

    @Transactional
    public ResponseEntity<StartupStakeholder> updateStartupStakeholder(Long id, StartupStakeholderRequest request) {
        return repository.findById(id)
                .map(existing -> {
                    // Update stakeholder if changed
                    if (request.getStakeholderId() != null && !request.getStakeholderId().equals(existing.getStakeholder().getId())) {
                        Stakeholder stakeholder = strepo.findById(request.getStakeholderId())
                                .orElseThrow(() -> new IllegalArgumentException("Stakeholder not found"));
                        existing.setStakeholder(stakeholder);
                    }

                    // Update startup if changed
                    if (request.getStartupId() != null && !request.getStartupId().equals(existing.getStartup().getId())) {
                        Startup startup = srepo.findById(request.getStartupId())
                                .orElseThrow(() -> new IllegalArgumentException("Startup not found"));
                        existing.setStartup(startup);
                    }

                    // Update other fields
                    existing.setRole(request.getRole());
                    existing.setStatus(request.getStatus());
                    existing.setConnected(request.isConnected());
                    return ResponseEntity.ok(repository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }

    public List<StartupStakeholder> findByStartupId(Long startupId) {
        return repository.findByStartupId(startupId);
    }

    public List<com.startupsphere.capstone.dtos.StakeholderInfoDTO> findStakeholderByStartupId(Long startupId){
        return repository.findStakeholderInfoByStartupId(startupId);
    }

    public Optional<StartupStakeholder> getStartupStakeholdersById(Long id){
        return repository.findById(id);
    }
}