import { getBackendUrl } from "../config/apiConfig";
import { sendGroqChat } from "../services/groqService";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Trash2, X, Bot, User, RotateCcw, ArrowLeft, Zap } from "lucide-react";

export default function GroqAiChat({ currentUser, onClose }) {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("startupsphere_ai_chat");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn("Failed to parse saved chat history, resetting", e);
      }
    }
    const userName = currentUser ? (currentUser.firstname || currentUser.name || "there") : "there";
    return [
      {
        role: "assistant",
        content: `Hello, ${userName}! Welcome to StartUpSphere Groq AI. I am your ultra-fast startup consultant powered by Groq LPUs.\n\nPlease feel free to ask me anything about:\n* **Startup Valuation & Cap Tables**\n* **Finding Investors & Ecosystem Matching**\n* **Business Compliance in the Philippines**\n* **Pitch Deck Strategies & Traction Metrics**\n* **Technology Trends & Readiness (TRL)**\n* **Ecosystem Index Insights (IDI, SI, EBS, EGS)**\n\nHow can I help you scale your venture today?`
      }
    ];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [userStartups, setUserStartups] = useState([]);
  const [fetchingDb, setFetchingDb] = useState(true);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Scroll to bottom whenever messages list changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    localStorage.setItem("startupsphere_ai_chat", JSON.stringify(messages));
  }, [messages]);

  // Auto-describe pinpointed startup from map heatmap
  useEffect(() => {
    const handleHeatmapClick = async (event) => {
      const startup = event?.detail;
      if (!startup) {
        // Try reading from localStorage as a fallback
        const pendingStr = localStorage.getItem("pending_ai_startup_desc");
        if (!pendingStr) return;
        localStorage.removeItem("pending_ai_startup_desc");
        try {
          describeStartup(JSON.parse(pendingStr));
        } catch (e) {
          console.error(e);
        }
      } else {
        localStorage.removeItem("pending_ai_startup_desc");
        describeStartup(startup);
      }
    };

    const describeStartup = async (startupInfo) => {
      const { id, companyName } = startupInfo;
      if (!id) return;

      try {
        // 1. Add the user's click message to the chat log
        const userMsgText = `Describe what the pinpointed startup "${companyName}" on the heatmap is all about.`;
        setMessages((prev) => [...prev, { role: "user", content: userMsgText }]);
        setLoading(true);

        const backendUrl = getBackendUrl() || "http://localhost:8080";

        // 2. Fetch the live database record for this startup
        let startupDetails = null;
        try {
          const detailRes = await fetch(`${backendUrl}/startups/${id}`, {
            credentials: "include"
          });
          if (detailRes.ok) {
            startupDetails = await detailRes.json();
          }
        } catch (e) {
          console.error("Groq AI failed to fetch pending startup details:", e);
        }

        // 3. Format dynamic system instructions and prompt
        const systemInstruction = 
          "You are the StartUpSphere Groq AI Consultant, an expert startup advisor and data analyst for the StartUpSphere platform powered by Groq. " +
          "You have direct, real-time read-only access to the platform's database and dashboard metrics. " +
          "Keep your tone sharp, engaging, highly professional, encouraging, and direct. Format your output nicely with clean bullet points and bold headers if needed.\n\n" +
          "**CRITICAL RESPONSE RULES:**\n" +
          "- The user has clicked on this startup's pinpoint/hotspot on the live map heatmap.\n" +
          "- Respond DIRECTLY by introducing and describing the startup based on its database record provided below.\n" +
          "- Make it simple and easy to learn. Describe what they do, their industry, location, and potential in engaging, layperson terms.\n" +
          "- Avoid conversational pleasantries (e.g. do NOT say 'Sure! Here is the description...'). Start your response directly with the startup's name and description.\n" +
          "- Limit the answer to 2-3 concise paragraphs.";

        let detailContext = `\n\n=== LIVE STARTUP DATABASE RECORD ===\n`;
        if (startupDetails) {
          detailContext += JSON.stringify(startupDetails, null, 2);
        } else {
          detailContext += `Startup ID: ${id}\nCompany Name: ${companyName}\n(Detailed record could not be retrieved from database, describe what is known or encourage the user to explore the startup card.)`;
        }

        const prompt = `${detailContext}\n\nUser Question: Describe what the pinpointed startup "${companyName}" on the heatmap is all about.`;

        const aiText = await sendGroqChat({
          systemInstruction,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        });

        setMessages((prev) => [...prev, { role: "assistant", content: aiText }]);
      } catch (err) {
        console.error("Failed to auto-describe startup from heatmap with Groq:", err);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `⚠️ Error loading map pinpoint description: ${err.message}` }
        ]);
      } finally {
        setLoading(false);
      }
    };

    // Register listener for heatmap clicks while open
    window.addEventListener("open-ai-chat-with-startup", handleHeatmapClick);

    // Also check on mount if there is a pending startup description in localStorage
    const pendingStr = localStorage.getItem("pending_ai_startup_desc");
    if (pendingStr) {
      localStorage.removeItem("pending_ai_startup_desc");
      try {
        describeStartup(JSON.parse(pendingStr));
      } catch (e) {
        console.error(e);
      }
    }

    return () => {
      window.removeEventListener("open-ai-chat-with-startup", handleHeatmapClick);
    };
  }, []);

  // Fetch live database and dashboard metrics on mount
  useEffect(() => {
    const fetchDatabaseDetails = async () => {
      try {
        setFetchingDb(true);
        const backendUrl = getBackendUrl() || "http://localhost:8080";
        
        // 1. Fetch Global Ecosystem Metrics
        try {
          const metricsRes = await fetch(`${backendUrl}/api/metrics/dashboard`, {
            credentials: "include"
          });
          if (metricsRes.ok) {
            const metricsData = await metricsRes.json();
            setDashboardMetrics(metricsData);
          }
        } catch (e) {
          console.error("Groq AI chat failed to fetch global metrics:", e);
        }

        // 2. Fetch User's Startups & their details
        try {
          const startupsRes = await fetch(`${backendUrl}/startups/my-startups/details`, {
            credentials: "include"
          });
          if (startupsRes.ok) {
            const startupsList = await startupsRes.json();
            
            // 3. For each startup, fetch metrics
            const enrichedStartups = await Promise.all(
              startupsList.map(async (startup) => {
                try {
                  const [likesRes, bookmarksRes, viewsRes] = await Promise.all([
                    fetch(`${backendUrl}/api/likes/count/startup/${startup.id}`, { credentials: "include" }),
                    fetch(`${backendUrl}/api/bookmarks/count/startup/${startup.id}`, { credentials: "include" }),
                    fetch(`${backendUrl}/startups/${startup.id}/view-count`, { credentials: "include" })
                  ]);
                  const likes = likesRes.ok ? await likesRes.json() : 0;
                  const bookmarks = bookmarksRes.ok ? await bookmarksRes.json() : 0;
                  const views = viewsRes.ok ? await viewsRes.json() : 0;
                  return { ...startup, likes, bookmarks, views };
                } catch (err) {
                  console.error(`AI failed to fetch metrics for startup ${startup.id}:`, err);
                  return startup;
                }
              })
            );
            
            setUserStartups(enrichedStartups);
          }
        } catch (e) {
          console.error("Groq AI chat failed to fetch user startups:", e);
        }
      } catch (err) {
        console.error("Failed to load database context for Groq AI:", err);
      } finally {
        setFetchingDb(false);
      }
    };

    fetchDatabaseDetails();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      // Format system instructions for Groq API
      let systemInstruction = 
        "You are StartUpSphere Groq AI Consultant, an expert startup advisor, venture strategist, and data analyst for the StartUpSphere platform powered by Groq LPU inference. " +
        "You have direct, real-time read-only access to the platform's database and dashboard metrics. " +
        "You help founders, investors, and stakeholders gain insights into business growth, funding stages, technology readiness levels (TRL), cap tables, and government compliance (BIR, SEC, DTI). " +
        "Keep your tone sharp, engaging, highly professional, encouraging, and direct. Format your output with clear executive summaries, bullet points, and bold headers.\n\n" +
        "**CRITICAL RESPONSE RULES:**\n" +
        "- Focus DIRECTLY on the requested data and deliver clear, high-value insights. Eliminate conversational filler, pleasantries, or preambles (do NOT say 'Sure! Here is the data', 'I'd be glad to help', or 'Here is a breakdown'). Start directly with the core summary or answer.\n" +
        "- Structure your summaries into 3 intuitive parts:\n" +
        "   1. **📌 Executive Summary**: 2 punchy, crystal-clear sentences delivering the high-level takeaway.\n" +
        "   2. **📊 Key Metrics & Details**: Clean bulleted highlights with bold metric values, intuitive context, and plain-language definitions.\n" +
        "   3. **💡 Strategic Action Items**: 2-3 concrete, prioritized recommendations for the user or founder.\n" +
        "- Explain complex metrics in layperson terms:\n" +
        "   • **TRL (Technology Readiness Level)**: Technology maturity scale (TRL 1-3 Concept, TRL 4-6 Prototype/Validation, TRL 7-9 Commercial/Market-Ready).\n" +
        "   • **IDI (Innovation Density)**: Concentration of active startups in a geographic or industry hub.\n" +
        "   • **SI (Support Index)**: Depth of incubation, accelerator, and academic lab backing.\n" +
        "   • **EBS (Ecosystem Balance Score)**: Health between startup demand and support resources (0-10 scale).\n" +
        "   • **EGS (Ecosystem Gap Score)**: Deficits in capital, mentorship, or regulatory backing (lower is better).\n" +
        "   • **Government Compliance**: State of BIR (tax), SEC (corporate), and DTI (sole proprietorship) registration.\n" +
        "- Format tables using standard markdown tables or formatted bullet lists for readability on all devices.";

      // Security & Privacy: Limit AI context strictly to name and platform role.
      if (currentUser) {
        const sanitizedName = `${currentUser.firstname || ""} ${currentUser.lastname || ""}`.trim();
        const sanitizedRole = currentUser.role || "USER";
        
        systemInstruction += ` The user you are talking to is logged in. Their profile details are: Name: ${sanitizedName}, Platform Role: ${sanitizedRole}. Refer to them by name if appropriate to make the conversation personalized and premium!`;
      }

      // Inject Live System Database Context into the prompt
      let dbContext = "\n\n=== LIVE SYSTEM DATABASE & DASHBOARD CONTEXT ===";
      if (dashboardMetrics) {
        dbContext += `\n**Global Platform Ecosystem Stats:**` +
          `\n- Total Registered Startups: ${dashboardMetrics.totalStartups}` +
          `\n- Total Registered SMEs: ${dashboardMetrics.totalSmes}` +
          `\n- Total Support Entities: ${dashboardMetrics.totalSupportEntities} (including ${dashboardMetrics.totalSupport} general support, ${dashboardMetrics.totalHei} Higher Education Institutions, ${dashboardMetrics.totalGov} Government units, ${dashboardMetrics.totalResearch} Research bodies)` +
          `\n- Innovation Density Index (IDI): ${dashboardMetrics.idi}` +
          `\n- Support Index (SI): ${dashboardMetrics.si}` +
          `\n- Ecosystem Balance Score (EBS): ${dashboardMetrics.ebs}` +
          `\n- Ecosystem Gap Score (EGS): ${dashboardMetrics.egs}`;
      } else {
        dbContext += `\nNo global platform metrics could be retrieved. Default to explaining the concept of IDI, SI, EBS, and EGS conceptually.`;
      }

      if (userStartups && userStartups.length > 0) {
        dbContext += `\n\n**The Logged-in User's Startups & Performance Metrics:**`;
        userStartups.forEach((startup, i) => {
          dbContext += `\n${i + 1}. "${startup.companyName}" (Industry: ${startup.industry || "N/A"}, Location: ${startup.locationName || "N/A"})` +
            `\n   - Views: ${startup.views || 0} | Likes: ${startup.likes || 0} | Bookmarks: ${startup.bookmarks || 0}`;
        });
      } else {
        dbContext += `\n\nUser does not have any registered startups yet. Encourage them to add one to see live metrics!`;
      }

      systemInstruction += dbContext;

      // Send chat history and prompt to Groq
      const historyToSend = messages.slice(-10); // Keep last 10 messages for rich conversational context
      const aiText = await sendGroqChat({
        systemInstruction,
        messages: [...historyToSend, { role: "user", content: userMessage }],
        temperature: 0.7,
      });

      setMessages((prev) => [...prev, { role: "assistant", content: aiText }]);
    } catch (error) {
      console.error("Groq AI error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ Error: ${error.message}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    const initialMsg = [
      {
        role: "assistant",
        content: "Hello! Chat cleared. Groq AI is ready to advise you on your next big startup idea, finding partners, or platform mechanics on StartUpSphere!"
      }
    ];
    setMessages(initialMsg);
    localStorage.removeItem("startupsphere_ai_chat");
  };

  return (
    <motion.div
      data-theme="light"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-x-0 top-14 bottom-16 md:top-0 md:bottom-0 md:right-0 md:left-auto z-40 md:z-[110] h-[calc(100vh-120px)] md:h-screen sidebar-drawer-420 border-l border-gray-200 bg-white text-gray-800 shadow-[-10px_0_30px_rgba(0,0,0,0.12)] flex flex-col"
      style={{
        width: isMobile ? "100%" : "420px",
        maxWidth: isMobile ? "100vw" : "420px",
      }}
    >
      {/* Header with High-Contrast Background & Prominent Back Button */}
      <div
        className="p-3.5 sm:p-4 text-white flex items-center justify-between shadow-md relative overflow-hidden flex-shrink-0"
        style={{
          backgroundColor: "#0f172a",
          backgroundImage: "linear-gradient(135deg, #090d16 0%, #1e1b4b 50%, #0f172a 100%)",
        }}
      >
        {/* Shimmering glass effects */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16 pointer-events-none blur-xl"></div>

        <div className="flex items-center space-x-2.5 relative z-10 min-w-0">
          {/* Prominent Back Button */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all text-xs font-semibold cursor-pointer border border-white/15 shadow-xs focus:outline-none flex-shrink-0"
            aria-label="Back"
            title="Back to Map / Dashboard"
          >
            <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
            <span className="font-medium">Back</span>
          </button>

          <div className="p-2 bg-gradient-to-tr from-orange-500/30 to-indigo-500/30 rounded-xl backdrop-blur-sm border border-orange-400/30 flex items-center justify-center shadow-inner flex-shrink-0">
            <Zap className="h-4.5 w-4.5 text-amber-300" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm sm:text-base text-white tracking-wide leading-tight truncate">
                StartUpSphere AI
              </h3>
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-orange-500/30 border border-orange-400/40 rounded text-amber-200 tracking-wider uppercase">
                Groq
              </span>
            </div>
            <div className="flex items-center text-xs font-medium text-emerald-300 mt-0.5">
              <span className="relative flex h-2 w-2 mr-1.5 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span className="text-emerald-200 font-semibold tracking-wide text-[11px] truncate">
                Powered by Groq LPUs
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1 relative z-10 flex-shrink-0 ml-2">
          <button
            type="button"
            onClick={clearChat}
            className="p-2 hover:bg-white/15 rounded-lg transition-colors border-0 bg-transparent text-white/80 hover:text-white cursor-pointer"
            title="Clear Chat"
            aria-label="Clear Chat"
          >
            <Trash2 className="h-4.5 w-4.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/15 rounded-lg transition-colors border-0 bg-transparent text-white/80 hover:text-white cursor-pointer"
            title="Close Assistant"
            aria-label="Close Assistant"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Message List Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex items-start max-w-[85%] space-x-2 ${msg.role === "user" ? "flex-row-reverse space-x-reverse" : "flex-row"}`}>
                {/* Avatar Icon */}
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shadow-sm flex-shrink-0 ${
                  msg.role === "user" 
                    ? "bg-indigo-600 text-white" 
                    : "bg-gradient-to-br from-slate-900 to-indigo-900 text-white border border-slate-700"
                }`}>
                  {msg.role === "user" ? (
                    <User className="h-4.5 w-4.5" />
                  ) : (
                    <Zap className="h-4 w-4 text-amber-400" />
                  )}
                </div>

                {/* Message Bubble */}
                <div className={`p-3 rounded-2xl shadow-sm text-sm leading-relaxed border ${
                  msg.role === "user" 
                    ? "bg-indigo-600 text-white border-indigo-600 rounded-tr-none" 
                    : "bg-white text-gray-800 border-gray-100 rounded-tl-none"
                }`}>
                  <div className="space-y-1">
                    {renderFormattedContent(msg.content, msg.role)}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Typing Loading State */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex items-start max-w-[85%] space-x-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-900 to-indigo-900 text-amber-400 border border-slate-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Zap className="h-4 w-4 animate-pulse text-amber-300" />
                </div>
                <div className="bg-white text-gray-500 border border-gray-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-2">
                  <span className="text-xs text-gray-500 font-medium">Groq is thinking</span>
                  <div className="flex space-x-1">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Footer Input Area */}
      <form onSubmit={handleSend} className="p-3.5 sm:p-4 bg-white border-t border-gray-200 flex items-center space-x-2 shadow-[0_-4px_15px_rgba(0,0,0,0.03)]">
        <button
          type="button"
          onClick={clearChat}
          className="h-10 w-10 sm:h-11 sm:w-11 flex items-center justify-center rounded-xl bg-gray-50 text-gray-600 hover:bg-red-500 hover:text-white hover:border-red-600 transition-all cursor-pointer border border-gray-300 shadow-sm flex-shrink-0"
          title="Reset Conversation"
        >
          <RotateCcw className="h-4.5 w-4.5 stroke-[2.2]" />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Groq AI Consultant..."
          disabled={loading}
          className="flex-1 px-3.5 py-2.5 sm:px-4 sm:py-3 bg-gray-50/70 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white disabled:opacity-50 transition-all shadow-inner font-medium"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className={`h-10 w-10 sm:h-11 sm:w-11 flex items-center justify-center rounded-xl transition-all cursor-pointer shadow-md flex-shrink-0 border ${
            !input.trim() || loading
              ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed shadow-none"
              : "bg-indigo-600 hover:bg-indigo-700 border-indigo-700 shadow-indigo-200/50"
          }`}
          title="Send Message to Groq"
        >
          <Send className={`h-4.5 w-4.5 sm:h-5 sm:w-5 stroke-[2.2] ${!input.trim() || loading ? "text-gray-400" : "text-white"}`} />
        </button>
      </form>
    </motion.div>
  );
}

