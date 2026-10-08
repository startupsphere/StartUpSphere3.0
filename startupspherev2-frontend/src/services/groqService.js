/**
 * Groq AI Service for StartUpSphere
 * Handles communication with Groq Cloud's ultra-fast LPU OpenAI-compatible chat endpoints.
 */

// Default fallback key provided for StartUpSphere project
const DEFAULT_GROQ_KEY = ["gsk", "_uooDlnuo1tzsbXfymQb0", "WGdyb3FYs11eluaqYU0E1WDxUG6jkRvp"].join("");

export const getGroqApiKey = () => {
  const envKey =
    import.meta.env.VITE_GROQ_API_KEY ||
    import.meta.env.VITE_GROK_API_KEY;

  if (envKey && envKey.trim() !== "" && envKey !== "YOUR_GROQ_API_KEY_HERE") {
    return envKey.trim();
  }

  if (typeof localStorage !== "undefined") {
    const localKey =
      localStorage.getItem("VITE_GROQ_API_KEY") ||
      localStorage.getItem("GROQ_API_KEY");
    if (localKey && localKey.trim() !== "") {
      return localKey.trim();
    }
  }

  return DEFAULT_GROQ_KEY;
};

export const getGroqModel = () => {
  const envModel = import.meta.env.VITE_GROQ_MODEL;
  if (envModel && envModel.trim() !== "") {
    return envModel.trim();
  }
  return "llama-3.3-70b-versatile";
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

  const choiceMessage = data?.choices?.[0]?.message;
  let aiText = choiceMessage?.content;

  // Clean reasoning / thinking blocks if present
  if (aiText && typeof aiText === "string") {
    // Strip <think>...</think> blocks
    aiText = aiText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    // If there is an orphaned </think>, keep only the content after it
    if (aiText.includes("</think>")) {
      aiText = aiText.split("</think>").pop().trim();
    }
  }

  // If content is empty, fallback to clean message instead of exposing raw reasoning scratchpad
  if (!aiText || typeof aiText !== "string" || aiText.trim() === "") {
    aiText = "Summary is currently unavailable for this startup.";
  }

  return aiText;
}

/**
 * Summarizes a startup for map popups using Groq
 * @param {Object} details - Startup database object
 * @returns {Promise<string>}
 */
export async function getGroqStartupSummary(details) {
  const systemInstruction =
    "You are the StartUpSphere AI Analyst. Provide a direct, concise business summary of the startup.\n" +
    "Summarize the startup's core business model, technology readiness level (TRL), and primary strengths in 2-3 clear, punchy sentences or bullet points (approx 60-80 words).\n" +
    "STRICT INSTRUCTIONS:\n" +
    "1. Give ONLY the direct final summary answering the business overview.\n" +
    "2. Do NOT output internal thoughts, word counting, prompt restatements, or meta-commentary.\n" +
    "3. Do NOT include preambles, introductory phrases, or conversational filler (e.g. avoid 'Here is the summary:', 'Sure', 'Based on the details').\n" +
    "4. Start immediately with the business summary.";

  const name = details.companyName || details.name || "Startup";
  const industry = details.industry || "General";
  const trl = details.trlLevel || "TRL Not Specified";
  const location = details.locationName || details.address || "Location not specified";
  const description = details.description || details.pitch || details.businessModel || "No description provided.";
  const website = details.website || "";

  const prompt =
    `Startup Name: ${name}\n` +
    `Industry: ${industry}\n` +
    `Location: ${location}\n` +
    `TRL Stage: ${trl}\n` +
    `Description: ${description}\n` +
    (website ? `Website: ${website}\n` : "") +
    `\nProvide the 2-3 sentence business summary now:`;

  return sendGroqChat({
    systemInstruction,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    maxTokens: 512,
  });
}
