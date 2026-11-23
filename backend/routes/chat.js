const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    let messages = [];

    if (req.body.text) {
      messages = [{ role: "user", content: req.body.text }];
    } else if (Array.isArray(req.body.messages)) {
      messages = req.body.messages
        .map((m) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text,
        }))
        // ✅ Filter out error messages that got stored in chat history
        .filter((m) => m.content && !m.content.startsWith("Failed to get response"));
    } else {
      return res.status(400).json({
        error: "Please provide either 'text' or 'messages' array in request body.",
      });
    }

    // ✅ Ensure messages is not empty
    if (messages.length === 0) {
      return res.status(400).json({ error: "No valid messages to send." });
    }

    // ✅ Ensure conversation starts with a user message
    if (messages[0].role !== "user") {
      messages = messages.slice(1);
    }

    // ✅ Ensure conversation ends with a user message
    if (messages[messages.length - 1].role !== "user") {
      messages = messages.slice(0, -1);
    }

    // ✅ Re-validate that we still have at least one user message after trimming
    if (messages.length === 0) {
      return res.status(400).json({ error: "No valid user messages after processing." });
    }

    // 1️⃣ Try querying the FastAPI LangGraph + LangChain RAG pipeline
    const fastApiUrl = process.env.FAST_API_URL || "http://localhost:8000";
    try {
      const ragMessages = messages.map(
        (m) => `${m.role === "user" ? "User asked:" : "Assistant:"} ${m.content}`
      );

      const ragResponse = await fetch(`${fastApiUrl}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: ragMessages }),
        signal: AbortSignal.timeout ? AbortSignal.timeout(20000) : undefined,
      });

      if (ragResponse.ok) {
        const ragData = await ragResponse.json();
        if (ragData.reply && !ragData.error) {
          console.log("✅ Served response from FastAPI LangGraph RAG Engine");
          return res.json({
            reply: ragData.reply,
            context_used: ragData.context_used,
            citations: ragData.citations,
            source: "langgraph_rag",
          });
        }
      }
    } catch (ragErr) {
      console.warn(
        "⚠️ FastAPI LangGraph RAG unavailable, falling back to direct Cohere chat:",
        ragErr.message
      );
    }

    // 2️⃣ Fallback: Direct Cohere Chat
    const model = process.env.COHERE_MODEL || "command-r-08-2024";
    const apiKey = process.env.COHERE_API_KEY;
    const apiUrl = "https://api.cohere.com/v2/chat";

    const payload = {
      model: model,
      messages: [
        {
          role: "system",
          content: "You are a legal advisor. Provide concise, accurate legal advice based on the user's queries, referencing relevant statutes and case law where appropriate. IMPORTANT: Format your response beautifully using Markdown. Use bold highlighting for key terms and statutes, use bullet points for lists, and ensure proper line breaks and spacing to make it highly readable."
        },
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        }))
      ],
      temperature: 0.7,
    };

    console.log("Sending to Cohere:", JSON.stringify(payload, null, 2));

    const apiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await apiResponse.json();
    console.log("Cohere API response:", JSON.stringify(data, null, 2));

    // Check for API-level errors
    if (!apiResponse.ok || (typeof data.message === "string" && data.message.match(/error/i) && !data.id)) {
      console.error("Cohere API error:", data.message || data);
      return res.status(500).json({ error: typeof data.message === "string" ? data.message : "Cohere API Error" });
    }

    // Guard against empty/blocked response
    if (!data?.message?.content?.[0]?.text) {
      console.error("Unexpected response shape:", JSON.stringify(data, null, 2));
      return res.status(500).json({ error: "Empty or blocked response from Cohere." });
    }

    // Concatenate all parts for a complete response
    const reply = data.message.content.map(p => p.text).join('\n');
    res.json({ reply });

  } catch (error) {
    console.error("❌ Error processing text:", error);
    res.status(500).json({ error: error.message || "Something went wrong" });
  }
});

module.exports = router;