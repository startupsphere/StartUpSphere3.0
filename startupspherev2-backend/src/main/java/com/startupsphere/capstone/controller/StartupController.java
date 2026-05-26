package com.startupsphere.capstone.controller;

import com.startupsphere.capstone.entity.Startup;
import com.startupsphere.capstone.entity.User;
import com.startupsphere.capstone.repository.StartupRepository;
import com.startupsphere.capstone.responses.ErrorResponse;
import com.startupsphere.capstone.responses.SuccessResponse;
import com.startupsphere.capstone.service.NotificationService;
import com.startupsphere.capstone.service.StartupService;

import io.jsonwebtoken.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

@RestController
@RequestMapping("/startups")
public class StartupController {

    private static final Logger logger = LoggerFactory.getLogger(StartupController.class);

    private final StartupService startupService;
    private final StartupRepository startupRepository;

    public StartupController(StartupService startupService, StartupRepository startupRepository) {
        this.startupService = startupService;
        this.startupRepository = startupRepository;
    }

    @Autowired
    private NotificationService notificationService;

    @PostMapping
    @Transactional
    public ResponseEntity<Startup> createStartup(@RequestBody Startup startup) {
        logger.info("Attempting to create startup: {}", startup.getCompanyName());
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getPrincipal().equals("anonymousUser")) {
            logger.warn("Unauthorized attempt to create startup");
            return ResponseEntity.status(401).body(null);
        }

        User loggedInUser = (User) authentication.getPrincipal();
        startup.setUser(loggedInUser);

        try {
            Startup createdStartup = startupService.createStartup(startup);
            logger.info("Startup created successfully with ID: {}", createdStartup.getId());
            notificationService.createStartupApprovalNotification(
                    createdStartup,
                    "in review",
                    "New startup application submitted for review."
            );
            return ResponseEntity.ok(createdStartup);
        } catch (Exception e) {
            logger.error("Error creating startup: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(null);
        }
    }

    @PostMapping("/draft")
    @Transactional
    public ResponseEntity<Startup> saveDraft(@RequestBody Startup startup) {
        logger.info("Attempting to save startup draft: {}", startup.getCompanyName());
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getPrincipal().equals("anonymousUser")) {
            logger.warn("Unauthorized attempt to save draft");
            return ResponseEntity.status(401).body(null);
        }

        User loggedInUser = (User) authentication.getPrincipal();
        startup.setUser(loggedInUser);
        startup.setIsDraft(true);
        startup.setStatus("Draft");

        try {
            Startup savedDraft = startupService.saveDraft(startup);
            logger.info("Draft saved successfully with ID: {}", savedDraft.getId());
            return ResponseEntity.ok(savedDraft);
        } catch (Exception e) {
            logger.error("Error saving draft: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(null);
        }
    }

    @GetMapping
    public ResponseEntity<Page<Startup>> getAllStartups(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Startup> startups = startupService.getAllStartups(pageable);
        return ResponseEntity.ok(startups);
    }

