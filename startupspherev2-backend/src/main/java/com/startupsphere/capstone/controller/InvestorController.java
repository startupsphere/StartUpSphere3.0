package com.startupsphere.capstone.controller;

import com.startupsphere.capstone.entity.Investor;
import com.startupsphere.capstone.entity.Startup;
import com.startupsphere.capstone.entity.User;
import com.startupsphere.capstone.repository.InvestorRepository;
import com.startupsphere.capstone.service.InvestorService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/investors")
public class InvestorController {

    private final InvestorService investorService;
    private final InvestorRepository investorRepository; // Add this line

    // Modify the constructor to inject InvestorRepository as well
    @Autowired
    public InvestorController(InvestorService investorService, InvestorRepository investorRepository) {
        this.investorService = investorService;
        this.investorRepository = investorRepository; // Assign it in the constructor
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

    @GetMapping("/{id}")
    public ResponseEntity<Investor> getInvestorById(@PathVariable Integer id) {
        return ResponseEntity.ok(investorService.getInvestorById(id));
    }

    @PostMapping
    public ResponseEntity<Investor> createInvestor(@RequestBody Investor investor) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
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
}