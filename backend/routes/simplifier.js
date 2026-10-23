const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Text is required for simplification." });
    }

    const prompt = `
Provide a clear, comprehensive summary of the following legal document in plain English.
Then extract key clauses and return an array of clause objects with:
- "title": Short descriptive title of the clause
- "detail": Clear explanation of the clause in plain English
- "status": Clause status (e.g., "Active", "Important", "Required", "Warning", or "Critical")
- "alert": boolean (true if the clause represents a risk, penalty, violation, or urgent condition; false otherwise)

Return ONLY valid JSON matching this schema:
{
  "summary": "plain English summary text",
  "keyClauses": [
    {"title": "string", "detail": "string", "status": "string", "alert": true}
  ]
}

Document Text:
${text}
`;

    // 1️⃣ Primary Engine: Cohere Chat v2 with structured JSON format (Fast & reliable)
    if (process.env.COHERE_API_KEY) {
      try {
        const cohereResponse = await fetch("https://api.cohere.com/v2/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
          },
          body: JSON.stringify({
            model: process.env.COHERE_MODEL || "command-r-08-2024",
            messages: [
              {
                role: "system",
                content:
                  "You are an expert legal assistant. Always output ONLY raw valid JSON conforming to the requested schema. Never output markdown code blocks, conversational comments, or explanations outside the JSON.",
              },
              { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.2,
          }),
        });

        if (cohereResponse.ok) {
          const cohereData = await cohereResponse.json();
          let rawReply = cohereData?.message?.content?.[0]?.text;
          if (rawReply) {
            rawReply = rawReply.replace(/```json/gi, "").replace(/```/g, "").trim();
            const parsed = JSON.parse(rawReply);
            if (parsed.summary && Array.isArray(parsed.keyClauses)) {
              return res.json(parsed);
            }
          }
        }
      } catch (cohereErr) {
        console.warn("Cohere simplifier error, attempting NVIDIA fallback:", cohereErr.message);
      }
    }

    // 2️⃣ Fallback Engine: NVIDIA NIM
    const nvidiaModel = process.env.NVIDIA_MODEL || "meta/llama-3.2-11b-vision-instruct";
    const nvidiaResponse = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: nvidiaModel,
        messages: [
          {
            role: "system",
            content:
              "You are a JSON-only legal assistant. Never include explanations, commentary, or markdown fences. Output ONLY valid JSON matching the schema.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 1500,
      }),
    });

    const data = await nvidiaResponse.json();
    let reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(502).json({
        error: "No valid content received from AI provider.",
        details: data,
      });
    }

    // Defensive JSON parsing
    if (typeof reply === "string") {
      reply = reply.replace(/```json/gi, "").replace(/```/g, "").trim();
      reply = JSON.parse(reply);
    }

    return res.json(reply);
  } catch (error) {
    console.error("Error processing simplifier:", error);
    res.status(500).json({ error: error.message || "Failed to simplify document." });
  }
});

module.exports = router;
