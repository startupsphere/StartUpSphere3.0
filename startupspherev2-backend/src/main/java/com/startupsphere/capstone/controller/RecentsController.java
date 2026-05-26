package com.startupsphere.capstone.controller;

import com.startupsphere.capstone.entity.Recents;
import com.startupsphere.capstone.entity.User;
import com.startupsphere.capstone.entity.Startup;
import com.startupsphere.capstone.entity.Stakeholder;
import com.startupsphere.capstone.service.RecentsService;
import com.startupsphere.capstone.repository.StartupRepository;
import com.startupsphere.capstone.repository.StakeholderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/recents")
public class RecentsController {
    @Autowired
    private RecentsService recentsService;
    @Autowired
    private StartupRepository startupRepository;
    @Autowired
    private StakeholderRepository stakeholderRepository;

    @PostMapping("/startup/{startupId}")
    public ResponseEntity<Recents> addRecentStartup(@PathVariable Long startupId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = (User) auth.getPrincipal();
        Optional<Startup> startupOpt = startupRepository.findById(startupId);
        if (startupOpt.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        Recents recent = recentsService.addRecentStartupView(user, startupOpt.get());
        return ResponseEntity.ok(recent);
    }

    @PostMapping("/stakeholder/{stakeholderId}")
    public ResponseEntity<Recents> addRecentStakeholder(@PathVariable Long stakeholderId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = (User) auth.getPrincipal();
        Optional<Stakeholder> stakeholderOpt = stakeholderRepository.findById(stakeholderId);
        if (stakeholderOpt.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        Recents recent = recentsService.addRecentStakeholderView(user, stakeholderOpt.get());
        return ResponseEntity.ok(recent);
    }

    @GetMapping
    public ResponseEntity<List<Recents>> getUserRecents() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = (User) auth.getPrincipal();
        List<Recents> recents = recentsService.getUserRecents(user);
        return ResponseEntity.ok(recents);
    }

    @GetMapping("/startups")
    public ResponseEntity<List<Recents>> getUserRecentStartups() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = (User) auth.getPrincipal();
        List<Recents> recents = recentsService.getUserRecentStartups(user);
        return ResponseEntity.ok(recents);
    }

    @GetMapping("/stakeholders")
    public ResponseEntity<List<Recents>> getUserRecentStakeholders() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = (User) auth.getPrincipal();
        List<Recents> recents = recentsService.getUserRecentStakeholders(user);
        return ResponseEntity.ok(recents);
    }
}
