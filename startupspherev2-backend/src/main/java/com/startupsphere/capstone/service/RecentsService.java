package com.startupsphere.capstone.service;

import com.startupsphere.capstone.entity.Recents;
import com.startupsphere.capstone.entity.User;
import com.startupsphere.capstone.entity.Startup;
import com.startupsphere.capstone.entity.Stakeholder;
import com.startupsphere.capstone.repository.RecentsRepository;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RecentsService {
    @Autowired
    private RecentsRepository recentsRepository;

    public Recents addRecentStartupView(User user, Startup startup) {
        Recents existing = recentsRepository.findByUserAndStartup(user, startup);
        if (existing != null) {
            existing.setViewedAt(LocalDateTime.now());
            return recentsRepository.save(existing);
        }
        Recents recent = new Recents(user, startup, null, LocalDateTime.now());
        return recentsRepository.save(recent);
    }

    public Recents addRecentStakeholderView(User user, Stakeholder stakeholder) {
        Recents existing = recentsRepository.findByUserAndStakeholder(user, stakeholder);
        if (existing != null) {
            existing.setViewedAt(LocalDateTime.now());
            return recentsRepository.save(existing);
        }
        Recents recent = new Recents(user, null, stakeholder, LocalDateTime.now());
        return recentsRepository.save(recent);
    }

    public List<Recents> getUserRecents(User user) {
        return recentsRepository.findByUserOrderByViewedAtDesc(user);
    }

    public List<Recents> getUserRecentStartups(User user) {
        return recentsRepository.findByUserAndStartupIsNotNullOrderByViewedAtDesc(user);
    }

    public List<Recents> getUserRecentStakeholders(User user) {
        return recentsRepository.findByUserAndStakeholderIsNotNullOrderByViewedAtDesc(user);
    }
}
