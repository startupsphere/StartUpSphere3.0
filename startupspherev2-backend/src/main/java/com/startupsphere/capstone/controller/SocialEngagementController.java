package com.startupsphere.capstone.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.startupsphere.capstone.entity.Startup;
import com.startupsphere.capstone.repository.StartupRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/social")
@CrossOrigin(origins = "*")
public class SocialEngagementController {

    private static final Logger logger = LoggerFactory.getLogger(SocialEngagementController.class);

    @Autowired
    private StartupRepository startupRepository;

    @Value("${facebook.scraper.api.key:cd_live_VMvBF9bbnTmw9n4w-UKWbCM0FwjAfJLj}")
    private String apiKey;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    public static String extractFbHandle(String input) {
        if (input == null || input.trim().isEmpty()) return null;
        String clean = input.trim();
        clean = clean.replaceAll("(?i)^https?://", "");
        clean = clean.replaceAll("(?i)^(www\\.|m\\.|web\\.)", "");
        clean = clean.replaceAll("(?i)^facebook\\.com/?", "");

        if (clean.contains("profile.php")) {
            Matcher m = Pattern.compile("(?i)[?&]id=([a-zA-Z0-9_\\-\\.]+)").matcher(clean);
            if (m.find()) return m.group(1);
        }

        clean = clean.split("\\?")[0].split("#")[0];
        String[] parts = clean.split("/");
        if (parts.length == 0 || parts[0].trim().isEmpty()) return null;

        if ("pages".equalsIgnoreCase(parts[0]) && parts.length >= 2) {
            return parts[parts.length - 1];
        }
        if ("people".equalsIgnoreCase(parts[0]) && parts.length >= 2) {
            return parts[parts.length - 1];
        }
        return parts[0].trim();
    }

    public static String extractIgHandle(String input) {
        if (input == null || input.trim().isEmpty()) return null;
        String clean = input.trim();
        clean = clean.replaceAll("^@", "");
        clean = clean.replaceAll("(?i)^https?://", "");
        clean = clean.replaceAll("(?i)^(www\\.|m\\.)", "");
        clean = clean.replaceAll("(?i)^instagram\\.com/?", "");
        clean = clean.split("\\?")[0].split("#")[0];
        String[] parts = clean.split("/");
        if (parts.length == 0 || parts[0].trim().isEmpty()) return null;
        return parts[0].trim();
    }

    @GetMapping("/facebook")
    public ResponseEntity<Map<String, Object>> getFacebookStats(@RequestParam("url") String url) {
        Map<String, Object> response = new HashMap<>();
        String handle = extractFbHandle(url);
        if (handle == null || handle.isEmpty()) {
            response.put("success", false);
            response.put("message", "Invalid Facebook URL or handle");
            return ResponseEntity.badRequest().body(response);
        }

        try {
            String apiUrl = "https://api.facebookscraperapi.com/api/v1/facebook/page?page="
                    + URLEncoder.encode(handle, StandardCharsets.UTF_8)
                    + "&api_key=" + apiKey;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .timeout(Duration.ofSeconds(20))
                    .GET()
                    .build();

            HttpResponse<String> httpResponse = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (httpResponse.statusCode() >= 400) {
                logger.warn("Facebook scraper API returned {}: {}", httpResponse.statusCode(), httpResponse.body());
                response.put("success", false);
                response.put("followers", 0);
                response.put("likes", 0);
                response.put("status", httpResponse.statusCode());
                return ResponseEntity.ok(response);
            }

            JsonNode root = objectMapper.readTree(httpResponse.body());
            JsonNode results = root.path("results");
            if (!results.isArray() || results.isEmpty()) {
                response.put("success", false);
                response.put("followers", 0);
                response.put("likes", 0);
                return ResponseEntity.ok(response);
            }

            JsonNode item = results.get(0);
            int followers = 0;
            int likes = 0;

            if (item.has("followers") && !item.get("followers").isNull()) {
                followers = parseNumber(item.get("followers").asText());
            } else if (item.has("description") && !item.get("description").isNull()) {
                String desc = item.get("description").asText();
                followers = extractNumberWithPattern(desc, "([\\d,\\.]+)\\s*(?:followers|follower)");
            }

            if (item.has("likes") && !item.get("likes").isNull()) {
                likes = parseNumber(item.get("likes").asText());
            } else if (item.has("description") && !item.get("description").isNull()) {
                String desc = item.get("description").asText();
                likes = extractNumberWithPattern(desc, "([\\d,\\.]+)\\s*(?:likes|like)");
            }

            if (likes == 0 && item.has("talking_about_count") && !item.get("talking_about_count").isNull()) {
                likes = item.get("talking_about_count").asInt(0);
            }

            response.put("success", true);
            response.put("handle", handle);
            response.put("name", item.has("name") ? item.get("name").asText() : handle);
            response.put("followers", followers);
            response.put("likes", likes);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error fetching Facebook metrics for handle {}: {}", handle, e.getMessage());
            response.put("success", false);
            response.put("error", e.getMessage());
            response.put("followers", 0);
            response.put("likes", 0);
            return ResponseEntity.ok(response);
        }
    }

