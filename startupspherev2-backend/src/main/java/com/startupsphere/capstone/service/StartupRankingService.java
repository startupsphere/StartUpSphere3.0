package com.startupsphere.capstone.service;

import com.startupsphere.capstone.entity.Startup;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.Cacheable;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service to calculate and rank startups based on multiple performance criteria
 */
@Service
public class StartupRankingService {

    // Score component weights based on specified percentages
    private static final double GROWTH_WEIGHT = 0.30;
    private static final double INVESTMENT_WEIGHT = 0.30;
    private static final double ECOSYSTEM_WEIGHT = 0.20;
    private static final double ENGAGEMENT_WEIGHT = 0.20;

    // Additional normalization factors
    private static final double MAX_ANNUAL_REVENUE = 500000000.0; // 500M PHP as max benchmark
    private static final double MAX_GROWTH_RATE = 100.0; // 100% as max benchmark
    private static final double MAX_FUNDING = 100000000.0; // 100M PHP as max benchmark
    private static final double MAX_GOVT_GRANT = 50000000.0; // 50M PHP as max benchmark
    private static final int MAX_FUNDING_ROUNDS = 10; // Series D+ as max benchmark
    private static final int MAX_MENTORS = 50; // Arbitrary max
    private static final int MAX_PARTNERSHIPS = 20; // Arbitrary max
    private static final int MAX_VIEWS = 10000; // Arbitrary max for platform engagement
    private static final int MAX_SOCIAL_MEDIA_SCORE = 5; // Count of social media platforms

    /**
     * Calculate overall score for a startup
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
                engagementScore * ENGAGEMENT_WEIGHT) * 100;
    }

    /**
     * Calculate growth & performance score (30% of total)
     */
    public double calculateGrowthScore(Startup startup) {
        // Revenue component (normalized)
        double revenueScore = 0.0;
        if (startup.getAnnualRevenue() != null) {
            revenueScore = Math.min(startup.getAnnualRevenue() / MAX_ANNUAL_REVENUE, 1.0);
        }

        // Growth rate component (already percentage but cap at 100%)
        double growthRateScore = Math.min(startup.getAverageStartupGrowthRate() / MAX_GROWTH_RATE, 1.0);

        // Survival rate (already percentage)
        double survivalRateScore = startup.getStartupSurvivalRate() / 100.0;

        // Combine with equal weights within this category
        return (revenueScore + growthRateScore + survivalRateScore) / 3.0;
    }

    /**
     * Calculate investment & funding score (30% of total)
     */
    public double calculateInvestmentScore(Startup startup) {
        // Capital metrics
        double capitalScore = 0.0;
        if (startup.getPaidUpCapital() != null) {
            capitalScore = Math.min(startup.getPaidUpCapital() / MAX_FUNDING, 1.0);
        }

        double fundingScore = Math.min(startup.getTotalStartupFundingReceived() / MAX_FUNDING, 1.0);

        // Funding rounds
        double fundingRoundsScore = Math.min((double) startup.getNumberOfFundingRounds() / MAX_FUNDING_ROUNDS, 1.0);

        // Foreign investment (binary: has/doesn't have)
        double foreignInvestmentScore = startup.getNumberOfStartupsWithForeignInvestment() > 0 ? 1.0 : 0.0;

        // Government support
        double govtSupportScore = Math.min(
                startup.getAmountOfGovernmentGrantsOrSubsidiesReceived() / MAX_GOVT_GRANT, 1.0);

        // Combine with equal weights within this category
        return (capitalScore + fundingScore + fundingRoundsScore + foreignInvestmentScore + govtSupportScore) / 5.0;
    }

    /**
     * Calculate ecosystem integration score (20% of total)
     */
    public double calculateEcosystemScore(Startup startup) {
        // Incubator participation (binary: is/isn't in an incubator)
        double incubatorScore = startup.getNumberOfStartupsInIncubationPrograms() > 0 ? 1.0 : 0.0;

        // Mentorship
        double mentorshipScore = Math.min(
                (double) startup.getNumberOfMentorsOrAdvisorsInvolved() / MAX_MENTORS, 1.0);

        // Partnerships
        double partnershipScore = Math.min(
                (double) startup.getPublicPrivatePartnershipsInvolvingStartups() / MAX_PARTNERSHIPS, 1.0);

        // Combine with equal weights within this category
        return (incubatorScore + mentorshipScore + partnershipScore) / 3.0;
    }

