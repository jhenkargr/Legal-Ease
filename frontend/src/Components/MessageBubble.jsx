import React, { useState, useEffect, useRef } from "react";
// Globe icon imported correctly, along with others
import { Scale, Send, AlertTriangle, MessageSquare, BookOpen, Loader, Globe } from "lucide-react"; 
import ReactMarkdown from 'react-markdown'; 

// 1. HELPER FUNCTION DEFINITION (MUST BE AT THE TOP)
const generateSessionId = () => 
  'chat-' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4, 8);

// 2. SUB-COMPONENT DEFINITIONS

const MessageBubble = ({ message, sender, isTyping }) => {
  const isAssistant = sender === "assistant";
  
  // Custom Tailwind styling classes
  const bubbleClass = isAssistant
    ? "bg-gray-100 text-gray-800 self-start rounded-b-xl rounded-tr-xl"
    : "bg-indigo-600 text-white self-end rounded-t-xl rounded-bl-xl";
  
  const time = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex w-full ${isAssistant ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-3/4 p-4 my-2 shadow-md rounded-lg ${bubbleClass} text-left`}>
        {isTyping ? (
          <p className="text-sm flex items-center space-x-2">
            <Loader className="w-4 h-4 animate-spin" /> 
            <span>Assistant is typing...</span>
          </p>
        ) : (
          // Use ReactMarkdown for formatted output
          <div className={`text-sm ${isAssistant ? 'prose prose-sm' : ''}`}>
            <ReactMarkdown>{message}</ReactMarkdown>
          </div>
        )}
        
        {!isTyping && (
          <span
            className={`block text-xs mt-1 ${
              isAssistant ? "text-gray-500" : "text-indigo-200"
            } text-right`}
          >
            {time}
          </span>
        )}
      </div>
    </div>
  );
};

const QuickQuestionButton = ({ text, onClick, disabled }) => (
  <button
    onClick={() => onClick(text)}
    disabled={disabled}
    className="text-sm text-indigo-700 font-medium py-2 px-4 border border-indigo-200 rounded-full hover:bg-indigo-50 transition duration-150 whitespace-nowrap shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {text}
  </button>
);


// 3. MAIN COMPONENT DEFINITION

const KnowYourRights = () => {
  // All state initialization is correct now that generateSessionId is defined above.
  const [sessionId] = useState(generateSessionId()); 
  
  const [currentLanguage, setCurrentLanguage] = useState('English');
  const [languageChosen, setLanguageChosen] = useState(false);
  
  const [messages, setMessages] = useState([
    {
      text: "Hello! I'm your AI Legal Assistant. **Please select your preferred language below to start.**",
      sender: "assistant",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);
  const API_URL = "http://localhost:3000/api/ask-gemini"; 

  // Language Selector Options
  const languageOptions = [
    { label: "English", instruction: "Set Language to English" },
    { label: "हिन्दी (Hindi)", instruction: "Set Language to Hindi" },
    { label: "ಕನ್ನಡ (Kannada)", instruction: "Set Language to Kannada" },
  ];

  // Quick Questions for after language selection
  const quickQuestions = [
    "What is Article 21?",
    "Summarize the Fundamental Duties (Part IVA).",
    "Explain the scope of 'Right to Equality'.",
  ];


  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  // Handles language selection button click
  const handleLanguageSelect = (label, instruction) => {
    // 1. Visibly update chat with the language choice
    setMessages((prev) => [...prev, { text: label, sender: "user" }]);
    
    // 2. Hide the language selector and set new language
    setLanguageChosen(true);
    setCurrentLanguage(label.split(' ')[0]); 
    
    // 3. Send the instruction to the backend to set the chat context
    handleSend(instruction, true); // Pass 'true' for isLanguageInstruction
  };
  
  const handleSend = async (textToSend = input, isLanguageInstruction = false) => {
    if (textToSend.trim() === "" || isLoading || !sessionId) return; 

    // Determine if user message should be shown in the UI
    if (!isLanguageInstruction) {
        const userMessage = { text: textToSend, sender: "user" };
        setMessages((prev) => [...prev, userMessage, { sender: "assistant", isTyping: true }]);
    } else {
        // Only show typing indicator for language instruction, the 'user' part was added in handleLanguageSelect
        setMessages((prev) => [...prev, { sender: "assistant", isTyping: true }]);
    }
    
    setInput("");
    setIsLoading(true);

    // Hybrid Prompting logic (reinforce language preference for the model)
    const questionToSend = isLanguageInstruction 
        ? textToSend 
        : `[RESPOND IN ${currentLanguage}] ${textToSend}`; 

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            question: questionToSend,
            sessionId: sessionId 
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      
      // Remove typing indicator and add final AI message
      setMessages((prev) => {
        const updated = [...prev];
        updated.pop(); // Remove the last item (typing indicator)
        updated.push({
          text: data.answer || "I received an empty response. Please try rephrasing your question.",
          sender: "assistant",
        });
        return updated;
      });

    } catch (error) {
      console.error("API Call Failed:", error);
      // Remove typing indicator and add error message
      setMessages((prev) => {
        const updated = [...prev];
        updated.pop();
        updated.push({
          text: `Error: Could not reach the AI assistant. Check if your Node.js server is running at ${API_URL}.`,
          sender: "assistant",
        });
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (!languageChosen) return; 
      handleSend();
    }
  };

  return (
    <section className="pb-16 bg-white min-h-[calc(100vh-80px)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Header Section (remains the same) */}
        <div className="flex justify-center items-center space-x-4 mb-3">
          <BookOpen className="w-10 h-10 text-yellow-600" />
          <Scale className="w-10 h-10 text-gray-600" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
          Indian Constitution Assistant
        </h1>
        <p className="text-lg text-gray-600 mb-10">
          Get instant answers and article summaries.
        </p>

        {/* Chat Container */}
        <div className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Chat Header (remains the same) */}
          <div className="flex items-center p-4 border-b bg-gray-50 text-indigo-700 font-semibold">
            <MessageSquare className="w-5 h-5 mr-2" />
            Legal Assistant Chat
          </div>

          {/* Chat Messages (remains the same) */}
          <div className="h-[400px] md:h-[500px] overflow-y-auto p-4 flex flex-col items-center">
            <div className="w-full max-w-2xl">
              {messages.map((msg, i) => (
                <MessageBubble key={i} message={msg.text} sender={msg.sender} isTyping={msg.isTyping} />
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Quick Questions + Input */}
          <div className="p-4 border-t border-gray-200">
            {/* 💡 LANGUAGE SELECTION BLOCK */}
            {!languageChosen ? (
              <div className="flex flex-wrap gap-2 mb-4 justify-center">
                <p className="text-sm font-medium text-gray-700 w-full text-center mb-1 flex items-center justify-center">
                  <Globe className="w-4 h-4 mr-1 text-indigo-500" /> Choose Language:
                </p>
                {languageOptions.map((option) => (
                  <QuickQuestionButton 
                    key={option.label} 
                    text={option.label} 
                    onClick={() => handleLanguageSelect(option.label, option.instruction)} 
                    disabled={isLoading} 
                  />
                ))}
              </div>
            ) : (
            /* 💡 QUICK QUESTION BLOCK (after language selection) */
            <div className="flex flex-wrap gap-2 mb-4">
              <p className="text-sm font-medium text-gray-700 w-full text-left mb-1">
                Quick questions in {currentLanguage}:
              </p>
              {quickQuestions.map((q) => (
                <QuickQuestionButton key={q} text={q} onClick={handleSend} disabled={isLoading} />
              ))}
            </div>
            )}


            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={languageChosen ? `Ask your question in ${currentLanguage}...` : "Please select a language first."}
                disabled={isLoading || !languageChosen} // Disable input until language is chosen
                className="flex-grow w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base shadow-inner disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={() => handleSend()}
                disabled={input.trim() === "" || isLoading || !languageChosen} // Disable send until language is chosen
                className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition duration-150 disabled:bg-indigo-300 shadow-md flex-shrink-0"
                aria-label="Send Message"
              >
                {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer (remains the same) */}
        <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-500 text-left rounded-lg shadow-inner">
          <div className="flex items-center space-x-2 text-yellow-800 font-semibold mb-1">
            <AlertTriangle className="w-5 h-5" />
            <span>Important Note:</span>
          </div>
          <p className="text-sm text-yellow-700">
            This assistant is trained only on the Constitution of India. For complex legal advice, always consult a qualified attorney.
          </p>
        </div>
      </div>
    </section>
  );
};

export default KnowYourRights;