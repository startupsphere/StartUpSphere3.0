import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Trash2, X, Bot, User, RotateCcw } from "lucide-react";

export default function GeminiAiChat({ currentUser, onClose }) {
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
        content: `Hello, ${userName}! Welcome back to StartUpSphere. I'm ready to assist you.\n\nPlease feel free to ask me anything about:\n* **Startup Valuation**\n* **Finding Investors**\n* **Business Compliance in the Philippines**\n* **Pitch Deck Strategies**\n* **Technology Trends**\n* **Business Growth Insights**\n\nHow can I help you today?`
      }
    ];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [userStartups, setUserStartups] = useState([]);
  const [fetchingDb, setFetchingDb] = useState(true);

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

        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error("Gemini API key is not configured.");

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
          console.error("AI failed to fetch pending startup details:", e);
        }

        // 3. Format dynamic system instructions and prompt
        let systemInstruction = 
          "You are the StartUpSphere AI Consultant, an expert startup advisor and data analyst for the StartUpSphere platform. " +
          "You have direct, real-time read-only access to the platform's database and dashboard metrics. " +
          "Keep your tone highly professional, encouraging, inspiring, and direct. Format your output nicely with clean bullet points and bold headers if needed.\n\n" +
          "**CRITICAL RESPONSE RULES:**\n" +
          "- The user has clicked on this startup's pinpoint/hotspot on the live map heatmap.\n" +
          "- Respond DIRECTLY by introducing and describing the startup based on its database record provided below.\n" +
          "- Make it simple and easy to learn. Describe what they do, their industry, location, and potential in extremely engaging, layperson terms.\n" +
          "- Avoid conversational pleasantries (e.g. do NOT say 'Sure! Here is the description...'). Start your response directly with the startup's name and description.\n" +
          "- Limit the answer to 2-3 concise paragraphs.";

        let detailContext = `\n\n=== LIVE STARTUP DATABASE RECORD ===\n`;
        if (startupDetails) {
          detailContext += JSON.stringify(startupDetails, null, 2);
        } else {
          detailContext += `Startup ID: ${id}\nCompany Name: ${companyName}\n(Detailed record could not be retrieved from database, describe what is known or encourage the user to explore the startup card.)`;
        }

        // Build prompt with context
        const fullPrompt = `${systemInstruction}\n\n${detailContext}\n\nUser: Describe what the pinpointed startup "${companyName}" on the heatmap is all about.\nAssistant:`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: fullPrompt }] }]
            })
          }
        );

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "Failed to generate content");

        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I apologize, but I couldn't generate a description for this startup.";
        setMessages((prev) => [...prev, { role: "assistant", content: aiText }]);
      } catch (err) {
        console.error("Failed to auto-describe startup from heatmap:", err);
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

    // Also check on mount if there is a pending startup description in localStorage (handles first open)
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
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
        
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
          console.error("AI chat failed to fetch global metrics:", e);
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
          console.error("AI chat failed to fetch user startups:", e);
        }
      } catch (err) {
        console.error("Failed to load database context for AI:", err);
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
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API key is not configured in .env file.");
      }

      // Format chat history and system instructions for Gemini API
      let systemInstruction = 
        "You are the StartUpSphere AI Consultant, an expert startup advisor and data analyst for the StartUpSphere platform. " +
        "You have direct, real-time read-only access to the platform's database and dashboard metrics. " +
        "You help founders, investors, and stakeholders gain insights into business growth, funding stages, technology trends, and compliance. " +
        "Keep your tone highly professional, encouraging, inspiring, and direct. Format your output nicely with clean bullet points and bold headers if needed.\n\n" +
        "**CRITICAL RESPONSE RULES:**\n" +
        "- Focus DIRECTLY and strictly on the numbers, data, and answers requested. Remove any unnecessary text responses, conversational fluff, preambles, introductory statements, or pleasantries (e.g. do NOT say 'Sure! Here is the data you requested', 'I'd be happy to help!', or 'Here is a breakdown...').\n" +
        "- Start your response directly with the data table, metrics, or answers.\n" +
        "- Limit answers to concise blocks that are extremely easy to read in a chat window.\n\n" +
        "**CRITICAL DATABASE INSTRUCTIONS:**\n" +
        "1. When the user asks about 'details' of the database/dashboard, or asks you to make the database 'simple to learn/understand', you MUST reply by translating the database stats into a clean, text-based data representation (such as an ASCII text table, simple text layout, or easy-to-read section-by-section breakdown) that simplifies the numbers for the user.\n" +
        "2. Explain what Innovation Density Index (IDI), Support Index (SI), Ecosystem Balance Score (EBS), and Ecosystem Gap Score (EGS) mean using extremely simple, layperson terms (e.g. 'Innovation Density is like the number of seeds planted, Support Index is like the water and soil provided, etc.').\n" +
        "3. Provide clear actionable advice based on the metrics, presented in a friendly, text-only card or dashboard format using markdown.";

      // Security & Privacy: Limit AI context strictly to name and platform role.
      // Explicitly omit sensitive personal details like email addresses or passwords.
      if (currentUser) {
        const sanitizedName = `${currentUser.firstname || ""} ${currentUser.lastname || ""}`.trim();
        const sanitizedRole = currentUser.role || "USER";
        
        systemInstruction += ` The user you are talking to is logged in. Their profile details are: Name: ${sanitizedName}, Platform Role: ${sanitizedRole}. Refer to them by name if appropriate to make the conversation highly personalized and premium!`;
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

      // Build chat context
      const chatContext = messages.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join("\n");
      const fullPrompt = `${systemInstruction}\n\n${dbContext}\n\nChat History:\n${chatContext}\nUser: ${userMessage}\nAssistant:`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }]
          })
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to generate content");
      }

      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I apologize, but I encountered an empty response. How else can I help you today?";
      
      setMessages((prev) => [...prev, { role: "assistant", content: aiText }]);
    } catch (error) {
      console.error("Gemini AI error:", error);
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
        content: "Hello! Chat cleared. I am ready to advise you on your next big startup idea, finding partners, or platform mechanics on StartUpSphere!"
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
      className="fixed top-0 right-0 z-[110] h-screen w-[420px] border-l border-gray-200 bg-white text-gray-800 shadow-[-10px_0_30px_rgba(0,0,0,0.08)] flex flex-col"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 p-4 text-white flex items-center justify-between shadow-sm relative overflow-hidden">
        {/* Shimmering glass effects */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
        
        <div className="flex items-center space-x-2.5 relative z-10">
          <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm flex items-center justify-center animate-pulse">
            <Sparkles className="h-5 w-5 text-blue-200" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-wide">StartUpSphere AI</h3>
            <div className="flex items-center text-xs text-blue-200">
              <span className="h-1.5 w-1.5 bg-green-400 rounded-full mr-1.5 animate-ping"></span>
              <span>Online Expert Advisor</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1 relative z-10">
          <button
            onClick={clearChat}
            className="p-2 hover:bg-white/10 rounded-full transition-colors border-0 bg-transparent text-white cursor-pointer"
            title="Clear Chat"
          >
            <Trash2 className="h-4.5 w-4.5 opacity-80 hover:opacity-100" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors border-0 bg-transparent text-white cursor-pointer"
            title="Close Assistant"
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
                  msg.role === "user" ? "bg-blue-600 text-white" : "bg-gradient-to-br from-indigo-100 to-blue-50 text-indigo-600 border border-indigo-100"
                }`}>
                  {msg.role === "user" ? <User className="h-4.5 w-4.5" /> : <Bot className="h-4.5 w-4.5" />}
                </div>

                {/* Message Bubble */}
                <div className={`p-3 rounded-2xl shadow-sm text-sm leading-relaxed border ${
                  msg.role === "user" 
                    ? "bg-blue-600 text-white border-blue-600 rounded-tr-none" 
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
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-100 to-blue-50 text-indigo-600 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4.5 w-4.5 animate-spin" />
                </div>
                <div className="bg-white text-gray-500 border border-gray-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Footer Input Area */}
      <form onSubmit={handleSend} className="p-4.5 bg-gray-50 border-t border-gray-200 flex items-center space-x-2.5 shadow-[0_-4px_15px_rgba(0,0,0,0.03)]">
        <button
          type="button"
          onClick={clearChat}
          className="h-11 w-11 flex items-center justify-center rounded-xl bg-white text-gray-700 hover:bg-red-500 hover:text-white hover:border-red-600 transition-all cursor-pointer border border-gray-300 shadow-sm flex-shrink-0"
          title="Reset Conversation"
        >
          <RotateCcw className="h-5 w-5 stroke-[2.2]" />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI Consultant..."
          disabled={loading}
          className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:opacity-50 transition-all shadow-inner font-medium"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className={`h-11 w-11 flex items-center justify-center rounded-xl transition-all cursor-pointer shadow-md flex-shrink-0 border ${
            !input.trim() || loading
              ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed shadow-none"
              : "bg-indigo-600 hover:bg-indigo-700 border-indigo-700 shadow-indigo-200/50"
          }`}
          title="Send Message"
        >
          <Send className={`h-5 w-5 stroke-[2.2] ${!input.trim() || loading ? "text-gray-400" : "text-white"}`} />
        </button>
      </form>
    </motion.div>
  );
}

function renderFormattedContent(text, role) {
  if (!text) return null;

  const lines = text.split("\n");
  const isUser = role === "user";

  const textColor = isUser ? "text-white" : "text-gray-700";
  const headerColor = isUser ? "text-white" : "text-gray-900";
  const listDotColor = isUser ? "text-white" : "text-gray-700";

  return lines.map((line, lineIndex) => {
    // 1. Handle Headers
    if (line.startsWith("### ")) {
      return (
        <h5 key={lineIndex} className={`font-bold text-sm mt-3 mb-1.5 ${headerColor}`}>
          {parseInlineFormatting(line.substring(4), isUser)}
        </h5>
      );
    }
    if (line.startsWith("## ") || line.startsWith("##")) {
      const cleanLine = line.startsWith("## ") ? line.substring(3) : line.substring(2);
      return (
        <h4 key={lineIndex} className={`font-bold text-base mt-4 mb-2 ${headerColor}`}>
          {parseInlineFormatting(cleanLine, isUser)}
        </h4>
      );
    }
    if (line.startsWith("# ")) {
      return (
        <h3 key={lineIndex} className={`font-bold text-lg mt-4 mb-2 ${headerColor} border-b ${isUser ? 'border-white/20' : 'border-gray-100'} pb-1`}>
          {parseInlineFormatting(line.substring(2), isUser)}
        </h3>
      );
    }

    // 2. Handle Bullet Lists
    if (line.startsWith("* ") || line.startsWith("- ")) {
      return (
        <li key={lineIndex} className={`list-disc list-inside ml-3.5 my-1 ${listDotColor}`}>
          {parseInlineFormatting(line.substring(2), isUser)}
        </li>
      );
    }

    // 3. Handle standard paragraphs
    if (line.trim() === "") {
      return <div key={lineIndex} className="h-2" />;
    }

    return (
      <p key={lineIndex} className={`my-1.5 ${textColor} leading-relaxed`}>
        {parseInlineFormatting(line, isUser)}
      </p>
    );
  });
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
