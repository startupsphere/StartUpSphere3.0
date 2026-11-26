package com.startupsphere.capstone.controller;

import com.startupsphere.capstone.dtos.InvestmentApplicationRequest;
import com.startupsphere.capstone.dtos.NotificationRequest;
import com.startupsphere.capstone.entity.Investor;
import com.startupsphere.capstone.entity.Notifications;
import com.startupsphere.capstone.entity.Startup;
import com.startupsphere.capstone.entity.User;
import com.startupsphere.capstone.repository.InvestorRepository;
import com.startupsphere.capstone.repository.StartupRepository;
import com.startupsphere.capstone.responses.ApiResponse;
import com.startupsphere.capstone.service.EmailService;
import com.startupsphere.capstone.service.InvestorService;
import com.startupsphere.capstone.service.NotificationService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/investors")
public class InvestorController {

    private final InvestorService investorService;
    private final InvestorRepository investorRepository;
    private final NotificationService notificationService;
    private final StartupRepository startupRepository;
    private final EmailService emailService;

    @Autowired
    public InvestorController(
            InvestorService investorService,
            InvestorRepository investorRepository,
            NotificationService notificationService,
            StartupRepository startupRepository,
            EmailService emailService) {
        this.investorService = investorService;
        this.investorRepository = investorRepository;
        this.notificationService = notificationService;
        this.startupRepository = startupRepository;
        this.emailService = emailService;
    }

