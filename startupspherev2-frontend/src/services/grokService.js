/**
 * Re-export Groq service for backward compatibility
 */
export * from "./groqService";
export {
  getGroqApiKey as getGrokApiKey,
  getGroqModel as getGrokModel,
  getGroqEndpoint as getGrokEndpoint,
  sendGroqChat as sendGrokChat,
  getGroqStartupSummary as getGrokStartupSummary,
} from "./groqService";
