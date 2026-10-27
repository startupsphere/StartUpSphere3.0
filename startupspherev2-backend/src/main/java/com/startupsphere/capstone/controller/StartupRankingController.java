package com.startupsphere.capstone.controller;

import com.startupsphere.capstone.entity.Startup;
import com.startupsphere.capstone.repository.StartupRepository;
import com.startupsphere.capstone.service.StartupRankingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rankings")
public class StartupRankingController {

    @Autowired
    private StartupRepository startupRepository;

    @Autowired
    private StartupRankingService rankingService;

    private List<Startup> filterAndRankStartups(List<Startup> startups, String industry, String govReg, String trl, String metric) {
        List<Startup> filtered = startups.stream()
                .filter(startup -> "Approved".equalsIgnoreCase(startup.getStatus()))
                .filter(startup -> {
                    if (industry == null || industry.trim().isEmpty() || "All".equalsIgnoreCase(industry.trim())) {
                        return true;
                    }
                    return industry.equalsIgnoreCase(startup.getIndustry());
                })
                .filter(startup -> {
                    if (govReg == null || govReg.trim().isEmpty() || "All".equalsIgnoreCase(govReg.trim())) {
                        return true;
                    }
                    String regAgency = startup.getRegistrationAgency() != null ? startup.getRegistrationAgency().trim() : "";
                    Boolean isGovReg = startup.getIsGovernmentRegistered();

                    if ("BIR".equalsIgnoreCase(govReg)) {
                        return "BIR".equalsIgnoreCase(regAgency);
                    } else if ("SEC".equalsIgnoreCase(govReg)) {
                        return "SEC".equalsIgnoreCase(regAgency);
                    } else if ("DTI".equalsIgnoreCase(govReg)) {
                        return "DTI".equalsIgnoreCase(regAgency);
                    } else if ("REGISTERED".equalsIgnoreCase(govReg)) {
                        return Boolean.TRUE.equals(isGovReg) || !regAgency.isEmpty();
                    } else if ("UNREGISTERED".equalsIgnoreCase(govReg)) {
                        return !Boolean.TRUE.equals(isGovReg) && regAgency.isEmpty();
                    } else {
                        return govReg.equalsIgnoreCase(regAgency);
                    }
                })
                .filter(startup -> {
                    if (trl == null || trl.trim().isEmpty() || "All".equalsIgnoreCase(trl.trim())) {
                        return true;
                    }
                    String raw = startup.getTrlLevel();
                    if (raw == null || raw.trim().isEmpty()) {
                        return false;
                    }
                    java.util.regex.Matcher m = java.util.regex.Pattern.compile("\\d+").matcher(raw);
                    if (!m.find()) return false;
                    int sTrl = Integer.parseInt(m.group());

                    if (trl.contains("-")) {
                        String[] parts = trl.split("-");
                        int low = Integer.parseInt(parts[0].replaceAll("\\D+", ""));
                        int high = Integer.parseInt(parts[1].replaceAll("\\D+", ""));
                        return sTrl >= low && sTrl <= high;
                    } else {
                        java.util.regex.Matcher targetM = java.util.regex.Pattern.compile("\\d+").matcher(trl);
                        if (!targetM.find()) return false;
                        int target = Integer.parseInt(targetM.group());
                        return sTrl == target;
                    }
                })
                .collect(Collectors.toList());

        Comparator<Startup> comparator;
        String m = metric != null ? metric.toLowerCase() : "overall";
        switch (m) {
            case "growth":
                comparator = Comparator.comparingDouble(rankingService::calculateGrowthScore);
                break;
            case "investment":
                comparator = Comparator.comparingDouble(rankingService::calculateInvestmentScore);
                break;
            case "ecosystem":
                comparator = Comparator.comparingDouble(rankingService::calculateEcosystemScore);
                break;
            case "engagement":
                comparator = Comparator.comparingDouble(rankingService::calculateEngagementScore);
                break;
            case "overall":
            default:
                comparator = Comparator.comparingDouble(rankingService::calculateOverallScore);
        }

        return filtered.stream().sorted(comparator.reversed()).collect(Collectors.toList());
    }

