package com.startupsphere.capstone.service;

import com.startupsphere.capstone.entity.Startup;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.Cacheable;

import java.util.Comparator;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Service to calculate and rank startups based on multiple performance criteria
 */
@Service
public class StartupRankingService {

    // Score component weights: balanced composite overall performance (25% each)
    private static final double GROWTH_WEIGHT = 0.25;
    private static final double INVESTMENT_WEIGHT = 0.25;
    private static final double ECOSYSTEM_WEIGHT = 0.25;
    private static final double ENGAGEMENT_WEIGHT = 0.25;

    // Normalization factors & benchmarks
    private static final double MAX_FUNDING = 100000000.0; // 100M PHP as max benchmark
    private static final double MAX_PARTNERSHIPS = 10.0; // 10 public-private partnerships benchmark
    private static final double MAX_INVESTORS = 10.0; // 10 investors / funding rounds benchmark
    private static final double MAX_VIEWS = 10000.0; // 10,000 views benchmark
    private static final double MAX_LIKES = 50.0; // 50 likes benchmark
    private static final double MAX_BOOKMARKS = 30.0; // 30 bookmarks benchmark

    private static final Pattern DIGIT_PATTERN = Pattern.compile("\\d+");

    /**
     * Calculate overall score for a startup based on growth, investment, ecosystem and engagement
     * 
     * @param startup The startup entity to score
     * @return Normalized score between 0-100
     */
    public double calculateOverallScore(Startup startup) {
        double growthScore = calculateGrowthScore(startup);
        double investmentScore = calculateInvestmentScore(startup);
        double ecosystemScore = calculateEcosystemScore(startup);
        double engagementScore = calculateEngagementScore(startup);

        // Combine weighted scores and normalize to 0-100 scale
        return (growthScore * GROWTH_WEIGHT +
                investmentScore * INVESTMENT_WEIGHT +
                ecosystemScore * ECOSYSTEM_WEIGHT +
                engagementScore * ENGAGEMENT_WEIGHT) * 100.0;
    }

    /**
     * Calculate growth score based on the TRL readiness level of the startup/business (TRL 1-9)
     * Normalized between 0.0 and 1.0 (e.g. TRL 1 = 11%, TRL 9 = 100%)
     */
    public double calculateGrowthScore(Startup startup) {
        if (startup == null) {
            return 0.0;
        }

        if (startup.getTrlLevel() != null && !startup.getTrlLevel().trim().isEmpty()) {
            Matcher m = DIGIT_PATTERN.matcher(startup.getTrlLevel());
            if (m.find()) {
                int level = Integer.parseInt(m.group());
                return Math.min(Math.max((double) level, 1.0) / 9.0, 1.0);
            }
            String raw = startup.getTrlLevel().trim().toLowerCase();
            if (raw.contains("concept") || raw.contains("idea") || raw.contains("research")) return 2.0 / 9.0;
            if (raw.contains("prototype") || raw.contains("validation") || raw.contains("dev")) return 5.0 / 9.0;
            if (raw.contains("commercial") || raw.contains("market") || raw.contains("scale")) return 8.0 / 9.0;
        }

        // Fallback: infer maturity from funding stage if TRL is not explicitly specified
        String stage = startup.getFundingStage();
        if (stage != null && !stage.trim().isEmpty()) {
            String s = stage.trim().toLowerCase();
            if (s.contains("series b") || s.contains("series c") || s.contains("growth") || s.contains("ipo")) return 8.0 / 9.0;
            if (s.contains("series a")) return 6.0 / 9.0;
            if (s.contains("seed") || s.contains("angel")) return 4.0 / 9.0;
            if (s.contains("pre-seed") || s.contains("idea")) return 2.0 / 9.0;
        }

        if (startup.getAnnualRevenue() != null && startup.getAnnualRevenue() > 0) {
            return 7.0 / 9.0;
        }
        if (startup.getAverageStartupGrowthRate() > 0) {
            return 5.0 / 9.0;
        }

        // Base entry level readiness for registered startup/business (TRL 1)
        return 1.0 / 9.0;
    }

    /**
     * Calculate investment score based on the Total fundings a specific startup/business has
     * Normalized between 0.0 and 1.0
     */
    public double calculateInvestmentScore(Startup startup) {
        double funding = startup.getTotalStartupFundingReceived();
        if (funding <= 0 && startup.getPaidUpCapital() != null) {
            funding = startup.getPaidUpCapital();
        }
        if (funding <= 0) {
            return 0.0;
        }
        return Math.min(funding / MAX_FUNDING, 1.0);
    }

