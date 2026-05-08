const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const apiResponse = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.NVIDIA_MODEL || "meta/llama-3.1-8b-instruct",
        messages: [
          {
            role: "system",
            content: `
You are a translation assistant.
Always return ONLY valid JSON with proper brackets and quotes.
Never include markdown, explanations, or partial text.
If the translation is too long to fit, summarize non-critical clauses
BUT always return syntactically valid JSON (closed arrays and braces).
            `,
          },
          { role: "user", content: text },
        ],
        temperature: 0,
        max_tokens: 8000, // ⬆️ Much higher limit
      }),
    });

    const data = await apiResponse.json();

    let reply = data?.choices?.[0]?.message?.content;
    if (!reply) {
      return res.status(502).json({
        error: "No valid content found in API response.",
        raw: data,
      });
    }

    // 🧹 Clean markdown/code block remnants
    reply = reply.replace(/```json/gi, "").replace(/```/g, "").trim();

    // 🧠 Repair function to handle truncated JSON safely
    const repairJSON = (input) => {
      let repaired = input;
      // try to close open quotes/braces/brackets
      const openBraces = (input.match(/{/g) || []).length;
      const closeBraces = (input.match(/}/g) || []).length;
      const openBrackets = (input.match(/\[/g) || []).length;
      const closeBrackets = (input.match(/]/g) || []).length;

      while (openBraces > closeBraces && repaired[repaired.length - 1] !== "}") {
        repaired += "}";
      }
      while (openBrackets > closeBrackets && repaired[repaired.length - 1] !== "]") {
        repaired += "]";
      }
      return repaired;
    };

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(reply);
    } catch (err1) {
      console.warn("⚠️ Initial JSON parse failed. Attempting repair...");
      const repaired = repairJSON(reply);
      try {
        jsonResponse = JSON.parse(repaired);
      } catch (err2) {
        console.error("⚠️ JSON repair failed too.");
        return res.status(502).json({
          error: "Response JSON seems truncated (incomplete). Try increasing max_tokens or retrying.",
          details: err2.message,
          raw: reply,
        });
      }
    }

    res.json(jsonResponse);
  } catch (error) {
    console.error("❌ Error in /translator:", error);
    res.status(500).json({ error: error.message || "Something went wrong" });
  }
});

module.exports = router;
