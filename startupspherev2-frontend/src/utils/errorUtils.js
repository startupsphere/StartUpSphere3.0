/**
 * Utility function to translate raw technical, IT, or database error messages into
 * simple, clear, and non-technical plain English messages for end users.
 *
 * @param {Error|string|object} err - Raw error object or string
 * @returns {string} Human-friendly error message
 */
export function formatErrorMessage(err) {
  if (!err) return "An unexpected error occurred. Please try again.";

  let raw = "";

  if (typeof err === "string") {
    raw = err;
  } else if (err?.error && typeof err.error === "string") {
    raw = err.error;
  } else if (err?.message && typeof err.message === "string") {
    raw = err.message;
  } else if (err?.description && typeof err.description === "string") {
    raw = err.description;
  } else {
    try {
      raw = JSON.stringify(err);
    } catch {
      raw = String(err);
    }
  }

  const msgLower = raw.toLowerCase();

  // Primary Key Duplicate / Constraint Violation / Database Sequence Out of Sync
  if (
    msgLower.includes("users_pkey") ||
    msgLower.includes("violates unique constraint") ||
    msgLower.includes("duplicate key value")
  ) {
    if (msgLower.includes("email")) {
      return "An account with this email address already exists. Please sign in or use a different email.";
    }
    return "An account registration conflict occurred. Please try submitting again.";
  }

  // Generic SQL / Database errors
  if (
    msgLower.includes("could not execute statement") ||
    msgLower.includes("sql [") ||
    msgLower.includes("hibernate") ||
    msgLower.includes("jdbc") ||
    msgLower.includes("constraint [")
  ) {
    return "We couldn't save your request due to a temporary system issue. Please try submitting again.";
  }

  // Duplicate email
  if (msgLower.includes("email already exists") || msgLower.includes("already registered")) {
    return "This email address is already registered. Please sign in or use a different email.";
  }

  // Network / Server Connectivity
  if (
    msgLower.includes("failed to fetch") ||
    msgLower.includes("networkerror") ||
    msgLower.includes("econnrefused") ||
    msgLower.includes("net::err")
  ) {
    return "Unable to connect to the server. Please check your internet connection and try again.";
  }

  // Authentication & Authorization
  if (
    msgLower.includes("bad credentials") ||
    msgLower.includes("invalid email or password") ||
    msgLower.includes("unauthorized") ||
    msgLower.includes("401")
  ) {
    return "Invalid email or password. Please double check and try again.";
  }

  if (
    msgLower.includes("access is denied") ||
    msgLower.includes("403") ||
    msgLower.includes("forbidden")
  ) {
    return "You do not have permission to perform this action.";
  }

  if (
    msgLower.includes("jwt") ||
    msgLower.includes("token has expired") ||
    msgLower.includes("session expired")
  ) {
    return "Your session has expired. Please sign in again.";
  }

  // Server errors
  if (msgLower.includes("500") || msgLower.includes("internal server error")) {
    return "Our server encountered a temporary issue. Please try again in a few moments.";
  }

  if (
    msgLower.includes("invalid response from server") ||
    msgLower.includes("syntaxerror") ||
    msgLower.includes("json.parse")
  ) {
    return "We received an unexpected response from the server. Please refresh and try again.";
  }

  // Strip IT prefixes like "Registration failed: " if followed by technical jargon
  if (raw.startsWith("Registration failed:")) {
    const detail = raw.replace("Registration failed:", "").trim();
    if (detail.toLowerCase().includes("sql") || detail.toLowerCase().includes("could not execute")) {
      return "Registration could not be completed right now. Please try submitting again.";
    }
  }

  // If message contains technical syntax (SQL syntax, square brackets with queries, stack frames), replace with generic clean text
  if (
    /[\[\]{}]/.test(raw) &&
    (msgLower.includes("select") || msgLower.includes("insert") || msgLower.includes("update") || msgLower.includes("org.hibernate"))
  ) {
    return "An error occurred while processing your request. Please try again.";
  }

  return raw;
}
