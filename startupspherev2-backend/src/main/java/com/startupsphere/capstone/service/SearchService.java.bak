package com.startupsphere.capstone.service;

import com.startupsphere.capstone.dtos.SearchResultsDTO;
import com.startupsphere.capstone.dtos.StakeholderDTO;
import com.startupsphere.capstone.dtos.StartupDTO;
import com.startupsphere.capstone.entity.Stakeholder;
import com.startupsphere.capstone.entity.Startup;
import com.startupsphere.capstone.entity.StartupStakeholder;
import com.startupsphere.capstone.repository.StakeholderRepository;
import com.startupsphere.capstone.repository.StartupRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.Cacheable;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class SearchService {

    private final StartupRepository startupRepository;
    private final StakeholderRepository stakeholderRepository;

    public SearchService(StartupRepository startupRepository, StakeholderRepository stakeholderRepository) {
        this.startupRepository = startupRepository;
        this.stakeholderRepository = stakeholderRepository;
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "searchStartups", key = "#query")
    public SearchResultsDTO search(String query) {
        // Get direct search results
        List<Startup> directStartups = startupRepository.searchByFields(query);
        List<Stakeholder> directStakeholders = stakeholderRepository.searchByFields(query);

        // Collect all startups (direct + associated)
        Set<Startup> allStartups = new HashSet<>(directStartups);
        directStakeholders.forEach(stakeholder ->
                stakeholder.getStartupStakeholders().forEach(ss ->
                        allStartups.add(ss.getStartup())
                )
        );

        // Collect all stakeholders (direct + associated)
        Set<Stakeholder> allStakeholders = new HashSet<>(directStakeholders);
        directStartups.forEach(startup ->
                startup.getStartupStakeholders().forEach(ss ->
                        allStakeholders.add(ss.getStakeholder())
                )
        );

        // Convert to DTOs without nested associations
        List<StartupDTO> startupDTOs = allStartups.stream()
                .map(startup -> {
                    StartupDTO dto = new StartupDTO();
                    dto.setId(startup.getId());
                    dto.setCompanyName(startup.getCompanyName());
                    dto.setCompanyDescription(startup.getCompanyDescription());
                    dto.setFoundedDate(startup.getFoundedDate());
                    dto.setTypeOfCompany(startup.getTypeOfCompany());
                    dto.setNumberOfEmployees(startup.getNumberOfEmployees());
                    dto.setPhoneNumber(startup.getPhoneNumber());
                    dto.setContactEmail(startup.getContactEmail());
                    dto.setStreetAddress(startup.getStreetAddress());
                    dto.setCity(startup.getCity());
                    dto.setProvince(startup.getProvince());
                    dto.setRegion(startup.getRegion());
                    dto.setBarangay(startup.getBarangay());
                    dto.setPostalCode(startup.getPostalCode());
                    dto.setIndustry(startup.getIndustry());
                    dto.setWebsite(startup.getWebsite());
                    dto.setFacebook(startup.getFacebook());
                    dto.setTwitter(startup.getTwitter());
                    dto.setInstagram(startup.getInstagram());
                    dto.setLinkedIn(startup.getLinkedIn());
                    dto.setLocationLat(startup.getLocationLat());
                    dto.setLocationLng(startup.getLocationLng());
                    dto.setLocationName(startup.getLocationName());
                    dto.setStatus(startup.getStatus());
                    dto.setRevenue(startup.getRevenue());
                    dto.setAnnualRevenue(startup.getAnnualRevenue());
                    dto.setPaidUpCapital(startup.getPaidUpCapital());
                    dto.setFundingStage(startup.getFundingStage());
                    dto.setViewsCount(startup.getViewsCount());
                    dto.setEmailVerified(startup.getEmailVerified());
                    dto.setCreatedAt(startup.getCreatedAt());
                    dto.setLastUpdated(startup.getLastUpdated());
                    return dto;
                })
                .collect(Collectors.toList());

        List<StakeholderDTO> stakeholderDTOs = allStakeholders.stream()
                .map(stakeholder -> {
                    StakeholderDTO dto = new StakeholderDTO();
                    dto.setId(stakeholder.getId());
                    dto.setName(stakeholder.getName());
                    dto.setEmail(stakeholder.getEmail());
                    dto.setPhoneNumber(stakeholder.getPhoneNumber());
                    dto.setRegion(stakeholder.getRegion());
                    dto.setRegionCode(stakeholder.getRegionCode());
                    dto.setProvince(stakeholder.getProvince());
                    dto.setProvinceCode(stakeholder.getProvinceCode());
                    dto.setCity(stakeholder.getCity());
                    dto.setCityCode(stakeholder.getCityCode());
                    dto.setBarangay(stakeholder.getBarangay());
                    dto.setBarangayCode(stakeholder.getBarangayCode());
                    dto.setStreet(stakeholder.getStreet());
                    dto.setPostalCode(stakeholder.getPostalCode());
                    dto.setFacebook(stakeholder.getFacebook());
                    dto.setLinkedIn(stakeholder.getLinkedIn());
                    dto.setLocationLat(stakeholder.getLocationLat());
                    dto.setLocationLng(stakeholder.getLocationLng());
                    dto.setLocationName(stakeholder.getLocationName());
                    dto.setCreatedAt(stakeholder.getCreatedAt());
                    dto.setLastUpdated(stakeholder.getLastUpdated());
                    return dto;
                })
                .collect(Collectors.toList());

        return new SearchResultsDTO(startupDTOs, stakeholderDTOs);
    }

    private StartupDTO convertToStartupDTO(Startup startup) {
        return new StartupDTO(startup);
    }

    private StakeholderDTO convertToStakeholderDTO(Stakeholder stakeholder) {
        return new StakeholderDTO(stakeholder);
    }
}