    @GetMapping("/search")
    public ResponseEntity<Page<Startup>> searchStartups(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "companyName") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Startup> startups = startupService.searchStartups(query, pageable);
        return ResponseEntity.ok(startups);
    }

    @GetMapping("/{id:[0-9]+}")
    public ResponseEntity<Startup> getStartupById(@PathVariable Long id) {
        return startupService.getStartupById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/submitted")
    public ResponseEntity<Page<Startup>> getAllSubmittedStartups(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        try {
            logger.info("Fetching paginated submitted startups");
            Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
            Pageable pageable = PageRequest.of(page, size, sort);
            Page<Startup> startups = startupService.getAllSubmittedStartups(pageable);
            return ResponseEntity.ok(startups);
        } catch (Exception e) {
            logger.error("Error fetching submitted startups: {}", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }

    @PutMapping("/{id:[0-9]+}")
    public ResponseEntity<Startup> updateStartup(@PathVariable Long id, @RequestBody Startup updatedStartup) {
        try {
            Startup updated = startupService.updateStartup(id, updatedStartup);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id:[0-9]+}")
    public ResponseEntity<Void> deleteStartup(@PathVariable Long id) {
        logger.info("Received request to delete startup with id: {}", id);

        try {
            startupService.deleteStartup(id);
            logger.info("Successfully deleted startup with id: {}", id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            logger.error("Error deleting startup with id: {}. Error: {}", id, e.getMessage(), e);
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(404).build();
            }
            return ResponseEntity.status(500).build();
        } catch (Exception e) {
            logger.error("Unexpected error deleting startup with id: {}. Error: {}", id, e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/{id:[0-9]+}/views")
    public ResponseEntity<Integer> getViewsByStartupId(@PathVariable Long id) {
        Optional<Startup> optionalStartup = startupRepository.findById(id);
        if (optionalStartup.isPresent()) {
            Startup startup = optionalStartup.get();
            return ResponseEntity.ok(startup.getViewsCount());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id:[0-9]+}/increment-views")
    public ResponseEntity<Integer> incrementViews(@PathVariable Long id) {
        Optional<Startup> optionalStartup = startupRepository.findById(id);
        if (optionalStartup.isPresent()) {
            Startup startup = optionalStartup.get();
            startup.setViewsCount(startup.getViewsCount() + 1);
            startupRepository.save(startup);
            return ResponseEntity.ok(startup.getViewsCount());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{startupId:[0-9]+}/upload-csv")
    public ResponseEntity<String> uploadStartupCsv(
            @PathVariable Long startupId,
            @RequestParam("file") MultipartFile file) {
        String fileName = file.getOriginalFilename();
        if (file.isEmpty() || fileName == null) {
            return ResponseEntity.badRequest().body("Please upload a valid file.");
        }
        
        boolean isCsv = fileName.toLowerCase().endsWith(".csv");
        boolean isExcel = fileName.toLowerCase().endsWith(".xlsx");
        
        if (!isCsv && !isExcel) {
            return ResponseEntity.badRequest().body("Please upload a valid CSV or XLSX file.");
        }

        try {
            Optional<Startup> optionalStartup = startupService.getStartupById(startupId);
            if (optionalStartup.isEmpty()) {
                return ResponseEntity.badRequest().body("Startup with ID " + startupId + " not found.");
            }

            Startup startup = optionalStartup.get();
            Map<String, Integer> headerMap = new HashMap<>();
            List<String[]> dataRows = new ArrayList<>();
            
            if (isExcel) {
                // Process Excel file
                try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
                    Sheet sheet = workbook.getSheetAt(0);
                    if (sheet.getPhysicalNumberOfRows() == 0) {
                        return ResponseEntity.badRequest().body("Excel file is empty.");
                    }
                    
                    // Read header row
                    Row headerRow = sheet.getRow(0);
                    if (headerRow == null) {
                        return ResponseEntity.badRequest().body("Excel file has no header row.");
                    }
                    
                    // Build header map
                    for (int i = 0; i < headerRow.getLastCellNum(); i++) {
                        Cell cell = headerRow.getCell(i);
                        if (cell != null) {
                            String headerName = getCellValueAsString(cell).trim().toLowerCase();
                            headerMap.put(headerName, i);
                        }
                    }
                    
                    // Read data rows (should be only one for single startup update)
                    for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                        Row row = sheet.getRow(i);
                        if (row != null) {
                            String[] rowData = new String[headerRow.getLastCellNum()];
                            for (int j = 0; j < headerRow.getLastCellNum(); j++) {
                                Cell cell = row.getCell(j);
                                rowData[j] = cell != null ? getCellValueAsString(cell) : "";
                            }
                            dataRows.add(rowData);
                        }
                    }
                }
            } else {
                // Process CSV file
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
                    String headerLine = reader.readLine();
                    if (headerLine == null) {
                        return ResponseEntity.badRequest().body("CSV file is empty.");
                    }

                    // Parse headers and create a mapping from column name to index
                    String[] headers = headerLine.split(",", -1);
                    for (int i = 0; i < headers.length; i++) {
                        String headerName = headers[i].trim().toLowerCase();
                        headerMap.put(headerName, i);
                    }
                    
                    // Read data rows
                    String line;
                    while ((line = reader.readLine()) != null) {
                        if (!line.trim().isEmpty()) {
                            dataRows.add(line.split(",", -1));
                        }
                    }
                }
            }

            // Process the data rows and update the startup
            for (String[] fields : dataRows) {
                // Use header-based mapping to set values
                String revenueStr = getValueByHeader(fields, headerMap, "revenue");
                if (revenueStr != null) {
                    startup.setRevenue(parseDoubleSafeWithDefault(revenueStr, startup.getRevenue()));
                }
                
                String annualRevenueStr = getValueByHeader(fields, headerMap, "annualrevenue");
                if (annualRevenueStr != null) {
                    startup.setAnnualRevenue(parseDoubleSafe(annualRevenueStr));
                }
                
                String paidUpCapitalStr = getValueByHeader(fields, headerMap, "paidupcapital");
                if (paidUpCapitalStr != null) {
                    startup.setPaidUpCapital(parseDoubleSafe(paidUpCapitalStr));
                }
                
                String numberOfActiveStartupsStr = getValueByHeader(fields, headerMap, "numberofactivestartups");
                if (numberOfActiveStartupsStr != null) {
                    startup.setNumberOfActiveStartups(parseIntSafe(numberOfActiveStartupsStr));
                }
                
                String numberOfNewStartupsThisYearStr = getValueByHeader(fields, headerMap, "numberofnewstartupsthisyear");
                if (numberOfNewStartupsThisYearStr != null) {
                    startup.setNumberOfNewStartupsThisYear(parseIntSafe(numberOfNewStartupsThisYearStr));
                }
                
                String averageStartupGrowthRateStr = getValueByHeader(fields, headerMap, "averagestartupgrowthrate");
                if (averageStartupGrowthRateStr != null) {
                    startup.setAverageStartupGrowthRate(parseDoubleSafe(averageStartupGrowthRateStr));
                }
                
                String startupSurvivalRateStr = getValueByHeader(fields, headerMap, "startupsurvivalrate");
                if (startupSurvivalRateStr != null) {
                    startup.setStartupSurvivalRate(parseDoubleSafe(startupSurvivalRateStr));
                }
                
                String totalStartupFundingReceivedStr = getValueByHeader(fields, headerMap, "totalstartupfundingreceived");
                if (totalStartupFundingReceivedStr != null) {
                    startup.setTotalStartupFundingReceived(parseDoubleSafe(totalStartupFundingReceivedStr));
                }
                
                String averageFundingPerStartupStr = getValueByHeader(fields, headerMap, "averagefundingperstartup");
                if (averageFundingPerStartupStr != null) {
                    startup.setAverageFundingPerStartup(parseDoubleSafe(averageFundingPerStartupStr));
                }
                
                String numberOfFundingRoundsStr = getValueByHeader(fields, headerMap, "numberoffundingrounds");
                if (numberOfFundingRoundsStr != null) {
                    startup.setNumberOfFundingRounds(parseIntSafe(numberOfFundingRoundsStr));
                }
                
                String numberOfStartupsWithForeignInvestmentStr = getValueByHeader(fields, headerMap, "numberofstartupswithforeigninvestment");
                if (numberOfStartupsWithForeignInvestmentStr != null) {
                    startup.setNumberOfStartupsWithForeignInvestment(parseIntSafe(numberOfStartupsWithForeignInvestmentStr));
                }
                
                String amountOfGovernmentGrantsOrSubsidiesReceivedStr = getValueByHeader(fields, headerMap, "amountofgovernmentgrantsorsubsidiesreceived");
                if (amountOfGovernmentGrantsOrSubsidiesReceivedStr != null) {
                    startup.setAmountOfGovernmentGrantsOrSubsidiesReceived(parseDoubleSafe(amountOfGovernmentGrantsOrSubsidiesReceivedStr));
                }
                
                String numberOfStartupIncubatorsOrAcceleratorsStr = getValueByHeader(fields, headerMap, "numberofstartupincubatorsoraccelerators");
                if (numberOfStartupIncubatorsOrAcceleratorsStr != null) {
                    startup.setNumberOfStartupIncubatorsOrAccelerators(parseIntSafe(numberOfStartupIncubatorsOrAcceleratorsStr));
                }
                
                String numberOfStartupsInIncubationProgramsStr = getValueByHeader(fields, headerMap, "numberofstartupsinincubationprograms");
                if (numberOfStartupsInIncubationProgramsStr != null) {
                    startup.setNumberOfStartupsInIncubationPrograms(parseIntSafe(numberOfStartupsInIncubationProgramsStr));
                }
                
                String numberOfMentorsOrAdvisorsInvolvedStr = getValueByHeader(fields, headerMap, "numberofmentorsoradvisorsinvolved");
                if (numberOfMentorsOrAdvisorsInvolvedStr != null) {
                    startup.setNumberOfMentorsOrAdvisorsInvolved(parseIntSafe(numberOfMentorsOrAdvisorsInvolvedStr));
                }
                
                String publicPrivatePartnershipsInvolvingStartupsStr = getValueByHeader(fields, headerMap, "publicprivatepartnershipsinvolvingstartups");
                if (publicPrivatePartnershipsInvolvingStartupsStr != null) {
                    startup.setPublicPrivatePartnershipsInvolvingStartups(parseIntSafe(publicPrivatePartnershipsInvolvingStartupsStr));
                }
            }

            startupService.updateStartup(startupId, startup);
            return ResponseEntity.ok("File processed and data updated successfully.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error processing the file: " + e.getMessage());
        }
    }

    @GetMapping("/my-startups")
    public ResponseEntity<List<Long>> getStartupIdsByLoggedInUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            List<Long> startupIds = startupService.getStartupIdsByLoggedInUser(authentication);
            return ResponseEntity.ok(startupIds);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(null);
        }
    }

    @GetMapping("/{id:[0-9]+}/view-count")
    public ResponseEntity<Integer> getStartupViews(@PathVariable Long id) {
        Optional<Startup> optionalStartup = startupService.getStartupById(id);
        if (optionalStartup.isPresent()) {
            Startup startup = optionalStartup.get();
            return ResponseEntity.ok(startup.getViewsCount());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/my-startups/details")
    public ResponseEntity<List<Startup>> getStartupsByLoggedInUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            List<Startup> startups = startupService.getStartupsByLoggedInUser(authentication);
            return ResponseEntity.ok(startups);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).build();
        }
    }

    @GetMapping("/my-drafts")
    public ResponseEntity<List<Startup>> getDraftsByLoggedInUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            List<Startup> drafts = startupService.getDraftsByLoggedInUser(authentication);
            return ResponseEntity.ok(drafts);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).build();
        }
    }

    @GetMapping("/draft/{id:[0-9]+}")
    public ResponseEntity<Startup> getDraftById(@PathVariable Long id) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            Startup draft = startupService.getDraftById(id, authentication);
            return ResponseEntity.ok(draft);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).build();
        }
    }

    @PutMapping("/draft/{id:[0-9]+}")
    @Transactional
    public ResponseEntity<Startup> updateDraft(@PathVariable Long id, @RequestBody Startup updatedDraft) {
        logger.info("Attempting to update draft with ID: {}", id);
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()
                    || authentication.getPrincipal().equals("anonymousUser")) {
                return ResponseEntity.status(401).build();
            }

            User loggedInUser = (User) authentication.getPrincipal();
            Startup updated = startupService.updateDraft(id, updatedDraft, loggedInUser.getId());
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            logger.error("Error updating draft: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/draft/{id:[0-9]+}")
    @Transactional
    public ResponseEntity<Void> deleteDraft(@PathVariable Long id) {
        logger.info("Attempting to delete draft with ID: {}", id);
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()
                    || authentication.getPrincipal().equals("anonymousUser")) {
                return ResponseEntity.status(401).build();
            }

            User loggedInUser = (User) authentication.getPrincipal();
            startupService.deleteDraft(id, loggedInUser.getId());
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            logger.error("Error deleting draft: {}", e.getMessage());
            return ResponseEntity.status(404).build();
        }
    }

    @PutMapping("/draft/{id:[0-9]+}/submit")
    @Transactional
    public ResponseEntity<Startup> submitDraft(@PathVariable Long id) {
        logger.info("Attempting to submit draft with ID: {}", id);
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()
                    || authentication.getPrincipal().equals("anonymousUser")) {
                return ResponseEntity.status(401).build();
            }

            User loggedInUser = (User) authentication.getPrincipal();
            Startup submittedStartup = startupService.submitDraft(id, loggedInUser.getId());
            
            notificationService.createStartupApprovalNotification(
                    submittedStartup,
                    "in review",
                    "Startup application submitted for review."
            );
            
            return ResponseEntity.ok(submittedStartup);
        } catch (RuntimeException e) {
            logger.error("Error submitting draft: {}", e.getMessage(), e);
            return ResponseEntity.status(404).body(null);
        }
    }

    @PostMapping("/send-verification-email")
    public ResponseEntity<Map<String, String>> sendVerificationEmail(@RequestBody VerificationRequest request) {
        try {
            startupService.sendVerificationEmail(request.getStartupId(), request.getEmail());
            return ResponseEntity.ok(Map.of("message", "Verification email sent successfully."));
        } catch (RuntimeException e) {
            logger.error("Error sending verification email: {}", e.getMessage(), e);
            if (e.getMessage().contains("Email is already verified")) {
                logger.info("Email already verified for startup ID: {}. Resending verification email.",
                        request.getStartupId());
                return ResponseEntity.ok(Map.of("message", "Verification email resent successfully."));
            }
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Error sending verification email: " + e.getMessage()));
        }
    }

    @PostMapping("/verify-email")
    public ResponseEntity<String> verifyEmail(@RequestBody VerificationRequest request) {
        try {
            startupService.verifyEmail(request.getStartupId(), request.getEmail(), request.getCode());
            return ResponseEntity.ok("Email verified successfully.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error verifying email: " + e.getMessage());
        }
    }

    @PutMapping("/{id:[0-9]+}/upload-photo")
    public ResponseEntity<?> uploadStartupPhoto(
            @PathVariable Long id,
            @RequestParam(value = "photo", required = false) MultipartFile photo) {
        logger.info("Received photo upload request for startup ID: {}", id);

        if (photo == null || photo.isEmpty()) {
            logger.warn("Upload attempt with empty or null photo for startup ID: {}", id);
            return ResponseEntity.badRequest().body(
                    new ErrorResponse("Please upload a valid image file."));
        }

        logger.info("Photo details - Name: {}, Size: {}, Content-Type: {}",
                photo.getOriginalFilename(),
                photo.getSize(),
                photo.getContentType());

        String contentType = photo.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            logger.warn("Invalid file type uploaded for startup ID: {}. Content-Type: {}", id, contentType);
            return ResponseEntity.badRequest().body(
                    new ErrorResponse("Please upload a valid image file (e.g., JPEG, PNG)."));
        }

        try {
            Optional<Startup> optionalStartup = startupService.getStartupById(id);
            if (optionalStartup.isEmpty()) {
                logger.warn("Startup not found for ID: {}", id);
                return ResponseEntity.badRequest().body(
                        new ErrorResponse("Startup with ID " + id + " not found."));
            }

            Startup startup = optionalStartup.get();
            logger.info("Found startup: {}", startup.getCompanyName());

            byte[] photoBytes = photo.getBytes();
            logger.info("Successfully read photo bytes, size: {}", photoBytes.length);

            startup.setPhoto(photoBytes);
            logger.info("Set photo bytes to startup entity");

            startupService.updateStartup(id, startup);
            logger.info("Successfully updated startup with photo");

            return ResponseEntity.ok(
                    new SuccessResponse("Photo uploaded successfully."));
        } catch (IOException e) {
            logger.error("Failed to read photo bytes for startup ID: {}", id, e);
            return ResponseEntity.status(500).body(
                    new ErrorResponse("Error processing image file: " + e.getMessage()));
        } catch (Exception e) {
            logger.error("Error uploading photo for startup ID: {}", id, e);
            return ResponseEntity.status(500).body(
                    new ErrorResponse("Error uploading photo: " + e.getMessage()));
        }
    }

    @GetMapping("/{id:[0-9]+}/photo")
    public ResponseEntity<byte[]> getStartupPhoto(@PathVariable Long id) {
        Optional<Startup> optionalStartup = startupService.getStartupById(id);
        if (optionalStartup.isEmpty() || optionalStartup.get().getPhoto() == null) {
            logger.warn("Photo not found for startup ID: {}", id);
            return ResponseEntity.notFound().build();
        }

        byte[] photo = optionalStartup.get().getPhoto();
        return ResponseEntity.ok()
                .header("Content-Type", "image/jpeg")
                .body(photo);
    }

    @GetMapping("/email-verified")
    public ResponseEntity<Page<Startup>> getAllEmailVerifiedStartups(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Startup> startups = startupService.getAllEmailVerifiedStartups(pageable);
        return ResponseEntity.ok(startups);
    }

    @PutMapping("/{id:[0-9]+}/approve")
    public ResponseEntity<Startup> approveStartup(@PathVariable Long id) {
        try {
            Startup approvedStartup = startupService.approveStartup(id);
            return ResponseEntity.ok(approvedStartup);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(null);
        }
    }

    @PutMapping("/{id:[0-9]+}/reject")
    public ResponseEntity<Startup> rejectStartup(@PathVariable Long id) {
        try {
            Startup rejectedStartup = startupService.rejectStartup(id);
            return ResponseEntity.ok(rejectedStartup);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(null);
        }
    }

    @GetMapping("/approved")
    public ResponseEntity<Page<Startup>> getAllApprovedStartups(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Startup> startups = startupService.getAllApprovedStartups(pageable);
        return ResponseEntity.ok(startups);
    }

    @PostMapping("/test-reminder-emails")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> testReminderEmails() {
        try {
            logger.info("Manually triggering reminder emails");
            startupService.sendUpdateReminderEmails();
            return ResponseEntity.ok(Map.of("message", "Reminder emails triggered successfully"));
        } catch (Exception e) {
            logger.error("Error triggering reminder emails: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Failed to trigger reminder emails: " + e.getMessage()));
        }
    }

    @PutMapping("/{id:[0-9]+}/upload-registration-certificate")
    public ResponseEntity<?> uploadRegistrationCertificate(
            @PathVariable Long id,
            @RequestParam("registrationCertificate") MultipartFile registrationCertificate) {
        logger.info("Received registration certificate upload request for startup ID: {}", id);

        if (registrationCertificate == null || registrationCertificate.isEmpty()) {
            logger.warn("Upload attempt with empty or null registration certificate for startup ID: {}", id);
            return ResponseEntity.badRequest().body(
                    new ErrorResponse("Please upload a valid file for registration certificate."));
        }

        try {
            Optional<Startup> optionalStartup = startupService.getStartupById(id);
            if (optionalStartup.isEmpty()) {
                logger.warn("Startup not found for ID: {}", id);
                return ResponseEntity.badRequest().body(
                        new ErrorResponse("Startup with ID " + id + " not found."));
            }

            Startup startup = optionalStartup.get();
            logger.info("Found startup: {}", startup.getCompanyName());

            byte[] fileBytes = registrationCertificate.getBytes();
            logger.info("Successfully read registration certificate bytes, size: {}", fileBytes.length);

            startup.setRegistrationCertificate(fileBytes);
            startupService.updateStartup(id, startup);
            logger.info("Successfully updated startup with registration certificate");

            return ResponseEntity.ok(
                    new SuccessResponse("Registration certificate uploaded successfully."));
        } catch (java.io.IOException e) {
            logger.error("Failed to read registration certificate bytes for startup ID: {}", id, e);
            return ResponseEntity.status(500).body(
                    new ErrorResponse("Error processing registration certificate file: " + e.getMessage()));
        } catch (Exception e) {
            logger.error("Error uploading registration certificate for startup ID: {}", id, e);
            return ResponseEntity.status(500).body(
                    new ErrorResponse("Error uploading registration certificate: " + e.getMessage()));
        }
    }

    @GetMapping("/{id:[0-9]+}/registration-certificate")
    public ResponseEntity<byte[]> getRegistrationCertificate(@PathVariable Long id) {
        Optional<Startup> optionalStartup = startupService.getStartupById(id);
        if (optionalStartup.isEmpty() || optionalStartup.get().getRegistrationCertificate() == null) {
            logger.warn("Registration certificate not found for startup ID: {}", id);
            return ResponseEntity.notFound().build();
        }

        byte[] file = optionalStartup.get().getRegistrationCertificate();
        return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "attachment; filename=registration_certificate.pdf")
                .body(file);
    }

    @GetMapping("/review")
    public ResponseEntity<Page<Startup>> getStartupsWithFilters(
            @RequestParam(required = false) String industry,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {

        try {
            Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
            Pageable pageable = PageRequest.of(page, size, sort);
            Page<Startup> startups = startupService.getStartupsWithFilters(
                    industry,
                    status,
                    region,
                    search,
                    startDate,
                    endDate,
                    pageable
            );
            return ResponseEntity.ok(startups);
        } catch (Exception e) {
            logger.error("Error fetching filtered startups: {}", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/industries")
    public ResponseEntity<List<String>> getDistinctIndustries() {
        try {
            List<String> industries = startupService.getDistinctIndustries();
            return ResponseEntity.ok(industries);
        } catch (Exception e) {
            logger.error("Error fetching distinct industries: {}", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/upload-startups")
    public ResponseEntity<?> uploadStartupsCsv(@RequestParam("file") MultipartFile file) {
        String fileName = file.getOriginalFilename();
        if (file.isEmpty() || fileName == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please upload a valid file."));
        }
        
        boolean isCsv = fileName.toLowerCase().endsWith(".csv");
        boolean isExcel = fileName.toLowerCase().endsWith(".xlsx");
        
        if (!isCsv && !isExcel) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please upload a valid CSV or XLSX file."));
        }

        try {
            Map<String, Integer> headerMap = new HashMap<>();
            List<String[]> dataRows = new ArrayList<>();
            
            if (isExcel) {
                // Process Excel file
                try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
                    Sheet sheet = workbook.getSheetAt(0);
                    if (sheet.getPhysicalNumberOfRows() == 0) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Excel file is empty."));
                    }
                    
                    // Read header row
                    Row headerRow = sheet.getRow(0);
                    if (headerRow == null) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Excel file has no header row."));
                    }
                    
                    logger.info("Processing Excel upload");
                    
                    // Build header map
                    for (int i = 0; i < headerRow.getLastCellNum(); i++) {
                        Cell cell = headerRow.getCell(i);
                        if (cell != null) {
                            String headerName = getCellValueAsString(cell).trim().toLowerCase();
                            headerMap.put(headerName, i);
                            logger.debug("Header[{}]: '{}'", i, headerName);
                        }
                    }
                    
                    // Read data rows
                    for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                        Row row = sheet.getRow(i);
                        if (row != null) {
                            String[] rowData = new String[headerRow.getLastCellNum()];
                            for (int j = 0; j < headerRow.getLastCellNum(); j++) {
                                Cell cell = row.getCell(j);
                                rowData[j] = cell != null ? getCellValueAsString(cell) : "";
                            }
                            dataRows.add(rowData);
                        }
                    }
                }
            } else {
                // Process CSV file
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
                    String headerLine = reader.readLine();
                    if (headerLine == null) {
                        return ResponseEntity.badRequest().body(Map.of("error", "CSV file is empty."));
                    }

                    logger.info("Processing CSV upload with header: {}", headerLine);

                    // Parse headers and create a mapping from column name to index
                    String[] headers = headerLine.split(",", -1);
                    for (int i = 0; i < headers.length; i++) {
                        String headerName = headers[i].trim().toLowerCase();
                        headerMap.put(headerName, i);
                        logger.debug("Header[{}]: '{}'", i, headerName);
                    }
                    
                    // Read data rows
                    String line;
                    while ((line = reader.readLine()) != null) {
                        if (!line.trim().isEmpty()) {
                            dataRows.add(line.split(",", -1));
                        }
                    }
                }
            }

            List<Startup> startups = new ArrayList<>();
            List<String> errors = new ArrayList<>();
            int lineNumber = 1;
            int successCount = 0;
            int skipCount = 0;

            // Retrieve the currently authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized: No authenticated user found."));
            }
            User loggedInUser = (User) authentication.getPrincipal();

            for (String[] fields : dataRows) {
                lineNumber++;

                // Log raw line for first few records to debug
                if (lineNumber <= 3) {
                    String rawLine = String.join(",", fields);
                    String preview = rawLine.length() > 200 ? rawLine.substring(0, 200) + "..." : rawLine;
                    logger.info("Line {}: Total fields={}, Raw line preview: {}", 
                        lineNumber, fields.length, preview);
                }

                try {
                    // Validate minimum required fields
                    String companyName = getValueByHeader(fields, headerMap, "companyname");
                    if (companyName == null || companyName.isEmpty()) {
                        throw new IllegalArgumentException("Company name is required");
                    }

                    Startup startup = new Startup();
                    startup.setUser(loggedInUser);
                    
                    // Basic Information
                    startup.setCompanyName(companyName);
                    startup.setCompanyDescription(getValueByHeader(fields, headerMap, "companydescription"));
                    startup.setFoundedDate(getValueByHeader(fields, headerMap, "foundeddate"));
                    startup.setTypeOfCompany(getValueByHeader(fields, headerMap, "typeofcompany"));
                    startup.setNumberOfEmployees(getValueByHeader(fields, headerMap, "numberofemployees"));
                    startup.setPhoneNumber(getValueByHeader(fields, headerMap, "phonenumber"));
                    startup.setContactEmail(getValueByHeader(fields, headerMap, "contactemail"));
                    
                    // Address Information
                    startup.setStreetAddress(getValueByHeader(fields, headerMap, "streetaddress"));
                    startup.setCity(getValueByHeader(fields, headerMap, "city"));
                    startup.setProvince(getValueByHeader(fields, headerMap, "province"));
                    startup.setPostalCode(getValueByHeader(fields, headerMap, "postalcode"));
                    
                    // Category and Social Media
                    startup.setIndustry(getValueByHeader(fields, headerMap, "industry"));
                    startup.setWebsite(getValueByHeader(fields, headerMap, "website"));
                    startup.setFacebook(getValueByHeader(fields, headerMap, "facebook"));
                    startup.setTwitter(getValueByHeader(fields, headerMap, "twitter"));
                    startup.setInstagram(getValueByHeader(fields, headerMap, "instagram"));
                    startup.setLinkedIn(getValueByHeader(fields, headerMap, "linkedin"));
                    
                    // Location Coordinates
                    startup.setLocationLat(parseDoubleSafe(getValueByHeader(fields, headerMap, "locationlat")));
                    startup.setLocationLng(parseDoubleSafe(getValueByHeader(fields, headerMap, "locationlng")));
                    startup.setLocationName(getValueByHeader(fields, headerMap, "locationname"));
                    
                    // Status and Code
                    startup.setStartupCode(getValueByHeader(fields, headerMap, "startupcode"));
                    startup.setStatus(getValueByHeader(fields, headerMap, "status"));
                    
                    // Financial Information
                    // revenue is primitive double, others are nullable Double
                    String revenueStr = getValueByHeader(fields, headerMap, "revenue");
                    startup.setRevenue(parseDoubleSafeWithDefault(revenueStr, 0.0));
                    
                    String annualRevenueStr = getValueByHeader(fields, headerMap, "annualrevenue");
                    startup.setAnnualRevenue(parseDoubleSafe(annualRevenueStr));
                    
                    startup.setPaidUpCapital(parseDoubleSafe(getValueByHeader(fields, headerMap, "paidupcapital")));
                    
                    // Business Details
                    startup.setFundingStage(getValueByHeader(fields, headerMap, "fundingstage"));
                    startup.setBusinessActivity(getValueByHeader(fields, headerMap, "businessactivity"));
                    startup.setOperatingHours(getValueByHeader(fields, headerMap, "operatinghours"));
                    
                    // Metrics - All are primitive int, so use default of 0
                    String numActiveStartupsStr = getValueByHeader(fields, headerMap, "numberofactivestartups");
                    startup.setNumberOfActiveStartups(parseIntSafeWithDefault(numActiveStartupsStr, 0));
                    
                    String numNewStartupsStr = getValueByHeader(fields, headerMap, "numberOfNewStartupsThisYear");
                    startup.setNumberOfNewStartupsThisYear(parseIntSafeWithDefault(numNewStartupsStr, 0));
                    
                    startup.setAverageStartupGrowthRate(parseDoubleSafeWithDefault(getValueByHeader(fields, headerMap, "averageStartupGrowthRate"), 0.0));
                    startup.setStartupSurvivalRate(parseDoubleSafeWithDefault(getValueByHeader(fields, headerMap, "startupSurvivalRate"), 0.0));
                    startup.setTotalStartupFundingReceived(parseDoubleSafeWithDefault(getValueByHeader(fields, headerMap, "totalStartupFundingReceived"), 0.0));
                    startup.setAverageFundingPerStartup(parseDoubleSafeWithDefault(getValueByHeader(fields, headerMap, "averageFundingPerStartup"), 0.0));
                    
                    String numFundingRoundsStr = getValueByHeader(fields, headerMap, "numberOfFundingRounds");
                    startup.setNumberOfFundingRounds(parseIntSafeWithDefault(numFundingRoundsStr, 0));
                    
                    String numForeignInvestmentStr = getValueByHeader(fields, headerMap, "numberOfStartupsWithForeignInvestment");
                    startup.setNumberOfStartupsWithForeignInvestment(parseIntSafeWithDefault(numForeignInvestmentStr, 0));
                    
                    startup.setAmountOfGovernmentGrantsOrSubsidiesReceived(parseDoubleSafeWithDefault(getValueByHeader(fields, headerMap, "amountOfGovernmentGrantsOrSubsidiesReceived"), 0.0));
                    startup.setNumberOfStartupIncubatorsOrAccelerators(parseIntSafeWithDefault(getValueByHeader(fields, headerMap, "numberOfStartupIncubatorsOrAccelerators"), 0));
                    startup.setNumberOfStartupsInIncubationPrograms(parseIntSafeWithDefault(getValueByHeader(fields, headerMap, "numberOfStartupsInIncubationPrograms"), 0));
                    startup.setNumberOfMentorsOrAdvisorsInvolved(parseIntSafeWithDefault(getValueByHeader(fields, headerMap, "numberOfMentorsOrAdvisorsInvolved"), 0));
                    startup.setPublicPrivatePartnershipsInvolvingStartups(parseIntSafeWithDefault(getValueByHeader(fields, headerMap, "publicPrivatePartnershipsInvolvingStartups"), 0));
                    
                    // Regional Information
                    startup.setRegion(getValueByHeader(fields, headerMap, "region"));
                    startup.setBarangay(getValueByHeader(fields, headerMap, "barangay"));
                    
                    // Registration Information
                    startup.setIsGovernmentRegistered(parseBooleanSafe(getValueByHeader(fields, headerMap, "isGovernmentRegistered")));
                    startup.setRegistrationAgency(getValueByHeader(fields, headerMap, "registrationAgency"));
                    
                    String registrationNumberStr = getValueByHeader(fields, headerMap, "registrationNumber");
                    startup.setRegistrationNumber(registrationNumberStr);
                    
                    startup.setRegistrationDate(getValueByHeader(fields, headerMap, "registrationDate"));
                    startup.setOtherRegistrationAgency(getValueByHeader(fields, headerMap, "otherRegistrationagency"));
                    startup.setBusinessLicenseNumber(getValueByHeader(fields, headerMap, "businessLicensenumber"));
                    startup.setTin(getValueByHeader(fields, headerMap, "tin"));

                    // Log for debugging specific problematic fields
                    if (lineNumber <= 3) {
                        logger.info("Line {} parsed values - revenue: '{}'->{}, annualRevenue: '{}'->{}, numActiveStartups: '{}'->{}, numNewStartups: '{}'->{}, numFundingRounds: '{}'->{}, numForeignInvestment: '{}'->{}, registrationNumber: '{}'=>'{}'",
                            lineNumber, 
                            revenueStr, startup.getRevenue(),
                            annualRevenueStr, startup.getAnnualRevenue(),
                            numActiveStartupsStr, startup.getNumberOfActiveStartups(),
                            numNewStartupsStr, startup.getNumberOfNewStartupsThisYear(),
                            numFundingRoundsStr, startup.getNumberOfFundingRounds(),
                            numForeignInvestmentStr, startup.getNumberOfStartupsWithForeignInvestment(),
                            registrationNumberStr, startup.getRegistrationNumber());
                    }

                    startups.add(startup);
                    successCount++;
                } catch (Exception e) {
                    skipCount++;
                    String errorMsg = String.format("Line %d: %s", lineNumber, e.getMessage());
                    errors.add(errorMsg);
                    logger.warn("Skipping line {}: {}", lineNumber, e.getMessage());
                }
            }

            // Save all valid startups in batch
            if (!startups.isEmpty()) {
                try {
                    List<Startup> savedStartups = startupRepository.saveAll(startups);
                    logger.info("Successfully saved {} startups from CSV upload", savedStartups.size());
                    
                    // Log sample of saved data for verification (first startup only)
                    if (!savedStartups.isEmpty() && logger.isInfoEnabled()) {
                        Startup sample = savedStartups.get(0);
                        logger.info("Sample saved startup - ID: {}, Name: {}, Revenue: {}, AnnualRevenue: {}, NumActiveStartups: {}, NumNewStartups: {}, NumFundingRounds: {}, NumForeignInvestment: {}, RegistrationNumber: {}",
                            sample.getId(), sample.getCompanyName(), sample.getRevenue(), 
                            sample.getAnnualRevenue(), sample.getNumberOfActiveStartups(),
                            sample.getNumberOfNewStartupsThisYear(), sample.getNumberOfFundingRounds(),
                            sample.getNumberOfStartupsWithForeignInvestment(), sample.getRegistrationNumber());
                    }
                } catch (Exception e) {
                    logger.error("Error saving startups to database: {}", e.getMessage(), e);
                    return ResponseEntity.status(500).body(Map.of("error", "Error saving to database: " + e.getMessage()));
                }
            }

            // Prepare response
            Map<String, Object> response = new HashMap<>();
            response.put("message", "CSV file processed successfully");
            response.put("successCount", successCount);
            response.put("skippedCount", skipCount);
            response.put("totalProcessed", lineNumber - 1);
            
            if (!errors.isEmpty() && errors.size() <= 10) {
                // Only include errors if there aren't too many
                response.put("errors", errors);
            } else if (!errors.isEmpty()) {
                response.put("errorSummary", String.format("%d rows had errors. Check logs for details.", skipCount));
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error processing CSV file: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", "Error processing the file: " + e.getMessage()));
        }
    }

    /**
     * Safely get a string value from array at index.
     * Returns null only if index is out of bounds or value is null.
     * Returns the trimmed string even if it's empty (to preserve empty strings vs null).
     */
    private String getSafe(String[] arr, int index) {
        if (index < arr.length && arr[index] != null) {
            String trimmed = arr[index].trim();
            // Return null for truly empty strings, but preserve "0" and other values
            return trimmed.isEmpty() ? null : trimmed;
        }
        return null;
    }

    /**
     * Get value from CSV row by header name (case-insensitive).
     * Uses the header map to find the correct column index.
     */
    private String getValueByHeader(String[] fields, Map<String, Integer> headerMap, String headerName) {
        Integer index = headerMap.get(headerName.toLowerCase());
        if (index == null) {
            logger.debug("Header '{}' not found in CSV", headerName);
            return null;
        }
        return getSafe(fields, index);
    }

    /**
     * Parse Double with null return for invalid/empty values.
     * Preserves zero values.
     */
    private Double parseDoubleSafe(String value) {
        if (value == null || value.isEmpty()) {
            return null;
        }
        try {
            return Double.parseDouble(value.trim());
        } catch (NumberFormatException e) {
            logger.debug("Failed to parse double value: '{}'", value);
            return null;
        }
    }

    /**
     * Parse double with default value for primitive fields.
     * Preserves zero values from CSV.
     */
    private double parseDoubleSafeWithDefault(String value, double defaultValue) {
        if (value == null || value.isEmpty()) {
            return defaultValue;
        }
        try {
            return Double.parseDouble(value.trim());
        } catch (NumberFormatException e) {
            logger.debug("Failed to parse double value: '{}', using default: {}", value, defaultValue);
            return defaultValue;
        }
    }

    /**
     * Parse Integer with null return for invalid/empty values.
     * Preserves zero values.
     */
    private Integer parseIntSafe(String value) {
        if (value == null || value.isEmpty()) {
            return null;
        }
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            logger.debug("Failed to parse integer value: '{}'", value);
            return null;
        }
    }

    /**
     * Parse int with default value for primitive fields.
     * Preserves zero values from CSV.
     */
    private int parseIntSafeWithDefault(String value, int defaultValue) {
        if (value == null || value.isEmpty()) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            logger.debug("Failed to parse integer value: '{}', using default: {}", value, defaultValue);
            return defaultValue;
        }
    }

    /**
     * Parse Boolean safely handling various representations.
     */
    private Boolean parseBooleanSafe(String value) {
        if (value == null || value.isEmpty()) {
            return null;
        }
        // Handle common boolean representations
        String lowerValue = value.toLowerCase().trim();
        return lowerValue.equals("true") || lowerValue.equals("1") || lowerValue.equals("yes");
    }

    /**
     * Get cell value as string from Excel cell, handling different cell types.
     */
    private String getCellValueAsString(Cell cell) {
        if (cell == null) {
            return "";
        }
        
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                }
                // Format numeric values to avoid scientific notation
                double numericValue = cell.getNumericCellValue();
                if (numericValue == (long) numericValue) {
                    return String.valueOf((long) numericValue);
                }
                return String.valueOf(numericValue);
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                try {
                    return String.valueOf(cell.getNumericCellValue());
                } catch (IllegalStateException e) {
                    return cell.getStringCellValue();
                }
            case BLANK:
                return "";
            default:
                return "";
        }
    }


    public static class VerificationRequest {
        private Long startupId;
        private String email;
        private String code;

        public Long getStartupId() {
            return startupId;
        }

        public void setStartupId(Long startupId) {
            this.startupId = startupId;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }
    }
}