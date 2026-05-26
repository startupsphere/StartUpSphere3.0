package com.startupsphere.capstone.repository;

import com.startupsphere.capstone.entity.Recents;
import com.startupsphere.capstone.entity.User;
import com.startupsphere.capstone.entity.Startup;
import com.startupsphere.capstone.entity.Stakeholder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RecentsRepository extends JpaRepository<Recents, Long> {
    List<Recents> findByUserOrderByViewedAtDesc(User user);
    List<Recents> findByUserAndStartupIsNotNullOrderByViewedAtDesc(User user);
    List<Recents> findByUserAndStakeholderIsNotNullOrderByViewedAtDesc(User user);
    Recents findByUserAndStartup(User user, Startup startup);
    Recents findByUserAndStakeholder(User user, Stakeholder stakeholder);
}