    private Map<String, Object> mapStartupToData(Startup startup) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", startup.getId());
        data.put("companyName", startup.getCompanyName());
        data.put("industry", startup.getIndustry());
        data.put("trlLevel", startup.getTrlLevel());
        data.put("isGovernmentRegistered", startup.getIsGovernmentRegistered());
        data.put("registrationAgency", startup.getRegistrationAgency());
        data.put("facebook", startup.getFacebook());
        data.put("instagram", startup.getInstagram());
        data.put("facebookFollowers", startup.getFacebookFollowers());
        data.put("facebookLikes", startup.getFacebookLikes());
        data.put("instagramFollowers", startup.getInstagramFollowers());
        data.put("overallScore", Math.round(rankingService.calculateOverallScore(startup)));
        data.put("score", Math.round(rankingService.calculateOverallScore(startup)));
        data.put("growthScore", Math.round(rankingService.calculateGrowthScore(startup) * 100));
        data.put("growthRate", startup.getAverageStartupGrowthRate());
        data.put("investmentScore", Math.round(rankingService.calculateInvestmentScore(startup) * 100));
        data.put("ecosystemScore", Math.round(rankingService.calculateEcosystemScore(startup) * 100));
        data.put("engagementScore", Math.round(rankingService.calculateEngagementScore(startup) * 100));
        data.put("totalFunding", startup.getTotalStartupFundingReceived());
        return data;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getRankedStartups(
            @RequestParam(required = false) String industry,
            @RequestParam(required = false) String govReg,
            @RequestParam(required = false) String trl,
            @RequestParam(required = false, defaultValue = "overall") String metric,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        List<Startup> allStartups = startupRepository.findAll();
        List<Startup> rankedStartups = filterAndRankStartups(allStartups, industry, govReg, trl, metric);

        // Apply pagination
        int start = page * size;
        int end = Math.min(start + size, rankedStartups.size());
        List<Startup> paginatedStartups = start < rankedStartups.size()
                ? rankedStartups.subList(start, end)
                : Collections.emptyList();

        List<Map<String, Object>> startupData = paginatedStartups.stream()
                .map(this::mapStartupToData)
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("content", startupData);
        response.put("totalElements", rankedStartups.size());
        response.put("totalPages", (int) Math.ceil((double) rankedStartups.size() / size));
        response.put("size", size);
        response.put("number", page);
        response.put("numberOfElements", startupData.size());
        response.put("first", page == 0);
        response.put("last", end >= rankedStartups.size());
        response.put("empty", startupData.isEmpty());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getStartupScoreDetails(@PathVariable Long id) {
        return startupRepository.findById(id)
                .map(startup -> {
                    Map<String, Object> details = new HashMap<>();
                    details.put("id", startup.getId());
                    details.put("companyName", startup.getCompanyName());
                    details.put("industry", startup.getIndustry());
                    details.put("trlLevel", startup.getTrlLevel());
                    details.put("isGovernmentRegistered", startup.getIsGovernmentRegistered());
                    details.put("registrationAgency", startup.getRegistrationAgency());
                    details.put("facebook", startup.getFacebook());
                    details.put("instagram", startup.getInstagram());
                    details.put("facebookFollowers", startup.getFacebookFollowers());
                    details.put("facebookLikes", startup.getFacebookLikes());
                    details.put("instagramFollowers", startup.getInstagramFollowers());

                    details.put("overallScore", Math.round(rankingService.calculateOverallScore(startup)));
                    details.put("growthScore", Math.round(rankingService.calculateGrowthScore(startup) * 100));
                    details.put("investmentScore", Math.round(rankingService.calculateInvestmentScore(startup) * 100));
                    details.put("ecosystemScore", Math.round(rankingService.calculateEcosystemScore(startup) * 100));
                    details.put("engagementScore", Math.round(rankingService.calculateEngagementScore(startup) * 100));

                    Map<String, Object> metrics = new HashMap<>();
                    metrics.put("annualRevenue", startup.getAnnualRevenue());
                    metrics.put("growthRate", startup.getAverageStartupGrowthRate());
                    metrics.put("survivalRate", startup.getStartupSurvivalRate());
                    metrics.put("fundingReceived", startup.getTotalStartupFundingReceived());
                    metrics.put("fundingRounds", startup.getNumberOfFundingRounds());
                    metrics.put("governmentSupport", startup.getAmountOfGovernmentGrantsOrSubsidiesReceived());
                    metrics.put("mentors", startup.getNumberOfMentorsOrAdvisorsInvolved());
                    metrics.put("partnerships", startup.getPublicPrivatePartnershipsInvolvingStartups());
                    metrics.put("views", startup.getViewsCount());
                    metrics.put("likes", startup.getLikes() != null ? startup.getLikes().size() : 0);
                    metrics.put("bookmarks", startup.getBookmarks() != null ? startup.getBookmarks().size() : 0);
                    metrics.put("facebookFollowers", startup.getFacebookFollowers());
                    metrics.put("facebookLikes", startup.getFacebookLikes());
                    metrics.put("instagramFollowers", startup.getInstagramFollowers());

                    details.put("metrics", metrics);
                    return ResponseEntity.ok(details);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/top")
    public ResponseEntity<Map<String, Object>> getTopStartups(
            @RequestParam(required = false, defaultValue = "10") Integer limit,
            @RequestParam(required = false) String industry,
            @RequestParam(required = false) String govReg,
            @RequestParam(required = false) String trl,
            @RequestParam(required = false, defaultValue = "overall") String metric,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        List<Startup> allStartups = startupRepository.findAll();
        List<Startup> rankedStartups = filterAndRankStartups(allStartups, industry, govReg, trl, metric);

        // Apply limit first, then pagination
        rankedStartups = rankedStartups.stream().limit(limit).collect(Collectors.toList());
        
        int start = page * size;
        int end = Math.min(start + size, rankedStartups.size());
        List<Startup> paginatedStartups = start < rankedStartups.size() 
            ? rankedStartups.subList(start, end) 
            : Collections.emptyList();

        List<Map<String, Object>> startupData = paginatedStartups.stream()
                .map(this::mapStartupToData)
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("content", startupData);
        response.put("totalElements", rankedStartups.size());
        response.put("totalPages", (int) Math.ceil((double) rankedStartups.size() / size));
        response.put("size", size);
        response.put("number", page);
        response.put("numberOfElements", startupData.size());
        response.put("first", page == 0);
        response.put("last", end >= rankedStartups.size());
        response.put("empty", startupData.isEmpty());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/dashboard-analytics")
    public ResponseEntity<Map<String, Object>> getDashboardAnalytics(
            @RequestParam(required = false) String industry,
            @RequestParam(required = false) String govReg,
            @RequestParam(required = false) String trl) {
        List<Startup> allStartups = startupRepository.findAll();
        List<Startup> filtered = filterAndRankStartups(allStartups, industry, govReg, trl, "overall");
        List<Startup> dataSet = (filtered.isEmpty() && (industry == null && govReg == null && trl == null)) ? allStartups : filtered;

        Map<String, Object> response = new HashMap<>();

        response.put("growthData", generateGrowthData(dataSet));
        response.put("fundingData", generateFundingData(dataSet));
        response.put("locationData", generateLocationData(dataSet));

        return ResponseEntity.ok(response);
    }

    private List<Map<String, Object>> generateGrowthData(List<Startup> startups) {
        // Group all startups by industry and count them
        Map<String, Long> industryCount = startups.stream()
                .filter(s -> s.getIndustry() != null && !s.getIndustry().isEmpty())
                .collect(Collectors.groupingBy(
                        Startup::getIndustry,
                        Collectors.counting()));

        // Get top industries by startup count (limit to top 5)
        List<String> industriesList = industryCount.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        List<Map<String, Object>> growthData = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (int i = 5; i >= 0; i--) {
            YearMonth month = YearMonth.from(today.minusMonths(i));
            String monthName = month.format(DateTimeFormatter.ofPattern("MMM"));

            Map<String, Object> monthData = new LinkedHashMap<>();
            monthData.put("name", monthName);

            // Add each industry's growth data
            for (String industry : industriesList) {
                double avgGrowthRate = startups.stream()
                        .filter(s -> industry.equals(s.getIndustry()))
                        .mapToDouble(Startup::getAverageStartupGrowthRate)
                        .average()
                        .orElse(0.0);

                // Apply scaling based on month position
                double scaleFactor = 1.0 + (0.1 * i);
                long value = Math.round(avgGrowthRate * scaleFactor);
                
                monthData.put(industry, value);
            }

            growthData.add(monthData);
        }

        return growthData;
    }

    private List<Map<String, Object>> generateFundingData(List<Startup> startups) {
        Map<String, Long> fundingDistribution = startups.stream()
                .filter(s -> s.getFundingStage() != null && !s.getFundingStage().isEmpty())
                .collect(Collectors.groupingBy(
                        Startup::getFundingStage,
                        Collectors.counting()));

        Map<String, Long> standardizedFunding = new LinkedHashMap<>();
        standardizedFunding.put("Seed", fundingDistribution.getOrDefault("Seed", 0L));
        standardizedFunding.put("Series A", fundingDistribution.getOrDefault("Series A", 0L));
        standardizedFunding.put("Series B", fundingDistribution.getOrDefault("Series B", 0L));
        standardizedFunding.put("Series C+",
                fundingDistribution.getOrDefault("Series C", 0L) +
                        fundingDistribution.getOrDefault("Series D", 0L) +
                        fundingDistribution.getOrDefault("Series E", 0L) +
                        fundingDistribution.getOrDefault("Series F+", 0L));

        long otherCount = fundingDistribution.entrySet().stream()
                .filter(e -> !standardizedFunding.containsKey(e.getKey()))
                .mapToLong(Map.Entry::getValue)
                .sum();

        if (otherCount > 0) {
            standardizedFunding.put("Other", otherCount);
        }

        return standardizedFunding.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("name", entry.getKey());
                    item.put("value", entry.getValue());
                    return item;
                })
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> generateLocationData(List<Startup> startups) {
        Map<String, Long> locationDistribution = startups.stream()
                .filter(s -> s.getCity() != null && !s.getCity().isEmpty())
                .collect(Collectors.groupingBy(
                        Startup::getCity,
                        Collectors.counting()));

        List<Map.Entry<String, Long>> topLocations = locationDistribution.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(4)
                .collect(Collectors.toList());

        List<Map<String, Object>> result = new ArrayList<>();

        for (Map.Entry<String, Long> entry : topLocations) {
            Map<String, Object> item = new HashMap<>();
            item.put("name", entry.getKey());
            item.put("value", entry.getValue());
            result.add(item);
        }

        long topLocationsCount = topLocations.stream()
                .mapToLong(Map.Entry::getValue)
                .sum();

        long totalCount = locationDistribution.values().stream()
                .mapToLong(Long::longValue)
                .sum();

        long otherCount = totalCount - topLocationsCount;
        if (otherCount > 0) {
            Map<String, Object> otherItem = new HashMap<>();
            otherItem.put("name", "Other");
            otherItem.put("value", otherCount);
            result.add(otherItem);
        }

        return result;
    }
}