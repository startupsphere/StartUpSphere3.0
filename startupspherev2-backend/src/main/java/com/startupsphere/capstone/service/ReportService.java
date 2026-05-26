package com.startupsphere.capstone.service;

import com.startupsphere.capstone.dtos.ReportDto;
import com.startupsphere.capstone.entity.Report;
import com.startupsphere.capstone.entity.User;
import com.startupsphere.capstone.repository.ReportRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

import java.util.ArrayList;
import java.util.List;

@Service
public class ReportService {

    private final ReportRepository reportRepository;

    public ReportService(ReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    @CacheEvict(value = "reports", allEntries = true)
    public Report createReport(ReportDto dto, User user) {
        Report report = new Report();
        report.setName(dto.getName());
        report.setContent(dto.getContent());
        report.setTimestamp(dto.getTimestamp());
        report.setUserId(user);

        return reportRepository.save(report);
    }

    @Cacheable(value = "reports", key = "#pageable.pageNumber + '-' + #pageable.pageSize + '-' + #pageable.sort.toString()")
    public Page<Report> getAllReports(Pageable pageable) {
        return reportRepository.findAll(pageable);
    }

    public List<Report> getAllReports() {
        List<Report> reports = new ArrayList<>();
        reportRepository.findAll().forEach(reports::add);
        return reports;
    }

    @CacheEvict(value = "reports", allEntries = true)
    public Report updateReport(Integer reportId, ReportDto dto, User currentUser) {
        Report existing = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));
    
        // Make sure the report belongs to the current user
        if (!existing.getUserId().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Unauthorized to update this report");
        }
    
        existing.setName(dto.getName());
        existing.setContent(dto.getContent());
        existing.setTimestamp(dto.getTimestamp());
    
        return reportRepository.save(existing);
    }
    
}
