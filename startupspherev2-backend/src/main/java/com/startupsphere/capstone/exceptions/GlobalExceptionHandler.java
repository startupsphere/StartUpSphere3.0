package com.startupsphere.capstone.exceptions;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.security.SignatureException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AccountStatusException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleSecurityException(Exception exception) {
        ProblemDetail errorDetail;

        exception.printStackTrace();

        if (exception instanceof BadCredentialsException) {
            errorDetail = ProblemDetail.forStatusAndDetail(HttpStatusCode.valueOf(401), "Incorrect email or password. Please check your credentials and try again.");
            errorDetail.setProperty("description", "The email or password you entered is incorrect.");
            return errorDetail;
        }

        if (exception instanceof AccountStatusException) {
            errorDetail = ProblemDetail.forStatusAndDetail(HttpStatusCode.valueOf(403), "Account disabled or locked. Please contact support.");
            errorDetail.setProperty("description", "The account is locked or disabled.");
            return errorDetail;
        }

        if (exception instanceof AccessDeniedException) {
            errorDetail = ProblemDetail.forStatusAndDetail(HttpStatusCode.valueOf(403), "You do not have permission to access this resource.");
            errorDetail.setProperty("description", "You are not authorized to access this resource.");
            return errorDetail;
        }

        if (exception instanceof SignatureException) {
            errorDetail = ProblemDetail.forStatusAndDetail(HttpStatusCode.valueOf(403), "Session authentication invalid. Please log in again.");
            errorDetail.setProperty("description", "The JWT signature is invalid.");
            return errorDetail;
        }

        if (exception instanceof ExpiredJwtException) {
            errorDetail = ProblemDetail.forStatusAndDetail(HttpStatusCode.valueOf(403), "Your session has expired. Please log in again.");
            errorDetail.setProperty("description", "The JWT token has expired.");
            return errorDetail;
        }

        if (exception instanceof DataIntegrityViolationException || isDatabaseException(exception)) {
            String friendlyMsg = getFriendlyDatabaseMessage(exception);
            errorDetail = ProblemDetail.forStatusAndDetail(HttpStatusCode.valueOf(400), friendlyMsg);
            errorDetail.setProperty("description", friendlyMsg);
            return errorDetail;
        }

        String userFriendlyMsg = sanitizeErrorMessage(exception.getMessage());
        errorDetail = ProblemDetail.forStatusAndDetail(HttpStatusCode.valueOf(500), userFriendlyMsg);
        errorDetail.setProperty("description", "An error occurred while processing your request. Please try again.");

        return errorDetail;
    }

    private boolean isDatabaseException(Exception ex) {
        String msg = ex.getMessage() != null ? ex.getMessage().toLowerCase() : "";
        return msg.contains("constraint") || msg.contains("sql") || msg.contains("hibernate") || msg.contains("duplicate key") || msg.contains("users_pkey");
    }

    private String getFriendlyDatabaseMessage(Exception ex) {
        String msg = ex.getMessage() != null ? ex.getMessage().toLowerCase() : "";
        if (msg.contains("users_pkey") || (msg.contains("duplicate key") && msg.contains("id"))) {
            return "An account registration conflict occurred. Please try submitting again.";
        }
        if (msg.contains("email") && (msg.contains("duplicate") || msg.contains("unique"))) {
            return "This email address is already registered. Please sign in or use a different email.";
        }
        if (msg.contains("not-null") || msg.contains("null value")) {
            return "Please ensure all required fields are filled out correctly.";
        }
        return "We encountered a database error while saving your data. Please try again.";
    }

    private String sanitizeErrorMessage(String rawMessage) {
        if (rawMessage == null || rawMessage.trim().isEmpty()) {
            return "An unexpected error occurred. Please try again.";
        }
        String msgLower = rawMessage.toLowerCase();
        if (msgLower.contains("could not execute statement") || msgLower.contains("sql [") || msgLower.contains("hibernate") || msgLower.contains("violates unique constraint")) {
            return "A system error occurred while completing your request. Please try again later.";
        }
        return rawMessage;
    }
}