    /**
     * Calculate ecosystem score based on the number of public-private partnerships
     * and number of investors of a startup/business
     * Normalized between 0.0 and 1.0
     */
    public double calculateEcosystemScore(Startup startup) {
        // Public-Private Partnerships
        double pppScore = Math.min((double) Math.max(startup.getPublicPrivatePartnershipsInvolvingStartups(), 0) / MAX_PARTNERSHIPS, 1.0);

        // Number of investors (derived from funding rounds + foreign investment)
        int investorCount = Math.max(startup.getNumberOfFundingRounds(), 0) + Math.max(startup.getNumberOfStartupsWithForeignInvestment(), 0);
        double investorScore = Math.min((double) investorCount / MAX_INVESTORS, 1.0);

        return (pppScore + investorScore) / 2.0;
    }

    /**
     * Calculate engagement score based on likes, views, and bookmarks of the startup/business
     * Normalized between 0.0 and 1.0
     */
    public double calculateEngagementScore(Startup startup) {
        double viewsScore = Math.min(startup.getViewsCount() != null ? (double) Math.max(startup.getViewsCount(), 0) / MAX_VIEWS : 0.0, 1.0);
        int likesCount = startup.getLikes() != null ? startup.getLikes().size() : 0;
        double likesScore = Math.min((double) likesCount / MAX_LIKES, 1.0);
        int bookmarksCount = startup.getBookmarks() != null ? startup.getBookmarks().size() : 0;
        double bookmarksScore = Math.min((double) bookmarksCount / MAX_BOOKMARKS, 1.0);

        return (viewsScore + likesScore + bookmarksScore) / 3.0;
    }

    /**
     * Rank a list of startups based on their overall scores
     * 
     * @param startups List of startups to rank
     * @return List of startups sorted by ranking
     */
    @Cacheable(value = "rankings", key = "'all'")
    public List<Startup> rankStartups(List<Startup> startups) {
        return startups.stream()
                .filter(startup -> "Approved".equalsIgnoreCase(startup.getStatus())) // Filter by status
                .sorted(Comparator.comparingDouble(this::calculateOverallScore).reversed())
                .collect(Collectors.toList());
    }

    /**
     * Filter and rank startups by industry
     * 
     * @param startups List of all startups
     * @param industry Industry to filter by
     * @return Ranked list of startups in the specified industry
     */
    @Cacheable(value = "rankings", key = "'industry-' + #industry")
    public List<Startup> rankStartupsByIndustry(List<Startup> startups, String industry) {
        return startups.stream()
                .filter(startup -> "Approved".equalsIgnoreCase(startup.getStatus())) // Filter by status
                .filter(startup -> industry == null || industry.trim().isEmpty() || industry.equalsIgnoreCase("All")
                        || industry.equalsIgnoreCase(startup.getIndustry()))
                .sorted(Comparator.comparingDouble(this::calculateOverallScore).reversed())
                .collect(Collectors.toList());
    }

    /**
     * Rank startups by a specific metric instead of the overall score
     * 
     * @param startups List of startups to rank
     * @param metric   Metric to rank by ("growth", "investment", "ecosystem",
     *                 "engagement", or "overall")
     * @return List of startups sorted by the specified metric
     */
    @Cacheable(value = "rankings", key = "'metric-' + #metric")
    public List<Startup> rankStartupsByMetric(List<Startup> startups, String metric) {
        Comparator<Startup> comparator;

        switch (metric.toLowerCase()) {
            case "growth":
                comparator = Comparator.comparingDouble(this::calculateGrowthScore);
                break;
            case "investment":
                comparator = Comparator.comparingDouble(this::calculateInvestmentScore);
                break;
            case "ecosystem":
                comparator = Comparator.comparingDouble(this::calculateEcosystemScore);
                break;
            case "engagement":
                comparator = Comparator.comparingDouble(this::calculateEngagementScore);
                break;
            case "overall":
            default:
                comparator = Comparator.comparingDouble(this::calculateOverallScore);
        }

        return startups.stream()
                .filter(startup -> "Approved".equalsIgnoreCase(startup.getStatus())) // Filter by status
                .sorted(comparator.reversed())
                .collect(Collectors.toList());
    }
}