function renderFormattedContent(text, role) {
  if (!text) return null;

  const rawLines = text.split("\n");
  const isUser = role === "user";

  const textColor = isUser ? "text-white" : "text-gray-700";
  const headerColor = isUser ? "text-white" : "text-gray-900";
  const listDotColor = isUser ? "text-white" : "text-gray-700";

  const elements = [];
  let tableBuffer = [];

  const flushTable = (keyPrefix) => {
    if (tableBuffer.length === 0) return;
    
    // Parse table rows
    const rows = tableBuffer
      .filter((r) => !r.match(/^\|\s*[-:]+[-| :]*\|$/)) // Filter out markdown separator line
      .map((r) => {
        return r
          .split("|")
          .map((c) => c.trim())
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      });

    if (rows.length > 0) {
      const headerRow = rows[0];
      const bodyRows = rows.slice(1);
      elements.push(
        <div key={`table-${keyPrefix}`} className="my-2.5 overflow-x-auto rounded-lg border border-gray-200/80 shadow-xs">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50/80 font-bold text-gray-800">
              <tr>
                {headerRow.map((cell, cIdx) => (
                  <th key={cIdx} className="px-3 py-2 text-left font-semibold">
                    {parseInlineFormatting(cell, isUser)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-white" : "bg-gray-50/40"}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3 py-1.5 text-gray-700 font-normal">
                      {parseInlineFormatting(cell, isUser)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    tableBuffer = [];
  };

  rawLines.forEach((line, lineIndex) => {
    const trimmed = line.trim();

    // Check if line is part of a markdown table
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      tableBuffer.push(trimmed);
      return;
    } else {
      flushTable(lineIndex);
    }

    // 1. Handle Headers
    if (line.startsWith("### ")) {
      elements.push(
        <h5 key={lineIndex} className={`font-bold text-sm mt-3 mb-1.5 ${headerColor}`}>
          {parseInlineFormatting(line.substring(4), isUser)}
        </h5>
      );
      return;
    }
    if (line.startsWith("## ") || line.startsWith("##")) {
      const cleanLine = line.startsWith("## ") ? line.substring(3) : line.substring(2);
      elements.push(
        <h4 key={lineIndex} className={`font-bold text-base mt-4 mb-2 ${headerColor}`}>
          {parseInlineFormatting(cleanLine, isUser)}
        </h4>
      );
      return;
    }
    if (line.startsWith("# ")) {
      elements.push(
        <h3 key={lineIndex} className={`font-bold text-lg mt-4 mb-2 ${headerColor} border-b ${isUser ? 'border-white/20' : 'border-gray-100'} pb-1`}>
          {parseInlineFormatting(line.substring(2), isUser)}
        </h3>
      );
      return;
    }

    // 2. Handle Blockquotes / Callout Highlights
    if (line.startsWith("> ")) {
      elements.push(
        <div key={lineIndex} className={`p-2.5 my-2 rounded-lg border-l-4 ${isUser ? 'bg-white/10 border-white text-white' : 'bg-indigo-50/70 border-indigo-500 text-indigo-900'} text-xs font-medium`}>
          {parseInlineFormatting(line.substring(2), isUser)}
        </div>
      );
      return;
    }

    // 3. Handle Bullet Lists
    if (line.startsWith("* ") || line.startsWith("- ")) {
      elements.push(
        <li key={lineIndex} className={`list-disc list-inside ml-2.5 my-1 ${listDotColor}`}>
          {parseInlineFormatting(line.substring(2), isUser)}
        </li>
      );
      return;
    }

    // 4. Handle Numbered Lists
    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <div key={lineIndex} className="flex items-start gap-2 my-1.5 ml-1">
          <span className={`inline-flex items-center justify-center h-4.5 w-4.5 rounded-full text-[10px] font-bold flex-shrink-0 ${isUser ? 'bg-white text-indigo-600' : 'bg-indigo-100 text-indigo-700'}`}>
            {numMatch[1]}
          </span>
          <span className={`${textColor} text-xs leading-relaxed`}>
            {parseInlineFormatting(numMatch[2], isUser)}
          </span>
        </div>
      );
      return;
    }

    // 5. Empty spacer
    if (trimmed === "") {
      elements.push(<div key={lineIndex} className="h-1.5" />);
      return;
    }

    // 6. Standard paragraphs
    elements.push(
      <p key={lineIndex} className={`my-1.5 ${textColor} leading-relaxed text-xs sm:text-sm`}>
        {parseInlineFormatting(line, isUser)}
      </p>
    );
  });

  flushTable("end");
  return elements;
}

function parseInlineFormatting(text, isUser) {
  const tokens = [];
  let remaining = text;

  while (remaining) {
    const boldMatch = remaining.match(/(\*\*|__)(.*?)\1/);
    const italicMatch = remaining.match(/(\*|_)(.*?)\1/);
    const underlineMatch = remaining.match(/<u>(.*?)<\/u>/i);

    let firstMatch = null;
    let type = null;

    if (boldMatch && (!firstMatch || boldMatch.index < firstMatch.index)) {
      firstMatch = boldMatch;
      type = "bold";
    }
    if (italicMatch && (!firstMatch || italicMatch.index < firstMatch.index)) {
      firstMatch = italicMatch;
      type = "italic";
    }
    if (underlineMatch && (!firstMatch || underlineMatch.index < firstMatch.index)) {
      firstMatch = underlineMatch;
      type = "underline";
    }

    if (!firstMatch) {
      tokens.push({ type: "text", content: remaining });
      break;
    }

    if (firstMatch.index > 0) {
      tokens.push({
        type: "text",
        content: remaining.substring(0, firstMatch.index),
      });
    }

    tokens.push({
      type: type,
      content: firstMatch[2] || firstMatch[1],
    });

    remaining = remaining.substring(firstMatch.index + firstMatch[0].length);
  }

  return tokens.map((token, index) => {
    switch (token.type) {
      case "bold":
        return <strong key={index} className={`font-extrabold ${isUser ? "text-white" : "text-gray-900"}`}>{token.content}</strong>;
      case "italic":
        return <em key={index} className={`italic ${isUser ? "text-white" : "text-gray-800"}`}>{token.content}</em>;
      case "underline":
        return <span key={index} className={`underline ${isUser ? "decoration-white" : "decoration-indigo-400"} decoration-2`}>{token.content}</span>;
      default:
        return token.content;
    }
  });
}
