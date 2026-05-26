package com.startupsphere.capstone.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.startupsphere.capstone.entity.StartupDraft;
import com.startupsphere.capstone.repository.StartupDraftRepository;
import com.startupsphere.capstone.dtos.DraftRequest;
import com.startupsphere.capstone.dtos.DraftResponse;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class StartupDraftService {

    private final StartupDraftRepository repo;
    private final ObjectMapper objectMapper;

    // MANUAL CONSTRUCTOR (NO LOMBOK)
    public StartupDraftService(StartupDraftRepository repo) {
        this.repo = repo;
        this.objectMapper = new ObjectMapper();
    }

    @Transactional
    public void saveDraft(Integer userId, DraftRequest req) {
        try {
            String formDataJson = objectMapper.writeValueAsString(req.formData());

            String json = """
                {
                "formData": %s,
                "selectedTab": "%s"
                }
                """.formatted(formDataJson, req.selectedTab());

            System.out.println("Saving draft JSON: " + json);

            StartupDraft draft = repo.findByUserId(userId).orElse(new StartupDraft());
            draft.setUserId(userId);
            draft.setDraftData(json);
            repo.save(draft);

        } catch (JsonProcessingException e) {
            System.err.println("JSON serialization error: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Transactional(readOnly = true)
    public DraftResponse getDraft(Integer userId) {
        System.out.println("getDraft called for userId: " + userId);

        Optional<StartupDraft> optionalDraft = repo.findByUserId(userId);
        if (optionalDraft.isEmpty()) {
            System.out.println("No draft found for userId: " + userId);
            return null;
        }

        StartupDraft draft = optionalDraft.get();
        System.out.println("Raw draft_data: " + draft.getDraftData());

        try {
            JsonNode json = objectMapper.readTree(draft.getDraftData());
            String formData = json.get("formData").toString();
            String selectedTab = json.get("selectedTab").asText("Company Information");

            System.out.println("Parsed formData: " + formData);
            return new DraftResponse(formData, selectedTab);
        } catch (JsonProcessingException e) {
            System.err.println("Failed to parse JSON: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    @Transactional
    public void deleteDraft(Integer userId) {
        repo.findByUserId(userId).ifPresent(draft -> {
            repo.delete(draft);
            System.out.println("Draft deleted for userId: " + userId);
        });
    }

    private String escapeJson(String input) {
        return input
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\b", "\\b")
                .replace("\f", "\\f")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}