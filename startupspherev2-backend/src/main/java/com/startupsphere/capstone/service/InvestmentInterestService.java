package com.startupsphere.capstone.service;

import com.startupsphere.capstone.dtos.InvestmentInterestRequest;
import com.startupsphere.capstone.entity.InvestmentInterest;
import com.startupsphere.capstone.entity.Notifications;
import com.startupsphere.capstone.entity.Startup;
import com.startupsphere.capstone.entity.User;
import com.startupsphere.capstone.repository.InvestmentInterestRepository;
import com.startupsphere.capstone.repository.NotificationsRepository;
import com.startupsphere.capstone.repository.StartupRepository;
import com.startupsphere.capstone.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class InvestmentInterestService {

    private final InvestmentInterestRepository repository;
    private final NotificationsRepository notificationsRepository;
    private final StartupRepository startupRepository;
    private final UserRepository userRepository;

    @Autowired
    public InvestmentInterestService(InvestmentInterestRepository repository,
                                     NotificationsRepository notificationsRepository,
                                     StartupRepository startupRepository,
                                     UserRepository userRepository) {
        this.repository = repository;
        this.notificationsRepository = notificationsRepository;
        this.startupRepository = startupRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public InvestmentInterest createInterest(Startup startup, InvestmentInterestRequest request, User senderUser) {
        InvestmentInterest interest = new InvestmentInterest();
        interest.setStartup(startup);
        interest.setInvestorUser(senderUser);
        interest.setInvestorName(request.getInvestorName());
        interest.setInvestorEmail(request.getInvestorEmail());
        interest.setInvestorPhone(request.getInvestorPhone());
        interest.setInvestorType(request.getInvestorType());
        interest.setAmountRange(request.getAmountRange());
        interest.setProcessType(request.getProcessType());
        interest.setMessage(request.getMessage());
        interest.setStage("NEW_INQUIRY");
        return repository.save(interest);
    }

    @Transactional
    public List<InvestmentInterest> getInquiriesReceivedForUser(User user) {
        if (user == null || user.getId() == null) return List.of();
        String userEmail = user.getEmail() != null ? user.getEmail() : "";
        List<InvestmentInterest> list = repository.findByStartupOwnerIdOrEmail(user.getId(), userEmail);

        // Deduplicate records per startup and investor so only 1 best card remains
        java.util.Map<String, InvestmentInterest> uniqueDeals = new java.util.LinkedHashMap<>();
        for (InvestmentInterest item : list) {
            if (item.getStartup() != null && item.getStartup().getId() != null) {
                String key = item.getStartup().getId() + "-" + (item.getInvestorEmail() != null ? item.getInvestorEmail().toLowerCase() : item.getInvestorName());
                if (!uniqueDeals.containsKey(key)) {
                    uniqueDeals.put(key, item);
                } else {
                    InvestmentInterest currentBest = uniqueDeals.get(key);
                    if (isGenericFocus(currentBest.getProcessType()) && !isGenericFocus(item.getProcessType())) {
                        uniqueDeals.put(key, item);
                        repository.delete(currentBest);
                    } else {
                        repository.delete(item);
                    }
                }
            }
        }

        return new java.util.ArrayList<>(uniqueDeals.values());
    }

    private boolean isGenericFocus(String focus) {
        return focus == null || focus.isBlank() ||
               focus.equalsIgnoreCase("Direct Investment") ||
               focus.equalsIgnoreCase("Flexible / Discussion");
    }

    @Transactional
    public List<InvestmentInterest> getInvestmentsExpressedByInvestor(User user) {
        if (user == null) return List.of();
        String email = user.getEmail() != null ? user.getEmail() : "";
        Integer userId = user.getId() != null ? user.getId() : -1;
        List<InvestmentInterest> list = repository.findByInvestorUserIdOrEmail(userId, email);

        // Deduplicate records per startup so only 1 best card per startup remains
        java.util.Map<Long, InvestmentInterest> uniqueByStartup = new java.util.LinkedHashMap<>();
        for (InvestmentInterest item : list) {
            if (item.getStartup() != null && item.getStartup().getId() != null) {
                Long stId = item.getStartup().getId();
                if (!uniqueByStartup.containsKey(stId)) {
                    uniqueByStartup.put(stId, item);
                } else {
                    InvestmentInterest currentBest = uniqueByStartup.get(stId);
                    if (isGenericFocus(currentBest.getProcessType()) && !isGenericFocus(item.getProcessType())) {
                        uniqueByStartup.put(stId, item);
                        repository.delete(currentBest);
                    } else {
                        repository.delete(item);
                    }
                }
            }
        }

        return new java.util.ArrayList<>(uniqueByStartup.values());
    }

    @Transactional
    public InvestmentInterest createManualInquiry(
            Long startupId, User user, String investorName, String investorEmail, String investorPhone,
            String investorType, String amountRange, String processType, String stage, String message, String notes) {
        Startup startup = null;
        if (startupId != null) {
            startup = startupRepository.findById(startupId).orElse(null);
        }
        if (startup == null) {
            List<Startup> userStartups = startupRepository.findByUser_Id(user.getId());
            if (!userStartups.isEmpty()) {
                startup = userStartups.get(0);
            }
        }
        if (startup == null) {
            throw new IllegalArgumentException("No startup found to associate with this investment inquiry. Please register a startup first.");
        }

        InvestmentInterest interest = new InvestmentInterest();
        interest.setStartup(startup);
        interest.setInvestorUser(null);
        interest.setInvestorName(investorName != null && !investorName.isBlank() ? investorName : "Inbound Investor");
        interest.setInvestorEmail(investorEmail);
        interest.setInvestorPhone(investorPhone);
        interest.setInvestorType(investorType != null && !investorType.isBlank() ? investorType : "Angel / Venture Capital");
        interest.setAmountRange(amountRange != null && !amountRange.isBlank() ? amountRange : "Undisclosed");
        interest.setProcessType(processType != null && !processType.isBlank() ? processType : "Direct Investment");
        interest.setStage(stage != null && !stage.isBlank() ? stage.trim().toUpperCase() : "NEW_INQUIRY");
        interest.setMessage(message);
        interest.setNotes(notes);
        return repository.save(interest);
    }

    @Transactional
    public InvestmentInterest updateStage(Long id, String stage, String notes, User updatedByUser) {
        Optional<InvestmentInterest> opt = repository.findById(id);
        if (opt.isEmpty()) {
            throw new IllegalArgumentException("Investment interest not found with ID: " + id);
        }
        InvestmentInterest interest = opt.get();
        String oldStage = interest.getStage();
        String newStage = stage != null && !stage.isBlank() ? stage.trim().toUpperCase() : oldStage;

        interest.setStage(newStage);

        // Build structured audit entry
        String updaterName = "User";
        String updaterRole = "Participant";
        if (updatedByUser != null) {
            String fullName = ((updatedByUser.getFirstname() != null ? updatedByUser.getFirstname() : "") + " " +
                               (updatedByUser.getLastname() != null ? updatedByUser.getLastname() : "")).trim();
            updaterName = !fullName.isBlank() ? fullName : updatedByUser.getUsername();
            if (interest.getStartup() != null && interest.getStartup().getUser() != null &&
                updatedByUser.getId().equals(interest.getStartup().getUser().getId())) {
                updaterRole = "Founder";
            } else {
                updaterRole = "Investor";
            }
        }

        String timestamp = java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm")
                .format(java.time.LocalDateTime.now());
        StringBuilder auditLog = new StringBuilder();
        if (interest.getNotes() != null && !interest.getNotes().isBlank()) {
            auditLog.append(interest.getNotes()).append("\n\n");
        }
        auditLog.append("[").append(timestamp).append("] ")
                .append(updaterName).append(" (").append(updaterRole).append(")")
                .append(" moved stage from ").append(oldStage).append(" ➔ ").append(newStage);

        if (notes != null && !notes.isBlank()) {
            auditLog.append("\nNote: ").append(notes.trim());
        }

        interest.setNotes(auditLog.toString());

        // Accurate fund disbursement logic: prevents double counting or cumulative drift
        boolean wasClosed = "CLOSED_DEAL".equalsIgnoreCase(oldStage);
        boolean isNowClosed = "CLOSED_DEAL".equalsIgnoreCase(newStage);

        // 1. Moving INTO CLOSED_DEAL: Disburse funds only if not already disbursed
        if (isNowClosed && !Boolean.TRUE.equals(interest.getFundDisbursed())) {
            Startup startup = interest.getStartup();
            if (startup != null) {
                Double parsedFund = parseFundingAmount(interest.getAmountRange());
                if (parsedFund == null || parsedFund <= 0) {
                    parsedFund = parseFundingAmount(interest.getMessage());
                }
                if (parsedFund != null && parsedFund > 0) {
                    double currentFund = startup.getTotalStartupFundingReceived();
                    startup.setTotalStartupFundingReceived(currentFund + parsedFund);
                    int rounds = startup.getNumberOfFundingRounds();
                    startup.setNumberOfFundingRounds(rounds + 1);
                    startupRepository.save(startup);
                    interest.setFundDisbursed(true);
                }
            }
        }
        // 2. Moving OUT of CLOSED_DEAL (e.g. back to negotiation or passed): Rollback funds
        else if (!isNowClosed && Boolean.TRUE.equals(interest.getFundDisbursed())) {
            Startup startup = interest.getStartup();
            if (startup != null) {
                Double parsedFund = parseFundingAmount(interest.getAmountRange());
                if (parsedFund == null || parsedFund <= 0) {
                    parsedFund = parseFundingAmount(interest.getMessage());
                }
                if (parsedFund != null && parsedFund > 0) {
                    double currentFund = startup.getTotalStartupFundingReceived();
                    startup.setTotalStartupFundingReceived(Math.max(0.0, currentFund - parsedFund));
                    int rounds = startup.getNumberOfFundingRounds();
                    startup.setNumberOfFundingRounds(Math.max(0, rounds - 1));
                    startupRepository.save(startup);
                    interest.setFundDisbursed(false);
                }
            }
        }

        InvestmentInterest saved = repository.save(interest);

        // Notify the partner party about the stage change
        try {
            Startup startup = saved.getStartup();
            String companyName = startup != null ? startup.getCompanyName() : "The venture";
            if ("Founder".equals(updaterRole)) {
                User investor = saved.getInvestorUser();
                if (investor == null && saved.getInvestorEmail() != null) {
                    investor = userRepository.findFirstByEmailIgnoreCase(saved.getInvestorEmail()).orElse(null);
                }
                if (investor != null && startup != null) {
                    Notifications partnerNotif = new Notifications();
                    partnerNotif.setUser(investor);
                    partnerNotif.setStartup(startup);
                    partnerNotif.setRemarks(String.format("Pipeline Update: %s moved deal to '%s'", companyName, newStage));
                    partnerNotif.setComments(String.format("The founder of %s progressed your investment discussion to '%s'.%s",
                            companyName, newStage, (notes != null && !notes.isBlank() ? "\nNote: " + notes.trim() : "")));
                    notificationsRepository.save(partnerNotif);
                }
            } else {
                if (startup != null && startup.getUser() != null) {
                    Notifications partnerNotif = new Notifications();
                    partnerNotif.setUser(startup.getUser());
                    partnerNotif.setStartup(startup);
                    partnerNotif.setRemarks(String.format("Pipeline Update: %s moved deal to '%s'", updaterName, newStage));
                    partnerNotif.setComments(String.format("Investor %s progressed the deal for '%s' to '%s'.%s",
                            updaterName, companyName, newStage, (notes != null && !notes.isBlank() ? "\nNote: " + notes.trim() : "")));
                    notificationsRepository.save(partnerNotif);
                }
            }
        } catch (Exception ignored) {}

        return saved;
    }

    private Double parseFundingAmount(String str) {
        if (str == null || str.isBlank()) return null;
        try {
            String cleaned = str.replaceAll("[^0-9.]", "").trim();
            if (!cleaned.isEmpty()) {
                return Double.parseDouble(cleaned);
            }
        } catch (Exception ignored) {}
        return null;
    }
}
