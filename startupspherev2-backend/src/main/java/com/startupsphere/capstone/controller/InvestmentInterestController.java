package com.startupsphere.capstone.controller;

import com.startupsphere.capstone.entity.InvestmentInterest;
import com.startupsphere.capstone.entity.User;
import com.startupsphere.capstone.responses.ApiResponse;
import com.startupsphere.capstone.service.InvestmentInterestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/investments")
public class InvestmentInterestController {

    private final InvestmentInterestService service;

    @Autowired
    public InvestmentInterestController(InvestmentInterestService service) {
        this.service = service;
    }

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof User) {
            return (User) auth.getPrincipal();
        }
        return null;
    }

    @GetMapping("/received")
    public ResponseEntity<ApiResponse> getReceivedInquiries() {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse(false, "Authentication required", null));
        }
        List<InvestmentInterest> list = service.getInquiriesReceivedForUser(user);
        return ResponseEntity.ok(new ApiResponse(true, "Investment inquiries retrieved successfully", list));
    }

    @GetMapping("/my-investments")
    public ResponseEntity<ApiResponse> getMyInvestments() {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse(false, "Authentication required", null));
        }
        List<InvestmentInterest> list = service.getInvestmentsExpressedByInvestor(user);
        return ResponseEntity.ok(new ApiResponse(true, "Investor portfolio deals retrieved successfully", list));
    }

    @PostMapping("/create")
    public ResponseEntity<ApiResponse> createInquiry(@RequestBody Map<String, Object> payload) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse(false, "Authentication required", null));
        }
        try {
            Long startupId = payload.get("startupId") != null && !payload.get("startupId").toString().isBlank()
                    ? Long.valueOf(payload.get("startupId").toString())
                    : null;
            String investorName = (String) payload.get("investorName");
            String investorEmail = (String) payload.get("investorEmail");
            String investorPhone = (String) payload.get("investorPhone");
            String investorType = (String) payload.get("investorType");
            String amountRange = (String) payload.get("amountRange");
            String processType = (String) payload.get("processType");
            String stage = (String) payload.get("stage");
            String message = (String) payload.get("message");
            String notes = (String) payload.get("notes");

            InvestmentInterest saved = service.createManualInquiry(
                    startupId, user, investorName, investorEmail, investorPhone,
                    investorType, amountRange, processType, stage, message, notes
            );
            return ResponseEntity.ok(new ApiResponse(true, "Investment inquiry logged successfully", saved));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse(false, e.getMessage(), null));
        }
    }

    @PutMapping("/{id}/stage")
    public ResponseEntity<ApiResponse> updateDealStage(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse(false, "Authentication required", null));
        }
        try {
            String stage = payload.get("stage");
            String notes = payload.get("notes");
            InvestmentInterest updated = service.updateStage(id, stage, notes, user);
            return ResponseEntity.ok(new ApiResponse(true, "Deal Flow stage updated successfully", updated));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
}
