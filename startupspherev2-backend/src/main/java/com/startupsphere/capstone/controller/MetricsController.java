package com.startupsphere.capstone.controller;

import com.startupsphere.capstone.repository.StartupRepository;
import com.startupsphere.capstone.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/metrics")
public class MetricsController {

    @Autowired
    private StartupRepository startupRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardMetrics() {
        long totalStartups = startupRepository.count();
        long totalSupport = userRepository.countByRole("ROLE_SUPPORT");
        long totalHei = userRepository.countByRole("ROLE_HEI");
        long totalGov = userRepository.countByRole("ROLE_GOVERNMENT");
        long totalResearch = userRepository.countByRole("ROLE_RESEARCH");
        long totalSme = userRepository.countByRole("ROLE_SME");

        long totalSupportEntities = totalSupport + totalHei + totalGov + totalResearch;

        // IDI: Innovation Density Index = Startups + Innovation Actors (simplified)
        double idi = totalStartups + totalSme;

        // SI: Support Index = Support + HEI + Gov + Research
        double si = totalSupportEntities;

        // EBS: Ecosystem Balance Score = (Startups) / (Support Entities)
        double ebs = 0;
        if (totalSupportEntities > 0) {
            ebs = (double) totalStartups / totalSupportEntities;
            ebs = Math.round(ebs * 100.0) / 100.0;
        }

        // EGS: Ecosystem Gap Score = 1 / EBS (or some imbalance indicator)
        double egs = 0;
        if (totalStartups > 0) {
            egs = (double) totalSupportEntities / totalStartups;
            egs = Math.round(egs * 100.0) / 100.0;
        }

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("idi", idi);
        metrics.put("si", si);
        metrics.put("ebs", ebs);
        metrics.put("egs", egs);
        metrics.put("totalStartups", totalStartups);
        metrics.put("totalSmes", totalSme);
        metrics.put("totalSupport", totalSupport);
        metrics.put("totalHei", totalHei);
        metrics.put("totalGov", totalGov);
        metrics.put("totalResearch", totalResearch);
        metrics.put("totalSupportEntities", totalSupportEntities);

        return ResponseEntity.ok(metrics);
    }
}
