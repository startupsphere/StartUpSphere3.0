import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Trash2, X, Bot, User } from "lucide-react";

export default function GeminiAiChat({ onClose }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I am your StartUpSphere AI Advisor. Ask me anything about startup valuation, finding investors, business compliance in the Philippines, or pitch deck strategies!"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom whenever messages list changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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

      // Format chat history for Gemini API
      const systemInstruction = 
        "You are the StartUpSphere AI Consultant, an expert startup advisor and data analyst for the StartUpSphere platform. " +
        "You help founders, investors, and stakeholders gain insights into business growth, funding stages, technology trends, and compliance. " +
        "Keep your tone highly professional, encouraging, inspiring, and direct. Format your output nicely with clean bullet points and bold headers if needed. " +
        "Limit answers to concise paragraphs that are easy to read in a chat window.";

      // Build chat context
      const chatContext = messages.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join("\n");
      const fullPrompt = `${systemInstruction}\n\nChat History:\n${chatContext}\nUser: ${userMessage}\nAssistant:`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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
    setMessages([
      {
        role: "assistant",
        content: "Hello! Chat cleared. I am ready to advise you on your next big startup idea, finding partners, or platform mechanics on StartUpSphere!"
      }
    ]);
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed top-0 right-0 z-[110] h-screen w-[420px] border-l border-gray-200/80 bg-white/95 backdrop-blur-md shadow-[-10px_0_30px_rgba(0,0,0,0.08)] flex flex-col"
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
                    ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-blue-600 rounded-tr-none" 
                    : "bg-white text-gray-800 border-gray-100 rounded-tl-none"
                }`}>
                  <p className="whitespace-pre-line">{msg.content}</p>
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
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI Consultant..."
          disabled={loading}
          className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:opacity-60 transition-all placeholder:text-gray-400"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer shadow-sm border-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </motion.div>
  );
}
