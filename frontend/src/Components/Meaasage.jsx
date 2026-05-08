// src/App.jsx
import React, { useState, useEffect, useRef } from "react";
import { Scale, Send, AlertTriangle, MessageSquare, BookOpen, Mic, MicOff } from "lucide-react";
import { useLocation, useNavigate } from 'react-router-dom';
import PropTypes from "prop-types";

// Import Navbar & Footer
import Navbar from "./Navbar";
import Footer from "./Footer";
import ReactMarkdown from "react-markdown";

const createMessageId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const normalizeMessageText = (value) => {
  if (typeof value === "string") return value;
  if (value == null) return "";
  if (typeof value === "object") {
    if (typeof value.text === "string") return value.text;
    if (typeof value.answer === "string") return value.answer;
    if (typeof value.reply === "string") return value.reply;
    return JSON.stringify(value, null, 2);
  }
  return String(value);
};

const normalizeMessages = (items) =>
  Array.isArray(items)
    ? items
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          id: item.id ?? createMessageId(),
          ...item,
          text: normalizeMessageText(item.text),
        }))
    : [];

const markdownComponents = {
  p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
};

// --- Chat Components ---
const MessageBubble = ({ message, sender }) => {
  const isAssistant = sender === "assistant";
  const bubbleClass = isAssistant
    ? "bg-gray-100 text-gray-800 self-start rounded-b-xl rounded-tr-xl"
    : "bg-indigo-600 text-white self-end rounded-t-xl rounded-bl-xl";

  const time = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex w-full ${isAssistant ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-3/4 p-4 my-2 shadow-sm ${bubbleClass}`}>
        <div className="text-sm text-left prose prose-sm max-w-none prose-p:mb-3 dark:prose-invert">
          <ReactMarkdown components={markdownComponents}>
            {message}
          </ReactMarkdown>
        </div>
        <span
          className={`block text-xs mt-1 ${
            isAssistant ? "text-gray-500" : "text-indigo-200"
          } text-right`}
        >
          {time}
        </span>
      </div>
    </div>
  );
};

// ChatGPT-like typing indicator bubble
const TypingBubble = () => (
  <div className="flex w-full justify-start">
    <div className="max-w-3/4 p-4 my-2 shadow-sm bg-gray-100 text-gray-800 self-start rounded-b-xl rounded-tr-xl">
      <div className="flex items-center gap-2">
        <span className="sr-only">Assistant is typing</span>
        <span className="inline-flex gap-1">
          <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.2s]" />
          <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.1s]" />
          <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
        </span>
      </div>
    </div>
  </div>
);

const QuickQuestionButton = ({ text, onClick }) => (
  <button
    onClick={() => onClick(text)}
    className="text-sm text-indigo-700 font-medium py-2 px-4 border border-indigo-200 rounded-full hover:bg-indigo-50 transition duration-150 whitespace-nowrap shadow-sm"
  >
    {text}
  </button>
);

MessageBubble.propTypes = {
  message: PropTypes.string.isRequired,
  sender: PropTypes.string.isRequired,
};

QuickQuestionButton.propTypes = {
  text: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

// --- Know Your Rights Component ---
const KnowYourRights = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  // Initialize with empty array to prevent "not iterable" error
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const chatEndRef = useRef(null);
  const hasProcessedResults = useRef(false);

  // Load messages from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("messages");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(normalizeMessages(parsed));
        
      } catch (error) {
        console.error("Error parsing saved messages:", error);
        localStorage.removeItem("messages");
      }
    }
  }, []);

  // Handle navigation state results (only once)
  useEffect(() => {
    if (location.state?.results && !hasProcessedResults.current) {
      console.log("Navigation state results:", location.state.results);
      
      const assistantMessage = {
        id: createMessageId(),
        text: typeof location.state.results === 'string' 
          ? location.state.results 
          : JSON.stringify(location.state.results, null, 2).replaceAll('"', ''),
        sender: "user"
      };

      // Fix: Use spread operator on array, not on single message
      setMessages(prev => {
        // Ensure prev is an array
        const currentMessages = Array.isArray(prev) ? prev : [];
        return [...currentMessages, assistantMessage];
      });
      
      hasProcessedResults.current = true;

      // Clear navigation state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  const quickQuestions = [
    "What are my rights as a tenant?",
    "How do I file a small claims case?",
    "What should I know about employment contracts?",
    "Can I represent myself in court?",
  ];

  // Auto-scroll to bottom on new messages or loading changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0 && Array.isArray(messages)) {
      localStorage.setItem("messages", JSON.stringify(messages));
      console.log("💾 Messages saved to localStorage");
    }
  }, [messages]);

  // Initialize Speech Recognition once on mount and keep a ref
  useEffect(() => {
    const SpeechRecognition =
      globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported in this browser.");
      setSpeechSupported(false);
      return;
    }

    setSpeechSupported(true);
    const recog = new SpeechRecognition();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = "en-US";

    recog.onresult = (event) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          final += transcript + " ";
        } else {
          interim += transcript;
        }
      }

      if (final) setFinalText((prev) => prev + final);
      setInterimText(interim);
    };

    recog.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      isListeningRef.current = false;
    };

    recog.onend = () => {
      if (isListeningRef.current) {
        try {
          recog.start();
        } catch (error) {
          console.error("Error restarting recognition:", error);
          setIsListening(false);
          isListeningRef.current = false;
        }
      }
    };

    recognitionRef.current = recog;

    return () => {
      try {
        recog.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, []);

  // Keep a ref in sync with the isListening state for event handlers
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Update input field with speech recognition text
  useEffect(() => {
    if (finalText || interimText) {
      setInput(finalText + interimText);
    }
  }, [finalText, interimText]);

  const handleSend = async (textToSend = input) => {
    const msg = textToSend.trim();
    if (!msg || isLoading) return;
    const userMessage = { id: createMessageId(), text: msg, sender: "user" };
    const conversation = [...normalizeMessages(messages), userMessage];

    setIsLoading(true);
    setInput("");
    setFinalText("");
    setInterimText("");

    // Stop listening if active
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      setIsListening(false);
      isListeningRef.current = false;
    }

    // Append user message immediately
    setMessages(prev => {
      // Ensure prev is an array before spreading
      const currentMessages = Array.isArray(prev) ? prev : [];
      return [...currentMessages, userMessage];
    });
    try {
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversation }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const aiReply = {
        id: createMessageId(),
        text: normalizeMessageText(data) || "Sorry, I couldn't get a response.",
        sender: "assistant",
      };

      setMessages(prev => {
        const currentMessages = Array.isArray(prev) ? prev : [];
        return [...currentMessages, aiReply];
      });
    } catch (error) {
      console.error("Error fetching from backend:", error);
      setMessages(prev => {
        const currentMessages = Array.isArray(prev) ? prev : [];
        return [
          ...currentMessages,
          { 
            id: createMessageId(),
            text: "Failed to get response from server. Please check your connection and try again.", 
            sender: "assistant" 
          },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSend();
    }
  };

  const startListening = () => {
    const recog = recognitionRef.current;
    if (recog && !isListening) {
      setFinalText("");
      setInterimText("");
      setIsListening(true);
      isListeningRef.current = true;
      try {
        recog.start();
      } catch (error) {
        console.error("Error starting recognition:", error);
        setIsListening(false);
        isListeningRef.current = false;
      }
    }
  };

  const stopListening = () => {
    const recog = recognitionRef.current;
    if (recog && isListening) {
      setIsListening(false);
      isListeningRef.current = false;
      try {
        recog.stop();
      } catch (e) {
        // ignore
      }
    }
  };

  const clearChat = () => {
    localStorage.clear();
    globalThis.location.reload();
  };

  return (
    <section className="pt-32 pb-16 bg-white min-h-[calc(100vh-80px)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Header Section */}
        <div className="flex justify-center items-center space-x-4 mb-3">
          <BookOpen className="w-10 h-10 text-yellow-600" />
          <Scale className="w-10 h-10 text-gray-600" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Know Your Rights</h1>
        <p className="text-lg text-gray-600 mb-10">
          Get instant answers to your legal questions from our AI assistant
        </p>

        {/* Chat Container */}
        <div className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Chat Header */}
          <div className="flex items-center justify-between gap-3 p-4 border-b bg-gray-50 text-indigo-700 font-semibold">
            <div className="flex items-center min-w-0">
              <MessageSquare className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="truncate">Legal Assistant Chat</span>
            </div>
            <button
              type="button"
              onClick={clearChat}
              className="rounded-full border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-700 transition duration-150 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Clear Chat
            </button>
          </div>

          {/* Chat Messages */}
          <div className="h-[400px] md:h-[500px] overflow-y-auto p-4 flex flex-col items-center">
            <div className="w-full max-w-2xl">
              {messages.length > 0 ? (
                <>
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg.text} sender={msg.sender} />
                  ))}
                  {isLoading && <TypingBubble />}
                </>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 mb-3">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M8.5 10.5h7M8.5 13.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </div>

                    <p className="text-base font-medium text-gray-800">
                      Start a conversation
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      No messages yet — ask a question to begin.
                    </p>

                    <div className="mt-3">
                      <span className="inline-block text-sm px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm">
                        Hello! I'm your AI Legal Assistant. I can help you understand your rights and provide general legal information. What would you like to know about today?
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Quick Questions + Input */}
          <div className="p-4 border-t border-gray-200">
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                <p className="text-sm font-medium text-gray-700 w-full text-left mb-1">
                  Quick questions to get started:
                </p>
                {quickQuestions.map((q) => (
                  <QuickQuestionButton key={q} text={q} onClick={handleSend} />
                ))}
              </div>
            )}

            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me about your legal rights..."
                disabled={isLoading}
                className="flex-grow w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base shadow-inner disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              
              {/* Voice (Mic) Button */}
              {speechSupported && (
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  disabled={isLoading}
                  aria-pressed={isListening ? "true" : "false"}
                  aria-label={isListening ? "Stop voice input" : "Start voice input"}
                  className={`p-3 rounded-full transition duration-150 shadow-md flex-shrink-0
                    ${isListening ? "bg-red-100 text-red-600 hover:bg-red-200" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}
                    ${isLoading ? "cursor-not-allowed opacity-70" : ""}`}
                >
                  {isListening ? (
                    <MicOff className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <Mic className="w-5 h-5" aria-hidden="true" />
                  )}
                </button>
              )}

              <button
                onClick={() => handleSend()}
                disabled={isLoading || input.trim() === ""}
                aria-busy={isLoading ? "true" : "false"}
                aria-label={isLoading ? "Sending..." : "Send Message"}
                className={`p-3 rounded-full transition duration-150 shadow-md flex-shrink-0
                  ${isLoading ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"}
                  text-white disabled:bg-indigo-300 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <span
                    className="block w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Send className="w-5 h-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-500 text-left rounded-lg shadow-inner">
          <div className="flex items-center space-x-2 text-yellow-800 font-semibold mb-1">
            <AlertTriangle className="w-5 h-5" />
            <span>Important Disclaimer:</span>
          </div>
          <p className="text-sm text-yellow-700">
            This AI assistant provides general legal information and educational content only. It does not constitute
            legal advice and should not be relied upon as a substitute for consultation with a qualified attorney. Laws
            vary by jurisdiction and individual circumstances matter significantly in legal decisions.
          </p>
        </div>
      </div>
    </section>
  );
};

// --- App Component ---
export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
        body { font-family: 'Inter', sans-serif; }
      `}</style>

      <Navbar />
      <main>
        <KnowYourRights />
      </main>
      <Footer />
    </div>
  );
}
