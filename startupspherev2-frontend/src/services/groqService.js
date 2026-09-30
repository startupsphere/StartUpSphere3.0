/**
 * Groq AI Service for StartUpSphere
 * Handles communication with Groq Cloud's ultra-fast LPU OpenAI-compatible chat endpoints.
 */

export const getGroqApiKey = () => {
  return (
    import.meta.env.VITE_GROQ_API_KEY ||
    import.meta.env.VITE_GROK_API_KEY ||
    ""
  );
};

export const getGroqModel = () => {
  return import.meta.env.VITE_GROQ_MODEL || "openai/gpt-oss-120b";
};

export const getGroqEndpoint = () => {
  // If custom API URL provided in env
  if (import.meta.env.VITE_GROQ_API_URL) {
    return import.meta.env.VITE_GROQ_API_URL;
  }
  // Default to local/Vercel proxy path to bypass browser CORS restrictions
  return "/groq-proxy/openai/v1/chat/completions";
};

/**
 * Sends a chat completion request to Groq Cloud.
 * Automatically falls back to direct Groq URL if proxy is unavailable.
 *
 * @param {Object} options
 * @param {Array<{role: string, content: string}>} options.messages - Chat history
 * @param {string} [options.systemInstruction] - System prompt for the persona
 * @param {number} [options.temperature=0.7] - Temperature parameter
 * @param {number} [options.maxTokens] - Optional maximum completion tokens
 * @returns {Promise<string>} The assistant's text response
 */
export async function sendGroqChat({
  messages = [],
  systemInstruction = "",
  temperature = 0.7,
  maxTokens,
}) {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    throw new Error(
      "Groq API key is not configured. Please add VITE_GROQ_API_KEY to your .env file."
    );
  }

  const model = getGroqModel();
  const formattedMessages = [];

  if (systemInstruction && systemInstruction.trim()) {
    formattedMessages.push({
      role: "system",
      content: systemInstruction.trim(),
    });
  }

  // Format existing messages
  messages.forEach((msg) => {
    if (msg.role && msg.content) {
      formattedMessages.push({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      });
    }
  });

  const payload = {
    model,
    messages: formattedMessages,
    temperature,
    stream: false,
  };

  if (maxTokens) {
    payload.max_tokens = maxTokens;
  }

  const primaryEndpoint = getGroqEndpoint();
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  let response;
  try {
    response = await fetch(primaryEndpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    // If local proxy returned 404/502 and endpoint was relative, try direct Groq endpoint as fallback
    if (
      !response.ok &&
      primaryEndpoint.startsWith("/") &&
      (response.status === 404 || response.status === 502)
    ) {
      console.warn(`Groq proxy (${primaryEndpoint}) returned ${response.status}, attempting direct Groq endpoint...`);
      response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
    }
  } catch (networkError) {
    // If proxy failed due to network error and primary was relative, try direct
    if (primaryEndpoint.startsWith("/")) {
      console.warn("Groq proxy network error, trying direct Groq endpoint...", networkError);
      response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
    } else {
      throw networkError;
    }
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg =
      (typeof data?.error === "string" ? data.error : data?.error?.message) ||
      data?.message ||
      `Groq API request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  const aiText =
    data?.choices?.[0]?.message?.content ||
    "I apologize, but I couldn't generate a response. Please try again.";

  return aiText;
}

/**
 * Summarizes a startup for map popups using Groq
 * @param {Object} details - Startup database object
 * @returns {Promise<string>}
 */
export async function getGroqStartupSummary(details) {
  const systemInstruction =
    "You are the StartUpSphere AI Analyst powered by Groq. Summarize this startup's business model, technology readiness level (TRL), and potential strength in 2-3 sentences or clear bullet points.\n" +
    "Keep it simple, punchy, and direct. Do NOT include preambles, introductory phrases, or conversational filler (e.g. do not say 'Sure! Here is...', or 'Based on the details...'). Start your response directly with the business insights.\n" +
    "Limit the summary to exactly 70-90 words to fit cleanly in a map popup bubble.";

  const prompt = `=== STARTUP DATABASE DETAILS ===\n${JSON.stringify(details, null, 2)}\n\nGenerate startup analysis summary:`;

  return sendGroqChat({
    systemInstruction,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.5,
    maxTokens: 250,
  });
}
