package com.startupsphere.capstone.controller;

import com.startupsphere.capstone.entity.Stakeholder;
import com.startupsphere.capstone.service.StakeholderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/stakeholders")
public class StakeholderController {

    private final StakeholderService service;

    @Autowired
    public StakeholderController(StakeholderService service) {
        this.service = service;
    }

    @GetMapping
    public List<Stakeholder> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Stakeholder> getById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Stakeholder stakeholder) {
        try {
            Optional<Stakeholder> existingStakeholder = service.findByEmail(stakeholder.getEmail());
            if (existingStakeholder.isPresent()) {
                return ResponseEntity
                        .status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "Email already exists",
                                "message", "A stakeholder with this email is already registered"));
            }
            Stakeholder savedStakeholder = service.save(stakeholder);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedStakeholder);
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create stakeholder",
                            "message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Stakeholder> updateStakeholder(@PathVariable Long id, @RequestBody Stakeholder stakeholder) {
        return service.updateStakeholder(id, stakeholder);
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