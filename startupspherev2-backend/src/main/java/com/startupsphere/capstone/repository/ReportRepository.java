package com.startupsphere.capstone.repository;

import com.startupsphere.capstone.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report, Integer> {
}
