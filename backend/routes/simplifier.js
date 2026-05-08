const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    const schema = {
      type: "object",
      properties: {
        summary: { type: "string" },
        keyClauses: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              detail: { type: "string" },
              status: {
                type: "string",
                enum: ["active", "pending", "expired", "unknown"],
              },
              alert: { type: "boolean" },
            },
            required: ["title", "detail", "status", "alert"],
            additionalProperties: false,
          },
        },
      },
      required: ["summary", "keyClauses"],
      additionalProperties: false,
    };

    const prompt = `
Provide a detailed, comprehensive, and lengthy summary of the following text in English. The summary should be thorough and cover all important aspects, not just a couple of lines. Then extract key clauses and provide an array of objects, each with 'title', 'detail', 'status', and 'alert' fields.
- "alert" should be true if the clause represents a warning, risk, violation, or urgent condition.
- Otherwise, "alert" should be false.
Return ONLY valid JSON matching this schema:
{
  "summary": string,
  "keyClauses": [
    {"title": string, "detail": string, "status": string, "alert": boolean}
  ]
}
Text:
${text}
`;

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.NVIDIA_MODEL || "meta/llama-3.1-8b-instruct",
        messages: [
          {
            role: "system",
            content:
              "You are a JSON-only assistant. Never include explanations, commentary, or markdown fences. Output ONLY valid JSON that matches the given schema.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0,
        max_tokens: 3000,
      }),
    });

    const data = await response.json();
    let reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(502).json({
        error: "No valid content found in API response.",
        data,
      });
    }

    // Defensive JSON parsing
    if (typeof reply === "string") {
      try {
        reply = reply.replace(/```json/gi, "").replace(/```/g, "").trim();
        reply = JSON.parse(reply);
      } catch (e) {
        const truncated = !reply.trim().endsWith("}") && !reply.trim().endsWith("]");
        const message = truncated
          ? "Response JSON seems truncated (incomplete). Try increasing max_tokens."
          : "Failed to parse valid JSON.";
        return res
          .status(502)
          .json({ error: message, details: e.message, raw: reply });
      }
    }

    return res.json(reply);
  } catch (error) {
    console.error("Error processing text:", error);
    res.status(500).json({ error: error.message || "Something went wrong" });
  }
});

module.exports = router;
