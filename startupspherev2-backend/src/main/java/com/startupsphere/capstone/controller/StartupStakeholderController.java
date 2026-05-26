package com.startupsphere.capstone.controller;

import com.startupsphere.capstone.dtos.StartupStakeholderRequest;
import com.startupsphere.capstone.entity.Stakeholder;
import com.startupsphere.capstone.entity.Startup;
import com.startupsphere.capstone.entity.StartupStakeholder;
import com.startupsphere.capstone.repository.StakeholderRepository;
import com.startupsphere.capstone.repository.StartupRepository;
import com.startupsphere.capstone.repository.StartupStakeholderRepository;
import com.startupsphere.capstone.responses.ApiResponse;
import com.startupsphere.capstone.service.StartupStakeholderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/startup-stakeholders")
public class StartupStakeholderController {

    private final StartupStakeholderService service;

    @Autowired
    StartupStakeholderRepository repository;

    @Autowired
    public StartupStakeholderController(StartupStakeholderService service) {
        this.service = service;
    }

    @GetMapping
    public List<StartupStakeholder> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<StartupStakeholder> getById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/startup/{startupId}/stakeholders")
    public List<com.startupsphere.capstone.dtos.StakeholderInfoDTO> getByStartupId(@PathVariable Long startupId) {
        return service.findStakeholderByStartupId(startupId);
    }

    @GetMapping("/stakeholder/{id}")
    public ResponseEntity<StartupStakeholder> getStartupStakeholderById(@PathVariable Long id) {
        return service.getStartupStakeholdersById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse> create(@RequestBody StartupStakeholderRequest request) {
        ApiResponse response = service.save(request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<StartupStakeholder> update(@PathVariable Long id, @RequestBody StartupStakeholderRequest request) {
        return service.updateStartupStakeholder(id, request);
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return service.findById(id)
                .map(stakeholder -> {
                    service.deleteById(id);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}