const express = require("express");
require("dotenv").config();
const cors = require("cors");


const app = express();
const PORT = 5000;
app.use(cors({ origin: "http://localhost:5173" }));

app.use(express.json());

app.post("/process-text", async (req, res) => {
  try {
    const { text,prompt } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    // Call Perplexity API directly with built-in fetch
    const apiResponse = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content:`
${prompt,text || "Summarize the text focusing on obligations, risks, dates, parties, and termination."}
Then extract key clauses and output an array of items with: title, detail, status.
Return ONLY JSON with fields "summary" and "keyClauses". Do not include code fences or extra text.
Text:
${text}`  }
        ]
      })
    });

    const data = await apiResponse.json();
    console.log(data);
    // Extract assistant’s reply text only
  const reply = data.search_results?.[0]|| "No reply received";

  const respo=data
    res.json(respo);

  } catch (error) {
    console.error("Error processing text:", error);
    res.status(500).json({ error: error.message || "Something went wrong" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
