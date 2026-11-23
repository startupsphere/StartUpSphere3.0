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
        return mapStartupToData(startup, 0);
    }

    private Map<String, Object> mapStartupToData(Startup startup, int rank) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", startup.getId());
        if (rank > 0) {
            data.put("rank", rank);
        }
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
        data.put("foundedDate", startup.getFoundedDate());
        data.put("createdAt", startup.getCreatedAt());
        data.put("registrationDate", startup.getRegistrationDate());
        data.put("lastUpdated", startup.getLastUpdated());
        data.put("status", startup.getStatus());
        return data;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getRankedStartups(
            @RequestParam(required = false) String industry,
            @RequestParam(required = false) String govReg,
            @RequestParam(required = false) String trl,
            @RequestParam(required = false, defaultValue = "overall") String metric,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        List<Startup> allStartups = startupRepository.findAll();
        List<Startup> rankedStartups = filterAndRankStartups(allStartups, industry, govReg, trl, metric);

        // Assign 1-based leaderboard ranking based on the sorted order
        List<Map<String, Object>> rankedWithIndices = new ArrayList<>();
        for (int i = 0; i < rankedStartups.size(); i++) {
            rankedWithIndices.add(mapStartupToData(rankedStartups.get(i), i + 1));
        }

        // Filter specifically by search query (business name, industry, etc.) if provided
        List<Map<String, Object>> filteredList = rankedWithIndices;
        if (search != null && !search.trim().isEmpty()) {
            String q = search.trim().toLowerCase();
            filteredList = rankedWithIndices.stream()
                    .filter(s -> {
                        String name = (String) s.get("companyName");
                        String ind = (String) s.get("industry");
                        return (name != null && name.toLowerCase().contains(q)) ||
                               (ind != null && ind.toLowerCase().contains(q));
                    })
                    .collect(Collectors.toList());
        }

        // Apply pagination
        int start = page * size;
        int end = Math.min(start + size, filteredList.size());
        List<Map<String, Object>> paginatedStartups = start < filteredList.size()
                ? filteredList.subList(start, end)
                : Collections.emptyList();

        Map<String, Object> response = new HashMap<>();
        response.put("content", paginatedStartups);
        response.put("totalElements", filteredList.size());
        response.put("totalPages", (int) Math.ceil((double) filteredList.size() / size));
        response.put("size", size);
        response.put("number", page);
        response.put("numberOfElements", paginatedStartups.size());
        response.put("first", page == 0);
        response.put("last", end >= filteredList.size());
        response.put("empty", paginatedStartups.isEmpty());

        double totalFundingSum = allStartups.stream()
                .filter(s -> !Boolean.TRUE.equals(s.getIsDraft()))
                .filter(s -> {
                    if (industry != null && !industry.trim().isEmpty() && !"All".equalsIgnoreCase(industry.trim())) {
                        return industry.equalsIgnoreCase(s.getIndustry());
                    }
                    return true;
                })
                .mapToDouble(Startup::getTotalStartupFundingReceived)
                .sum();
        response.put("totalFunding", totalFundingSum);
        
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
        if (limit != null && limit > 0) {
            rankedStartups = rankedStartups.stream().limit(limit).collect(Collectors.toList());
        }
        
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
        
        // Track all listed businesses & startups (active, in review, registered) across ecosystem
        List<Startup> dataSet = allStartups.stream()
                .filter(s -> !Boolean.TRUE.equals(s.getIsDraft()))
                .filter(s -> {
                    if (industry == null || industry.trim().isEmpty() || "All".equalsIgnoreCase(industry.trim())) {
                        return true;
                    }
                    return industry.equalsIgnoreCase(s.getIndustry());
                })
                .filter(s -> {
                    if (govReg == null || govReg.trim().isEmpty() || "All".equalsIgnoreCase(govReg.trim())) {
                        return true;
                    }
                    String regAgency = s.getRegistrationAgency() != null ? s.getRegistrationAgency().trim() : "";
                    Boolean isGovReg = s.getIsGovernmentRegistered();
                    if ("BIR".equalsIgnoreCase(govReg)) return "BIR".equalsIgnoreCase(regAgency);
                    if ("SEC".equalsIgnoreCase(govReg)) return "SEC".equalsIgnoreCase(regAgency);
                    if ("DTI".equalsIgnoreCase(govReg)) return "DTI".equalsIgnoreCase(regAgency);
                    if ("REGISTERED".equalsIgnoreCase(govReg)) return Boolean.TRUE.equals(isGovReg) || !regAgency.isEmpty();
                    if ("UNREGISTERED".equalsIgnoreCase(govReg)) return !Boolean.TRUE.equals(isGovReg) && regAgency.isEmpty();
                    return true;
                })
                .filter(s -> {
                    if (trl == null || trl.trim().isEmpty() || "All".equalsIgnoreCase(trl.trim())) {
                        return true;
                    }
                    int lvl = parseTrlLevel(s.getTrlLevel());
                    if ("CONCEPT".equalsIgnoreCase(trl)) return lvl >= 1 && lvl <= 3;
                    if ("PROTOTYPE".equalsIgnoreCase(trl)) return lvl >= 4 && lvl <= 6;
                    if ("COMMERCIAL".equalsIgnoreCase(trl)) return lvl >= 7;
                    return true;
                })
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();

        response.put("totalTrackedBusinesses", dataSet.size());
        response.put("growthData", generateGrowthData(dataSet));
        response.put("fundingData", generateFundingData(dataSet));
        response.put("locationData", generateLocationData(dataSet));
        response.put("monthlyGrowth", generateMonthlyStartupGrowth(dataSet));
        response.put("trlStages", generateTrlStages(dataSet));
        response.put("govCompliance", generateGovCompliance(dataSet));
        response.put("industryScores", generateIndustryScores(dataSet));

        double totalFunding = dataSet.stream()
                .mapToDouble(s -> s.getTotalStartupFundingReceived() + s.getAmountOfGovernmentGrantsOrSubsidiesReceived())
                .sum();
        response.put("totalFunding", totalFunding);

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

    private int parseTrlLevel(String trlLevel) {
        if (trlLevel == null || trlLevel.trim().isEmpty()) {
            return 0;
        }
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("\\d+").matcher(trlLevel);
        if (m.find()) {
            try {
                return Integer.parseInt(m.group());
            } catch (Exception ignored) {}
        }
        return 0;
    }

    private List<Map<String, Object>> generateLocationData(List<Startup> startups) {
        Map<String, Long> locationDistribution = startups.stream()
                .filter(s -> s.getCity() != null && !s.getCity().trim().isEmpty())
                .collect(Collectors.groupingBy(
                        s -> s.getCity().trim(),
                        Collectors.counting()));

        return locationDistribution.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(entry -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("name", entry.getKey());
                    item.put("value", entry.getValue());
                    return item;
                })
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> generateTrlStages(List<Startup> startups) {
        List<Map<String, Object>> stages = new ArrayList<>();
        for (int lvl = 1; lvl <= 9; lvl++) {
            final int targetLvl = lvl;
            List<String> names = startups.stream()
                    .filter(s -> parseTrlLevel(s.getTrlLevel()) == targetLvl)
                    .map(Startup::getCompanyName)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            Map<String, Object> item = new HashMap<>();
            item.put("stage", "TRL " + lvl);
            item.put("level", lvl);
            item.put("count", names.size());
            item.put("startups", names);
            stages.add(item);
        }
        return stages;
    }

    private List<Map<String, Object>> generateGovCompliance(List<Startup> startups) {
        long registered = startups.stream().filter(s -> Boolean.TRUE.equals(s.getIsGovernmentRegistered()) || (s.getRegistrationAgency() != null && !s.getRegistrationAgency().trim().isEmpty() && !"Unregistered".equalsIgnoreCase(s.getRegistrationAgency()))).count();
        long funded = startups.stream().filter(s -> s.getAmountOfGovernmentGrantsOrSubsidiesReceived() > 0).count();
        long sec = startups.stream().filter(s -> "SEC".equalsIgnoreCase(s.getRegistrationAgency())).count();
        long dti = startups.stream().filter(s -> "DTI".equalsIgnoreCase(s.getRegistrationAgency())).count();
        long bir = startups.stream().filter(s -> "BIR".equalsIgnoreCase(s.getRegistrationAgency())).count();
        long otherAgc = startups.stream().filter(s -> s.getRegistrationAgency() != null && !s.getRegistrationAgency().trim().isEmpty() && !Arrays.asList("BIR", "SEC", "DTI", "Unregistered").contains(s.getRegistrationAgency())).count();
        long unregistered = startups.stream().filter(s -> !Boolean.TRUE.equals(s.getIsGovernmentRegistered()) && (s.getRegistrationAgency() == null || s.getRegistrationAgency().trim().isEmpty() || "Unregistered".equalsIgnoreCase(s.getRegistrationAgency()))).count();

        List<Map<String, Object>> list = new ArrayList<>();
        list.add(Map.of("name", "Gov. Registered", "count", registered, "fill", "#10b981"));
        list.add(Map.of("name", "Gov. Funded", "count", funded, "fill", "#06b6d4"));
        list.add(Map.of("name", "SEC (Corp)", "count", sec, "fill", "#3b82f6"));
        list.add(Map.of("name", "DTI (Trade)", "count", dti, "fill", "#6366f1"));
        list.add(Map.of("name", "BIR (Certified)", "count", bir, "fill", "#8b5cf6"));
        list.add(Map.of("name", "Other Agc.", "count", otherAgc, "fill", "#ec4899"));
        list.add(Map.of("name", "Unregistered", "count", unregistered, "fill", "#f59e0b"));
        return list;
    }

    private List<Map<String, Object>> generateIndustryScores(List<Startup> startups) {
        Map<String, List<Startup>> byIndustry = startups.stream()
                .filter(s -> s.getIndustry() != null && !s.getIndustry().trim().isEmpty())
                .collect(Collectors.groupingBy(s -> s.getIndustry().trim()));

        List<Map<String, Object>> result = new ArrayList<>();
        String[] colors = {"#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EC4899", "#6366F1", "#14B8A6", "#F97316", "#06B6D4", "#84CC16"};
        int colorIdx = 0;

        for (Map.Entry<String, List<Startup>> entry : byIndustry.entrySet()) {
            String industry = entry.getKey();
            List<Startup> list = entry.getValue();
            if (list.isEmpty()) continue;

            double avgOverall = list.stream()
                    .mapToDouble(rankingService::calculateOverallScore)
                    .average()
                    .orElse(0.0);

            // TRL stage readiness per business (0 to 100 scale)
            double avgGrowth = list.stream()
                    .mapToDouble(s -> rankingService.calculateGrowthScore(s) * 100.0)
                    .average()
                    .orElse(0.0);

            double avgEco = list.stream()
                    .mapToDouble(s -> rankingService.calculateEcosystemScore(s) * 100.0)
                    .average()
                    .orElse(0.0);

            double avgInvestment = list.stream()
                    .mapToDouble(s -> rankingService.calculateInvestmentScore(s) * 100.0)
                    .average()
                    .orElse(0.0);

            Map<String, Object> item = new HashMap<>();
            item.put("name", industry);
            item.put("industry", industry);
            item.put("score", Math.round(avgOverall));
            item.put("overallScore", Math.round(avgOverall));
            item.put("growthScore", Math.round(avgGrowth));
            item.put("ecosystemScore", Math.round(avgEco));
            item.put("investmentScore", Math.round(avgInvestment));
            item.put("count", list.size());
            item.put("color", colors[colorIdx % colors.length]);
            colorIdx++;

            result.add(item);
        }

        result.sort((a, b) -> Integer.compare((int) b.get("count"), (int) a.get("count")));
        return result;
    }

    private LocalDate parseFlexibleDate(String raw) {
        if (raw == null || raw.trim().isEmpty() || "N/A".equalsIgnoreCase(raw.trim())) {
            return null;
        }
        String s = raw.trim();
        if (s.contains("T")) {
            s = s.substring(0, s.indexOf('T')).trim();
        }

        try {
            return LocalDate.parse(s, DateTimeFormatter.ISO_LOCAL_DATE);
        } catch (Exception ignored) {}

        String[] patterns = {
            "MMM d, yyyy", "MMMM d, yyyy", "MMM dd, yyyy", "MMMM dd, yyyy",
            "yyyy-MM-dd", "yyyy/MM/dd", "MM/dd/yyyy", "M/d/yyyy", "dd/MM/yyyy", "d/M/yyyy"
        };
        for (String pattern : patterns) {
            try {
                return LocalDate.parse(s, DateTimeFormatter.ofPattern(pattern, Locale.ENGLISH));
            } catch (Exception ignored) {}
        }

        if (s.matches("^\\d{4}$")) {
            try {
                int y = Integer.parseInt(s);
                return LocalDate.of(y, 1, 1);
            } catch (Exception ignored) {}
        }

        return null;
    }

    private LocalDate extractStartupDate(Startup s) {
        // 1. Try foundedDate first: when the startup / business was actually established
        if (s.getFoundedDate() != null && !s.getFoundedDate().trim().isEmpty()) {
            LocalDate parsed = parseFlexibleDate(s.getFoundedDate());
            if (parsed != null) {
                return parsed;
            }
        }
        // 2. Try registrationDate if foundedDate was not available
        if (s.getRegistrationDate() != null && !s.getRegistrationDate().trim().isEmpty()) {
            LocalDate parsed = parseFlexibleDate(s.getRegistrationDate());
            if (parsed != null) {
                return parsed;
            }
        }
        // 3. Try createdAt (platform registration / submission timestamp)
        if (s.getCreatedAt() != null) {
            return s.getCreatedAt().toLocalDate();
        }
        // 4. Try lastUpdated
        if (s.getLastUpdated() != null) {
            return s.getLastUpdated().toLocalDate();
        }
        return null;
    }

    private List<Map<String, Object>> generateMonthlyStartupGrowth(List<Startup> startups) {
        return generateMonthlyStartupGrowth(startups, 6);
    }

    private List<Map<String, Object>> generateMonthlyStartupGrowth(List<Startup> startups, int monthsCount) {
        List<Map<String, Object>> monthlyData = new ArrayList<>();
        LocalDate today = LocalDate.now();
        DateTimeFormatter shortMonthFmt = DateTimeFormatter.ofPattern("MMM");
        DateTimeFormatter fullMonthFmt = DateTimeFormatter.ofPattern("MMM yyyy");

        for (int i = monthsCount - 1; i >= 0; i--) {
            YearMonth ym = YearMonth.from(today.minusMonths(i));
            String monthName = ym.format(shortMonthFmt);

            List<String> newNames = new ArrayList<>();
            long count = 0;

            for (Startup s : startups) {
                if (Boolean.TRUE.equals(s.getIsDraft())) continue;
                LocalDate d = extractStartupDate(s);
                if (d != null && YearMonth.from(d).equals(ym)) {
                    count++;
                    if (s.getCompanyName() != null && !s.getCompanyName().trim().isEmpty()) {
                        newNames.add(s.getCompanyName().trim());
                    }
                }
            }

            long cumulative = 0;
            for (Startup s : startups) {
                if (Boolean.TRUE.equals(s.getIsDraft())) continue;
                LocalDate d = extractStartupDate(s);
                if (d == null || !YearMonth.from(d).isAfter(ym)) {
                    cumulative++;
                }
            }

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("month", monthName);
            item.put("monthYear", ym.format(fullMonthFmt));
            item.put("newStartups", count);
            item.put("totalStartups", cumulative);
            item.put("newStartupNames", newNames);
            monthlyData.add(item);
        }
        return monthlyData;
    }
}