    /**
     * Calculate engagement score (20% of total)
     */
    public double calculateEngagementScore(Startup startup) {
        // Profile completeness score
        double profileScore = calculateProfileCompleteness(startup);

        // Social media presence score
        double socialMediaScore = calculateSocialMediaPresence(startup);

        // Platform engagement (views, likes, bookmarks)
        double viewsScore = Math.min((double) startup.getViewsCount() / MAX_VIEWS, 1.0);
        double likesScore = Math.min(startup.getLikes() != null ? (double) startup.getLikes().size() / 100.0 : 0.0,
                1.0);
        double bookmarksScore = Math
                .min(startup.getBookmarks() != null ? (double) startup.getBookmarks().size() / 50.0 : 0.0, 1.0);
        double platformEngagementScore = (viewsScore + likesScore + bookmarksScore) / 3.0;

        // Combine with equal weights within this category
        return (profileScore + socialMediaScore + platformEngagementScore) / 3.0;
    }

    /**
     * Calculate profile completeness score
     */
    private double calculateProfileCompleteness(Startup startup) {
        int totalFields = 0;
        int filledFields = 0;

        // Check each field and count if it's filled
        if (startup.getCompanyName() != null && !startup.getCompanyName().trim().isEmpty()) {
            filledFields++;
        }
        totalFields++;

        if (startup.getCompanyDescription() != null && !startup.getCompanyDescription().trim().isEmpty()) {
            filledFields++;
        }
        totalFields++;

        if (startup.getFoundedDate() != null && !startup.getFoundedDate().trim().isEmpty()) {
            filledFields++;
        }
        totalFields++;

        if (startup.getTypeOfCompany() != null && !startup.getTypeOfCompany().trim().isEmpty()) {
            filledFields++;
        }
        totalFields++;

        if (startup.getNumberOfEmployees() != null && !startup.getNumberOfEmployees().trim().isEmpty()) {
            filledFields++;
        }
        totalFields++;

        if (startup.getPhoneNumber() != null && !startup.getPhoneNumber().trim().isEmpty()) {
            filledFields++;
        }
        totalFields++;

        if (startup.getContactEmail() != null && !startup.getContactEmail().trim().isEmpty()) {
            filledFields++;
        }
        totalFields++;

        if (startup.getStreetAddress() != null && !startup.getStreetAddress().trim().isEmpty()) {
            filledFields++;
        }
        totalFields++;

        if (startup.getCity() != null && !startup.getCity().trim().isEmpty()) {
            filledFields++;
        }
        totalFields++;

        if (startup.getProvince() != null && !startup.getProvince().trim().isEmpty()) {
            filledFields++;
        }
        totalFields++;

        if (startup.getPostalCode() != null && !startup.getPostalCode().trim().isEmpty()) {
            filledFields++;
        }
        totalFields++;

        if (startup.getIndustry() != null && !startup.getIndustry().trim().isEmpty()) {
            filledFields++;
        }
        totalFields++;

        if (startup.getBusinessActivity() != null && !startup.getBusinessActivity().trim().isEmpty()) {
            filledFields++;
        }
        totalFields++;

        if (startup.getFundingStage() != null && !startup.getFundingStage().trim().isEmpty()) {
            filledFields++;
        }
        totalFields++;

        if (startup.getPhoto() != null && startup.getPhoto().length > 0) {
            filledFields++;
        }
        totalFields++;

        // Calculate completeness percentage
        return (double) filledFields / totalFields;
    }

    /**
     * Calculate social media presence score
     */
    private double calculateSocialMediaPresence(Startup startup) {
        int socialMediaCount = 0;

        // Count how many social media profiles are filled
        if (startup.getWebsite() != null && !startup.getWebsite().trim().isEmpty()) {
            socialMediaCount++;
        }

        if (startup.getFacebook() != null && !startup.getFacebook().trim().isEmpty()) {
            socialMediaCount++;
        }

        if (startup.getTwitter() != null && !startup.getTwitter().trim().isEmpty()) {
            socialMediaCount++;
        }

        if (startup.getInstagram() != null && !startup.getInstagram().trim().isEmpty()) {
            socialMediaCount++;
        }

        if (startup.getLinkedIn() != null && !startup.getLinkedIn().trim().isEmpty()) {
            socialMediaCount++;
        }

        // Calculate social media presence score
        return (double) socialMediaCount / MAX_SOCIAL_MEDIA_SCORE;
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