    @GetMapping
    public ResponseEntity<Page<Investor>> getAllInvestors(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "investorId") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(investorService.getAllInvestors(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Investor>> searchInvestors(@RequestParam String query) {
        List<Investor> investors = investorService.searchInvestors(query);
        return ResponseEntity.ok(investors);
    }

    @GetMapping("/directory")
    public ResponseEntity<List<Investor>> getInvestorDirectory(@RequestParam(required = false) String query) {
        List<Investor> investors = (query != null && !query.isBlank())
                ? investorService.searchInvestors(query.trim())
                : investorService.getAllInvestors();

        List<Investor> activeInvestors = investors.stream()
                .filter(inv -> !inv.isDeleted() && !"Rejected".equalsIgnoreCase(inv.getStatus()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(activeInvestors);
    }

    @PostMapping("/{id}/apply-investment")
    public ResponseEntity<ApiResponse> applyForInvestment(
            @PathVariable Integer id,
            @RequestBody InvestmentApplicationRequest request) {
        try {
            Optional<Investor> optionalInvestor = investorRepository.findById(id);
            if (optionalInvestor.isEmpty() || optionalInvestor.get().isDeleted()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse(false, "Investor not found", null));
            }
            Investor investor = optionalInvestor.get();

            if (request.getStartupId() == null) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse(false, "Please select a startup to apply with.", null));
            }

            Optional<Startup> optionalStartup = startupRepository.findById(request.getStartupId());
            if (optionalStartup.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse(false, "Selected startup not found", null));
            }
            Startup startup = optionalStartup.get();

            User currentUser = null;
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof User) {
                currentUser = (User) auth.getPrincipal();
            }

            Notifications notification = notificationService.createInvestmentApplicationNotification(
                    investor, startup, request, currentUser);

            String investorFullName = ((investor.getFirstname() != null ? investor.getFirstname() : "") + " " +
                    (investor.getLastname() != null ? investor.getLastname() : "")).trim();
            String recipientEmail = investor.getEmailAddress();
            if ((recipientEmail == null || recipientEmail.isBlank()) && investor.getUserId() != null) {
                recipientEmail = investor.getUserId().getEmail();
            }

            if (recipientEmail != null && !recipientEmail.isBlank()) {
                final String targetEmail = recipientEmail;
                new Thread(() -> {
                    try {
                        emailService.sendInvestmentApplicationEmail(
                                targetEmail,
                                investorFullName,
                                startup.getCompanyName(),
                                request.getApplicantName(),
                                request.getApplicantEmail(),
                                request.getApplicantPhone(),
                                request.getFundingStage(),
                                request.getRequestedAmount(),
                                request.getEquityOrTerms(),
                                request.getPitchMessage()
                        );
                    } catch (Exception ignored) {
                    }
                }).start();
            }

            return ResponseEntity.ok(new ApiResponse(
                    true,
                    "Investment application submitted successfully! The investor has been notified.",
                    notification));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Failed to submit investment application: " + e.getMessage(), null));
        }
    }

    @PostMapping("/startup/{investorStartupId}/apply-investment")
    public ResponseEntity<ApiResponse> applyForStartupInvestor(
            @PathVariable Long investorStartupId,
            @RequestBody InvestmentApplicationRequest request) {
        try {
            Optional<Startup> optionalInvestorStartup = startupRepository.findById(investorStartupId);
            if (optionalInvestorStartup.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse(false, "Investor profile not found", null));
            }
            Startup investorStartup = optionalInvestorStartup.get();

            if (request.getStartupId() == null) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse(false, "Please select a startup to apply with.", null));
            }

            Optional<Startup> optionalApplicantStartup = startupRepository.findById(request.getStartupId());
            if (optionalApplicantStartup.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse(false, "Selected startup not found", null));
            }
            Startup applicantStartup = optionalApplicantStartup.get();

            User currentUser = null;
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof User) {
                currentUser = (User) auth.getPrincipal();
            }

            Investor proxyInvestor = new Investor();
            proxyInvestor.setUserId(investorStartup.getUser());
            proxyInvestor.setFirstname(investorStartup.getCompanyName());
            proxyInvestor.setLastname("");
            proxyInvestor.setEmailAddress(investorStartup.getContactEmail());

            Notifications notification = notificationService.createInvestmentApplicationNotification(
                    proxyInvestor, applicantStartup, request, currentUser);

            String recipientEmail = investorStartup.getContactEmail();
            if ((recipientEmail == null || recipientEmail.isBlank()) && investorStartup.getUser() != null) {
                recipientEmail = investorStartup.getUser().getEmail();
            }

            if (recipientEmail != null && !recipientEmail.isBlank()) {
                final String targetEmail = recipientEmail;
                new Thread(() -> {
                    try {
                        emailService.sendInvestmentApplicationEmail(
                                targetEmail,
                                investorStartup.getCompanyName(),
                                applicantStartup.getCompanyName(),
                                request.getApplicantName(),
                                request.getApplicantEmail(),
                                request.getApplicantPhone(),
                                request.getFundingStage(),
                                request.getRequestedAmount(),
                                request.getEquityOrTerms(),
                                request.getPitchMessage()
                        );
                    } catch (Exception ignored) {
                    }
                }).start();
            }

            return ResponseEntity.ok(new ApiResponse(
                    true,
                    "Investment application submitted successfully! The investor has been notified.",
                    notification));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Failed to submit investment application: " + e.getMessage(), null));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Investor> getInvestorById(@PathVariable Integer id) {
        return ResponseEntity.ok(investorService.getInvestorById(id));
    }

    @PostMapping
    public ResponseEntity<Investor> createInvestor(@RequestBody Investor investor) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof User)) {
            return ResponseEntity.status(401).build();
        }
        User currentUser = (User) auth.getPrincipal(); // Authenticated user from Spring Security

        investor.setUserId(currentUser); // Link investor to the current user

        return ResponseEntity.ok(investorService.createInvestor(investor));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Investor> updateInvestor(@PathVariable Integer id, @RequestBody Investor investor) {
        return ResponseEntity.ok(investorService.updateInvestor(id, investor));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteInvestor(@PathVariable Integer id) {
        investorService.deleteInvestor(id);
        return ResponseEntity.ok("Investor deleted successfully.");
    }

    @GetMapping("/{id}/views")
    public ResponseEntity<Integer> getViewsByInvestorId(@PathVariable Integer id) {
        Optional<Investor> optionalInvestor = investorRepository.findById(id);
        if (optionalInvestor.isPresent()) {
            Investor investor = optionalInvestor.get();
            return ResponseEntity.ok(investor.getViews());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/increment-views")
    public ResponseEntity<Integer> incrementViews(@PathVariable Integer id) {
        Optional<Investor> optionalInvestor = investorRepository.findById(id);
        if (optionalInvestor.isPresent()) {
            Investor investor = optionalInvestor.get();
            investor.setViews(investor.getViews() + 1);
            investorRepository.save(investor);
            return ResponseEntity.ok(investor.getViews());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<ApiResponse> approveInvestor(@PathVariable Integer id, @RequestBody(required = false) NotificationRequest request) {
        try {
            Investor investor = investorService.approveInvestor(id);
            String comments = request != null && request.getComments() != null ? request.getComments() : "";
            if (investor.getUserId() != null) {
                notificationService.createInvestorApprovalNotification(investor, "approved", comments);
            }
            return ResponseEntity.ok(new ApiResponse(true, "Investor approved successfully", investor));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse(false, "Error approving investor: " + e.getMessage(), null));
        }
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<ApiResponse> rejectInvestor(@PathVariable Integer id, @RequestBody(required = false) NotificationRequest request) {
        try {
            String comments = request != null && request.getComments() != null ? request.getComments() : "";
            Investor investor = investorService.rejectInvestor(id, comments);
            if (investor.getUserId() != null) {
                notificationService.createInvestorApprovalNotification(investor, "rejected", comments);
            }
            return ResponseEntity.ok(new ApiResponse(true, "Investor rejected successfully", investor));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse(false, "Error rejecting investor: " + e.getMessage(), null));
        }
    }

    @GetMapping("/submitted")
    public ResponseEntity<Page<Investor>> getSubmittedInvestors(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "investorId") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(investorService.getAllSubmittedInvestors(pageable));
    }
}