    @GetMapping("/instagram")
    public ResponseEntity<Map<String, Object>> getInstagramStats(@RequestParam("url") String url) {
        Map<String, Object> response = new HashMap<>();
        String username = extractIgHandle(url);
        if (username == null || username.isEmpty()) {
            response.put("success", false);
            response.put("message", "Invalid Instagram URL or handle");
            return ResponseEntity.badRequest().body(response);
        }

        try {
            String apiUrl = "https://api.facebookscraperapi.com/api/v1/instagram/profile?username="
                    + URLEncoder.encode(username, StandardCharsets.UTF_8)
                    + "&api_key=" + apiKey;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .timeout(Duration.ofSeconds(20))
                    .GET()
                    .build();

            HttpResponse<String> httpResponse = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (httpResponse.statusCode() >= 400) {
                logger.warn("Instagram scraper API returned {}: {}", httpResponse.statusCode(), httpResponse.body());
                response.put("success", false);
                response.put("followers", 0);
                response.put("status", httpResponse.statusCode());
                return ResponseEntity.ok(response);
            }

            JsonNode item = objectMapper.readTree(httpResponse.body());
            int followers = item.has("follower_count") ? item.get("follower_count").asInt(0) : 0;
            int posts = item.has("posts_count") ? item.get("posts_count").asInt(0) : 0;
            String name = item.has("full_name") ? item.get("full_name").asText() : username;

            response.put("success", true);
            response.put("username", username);
            response.put("name", name);
            response.put("followers", followers);
            response.put("posts", posts);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error fetching Instagram metrics for username {}: {}", username, e.getMessage());
            response.put("success", false);
            response.put("error", e.getMessage());
            response.put("followers", 0);
            return ResponseEntity.ok(response);
        }
    }

    @PostMapping("/sync/{startupId:[0-9]+}")
    public ResponseEntity<Map<String, Object>> syncStartupSocial(@PathVariable Long startupId) {
        Optional<Startup> opt = startupRepository.findById(startupId);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Startup startup = opt.get();

        boolean updated = false;

        if (startup.getFacebook() != null && !startup.getFacebook().trim().isEmpty()) {
            ResponseEntity<Map<String, Object>> fbRes = getFacebookStats(startup.getFacebook());
            if (fbRes.getBody() != null && Boolean.TRUE.equals(fbRes.getBody().get("success"))) {
                Object fObj = fbRes.getBody().get("followers");
                Object lObj = fbRes.getBody().get("likes");
                int f = fObj instanceof Number ? ((Number) fObj).intValue() : 0;
                int l = lObj instanceof Number ? ((Number) lObj).intValue() : 0;
                if (f > 0) startup.setFacebookFollowers(f);
                if (l > 0) startup.setFacebookLikes(l);
                updated = true;
            }
        }

        if (startup.getInstagram() != null && !startup.getInstagram().trim().isEmpty()) {
            ResponseEntity<Map<String, Object>> igRes = getInstagramStats(startup.getInstagram());
            if (igRes.getBody() != null && Boolean.TRUE.equals(igRes.getBody().get("success"))) {
                Object fObj = igRes.getBody().get("followers");
                int f = fObj instanceof Number ? ((Number) fObj).intValue() : 0;
                if (f > 0) startup.setInstagramFollowers(f);
                updated = true;
            }
        }

        if (updated) {
            startupRepository.save(startup);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("startupId", startupId);
        result.put("facebookFollowers", startup.getFacebookFollowers());
        result.put("facebookLikes", startup.getFacebookLikes());
        result.put("instagramFollowers", startup.getInstagramFollowers());
        return ResponseEntity.ok(result);
    }

    private int parseNumber(String val) {
        if (val == null) return 0;
        try {
            return Integer.parseInt(val.replaceAll("[,\\s]", ""));
        } catch (Exception e) {
            return 0;
        }
    }

    private int extractNumberWithPattern(String text, String regex) {
        if (text == null) return 0;
        try {
            Matcher m = Pattern.compile(regex, Pattern.CASE_INSENSITIVE).matcher(text);
            if (m.find()) {
                return Integer.parseInt(m.group(1).replaceAll("[,\\s]", ""));
            }
        } catch (Exception ignored) {}
        return 0;
    }
}
