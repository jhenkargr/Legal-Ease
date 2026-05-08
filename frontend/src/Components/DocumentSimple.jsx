import React, { useState, useEffect, useRef } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import {
  FileText,
  UploadCloud,
  Loader2,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Mic,
  MicOff,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import Tesseract from "tesseract.js";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const DocumentSimple = () => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState(false);
  const [results, setResults] = useState(null);
  const [updated, setUpdated] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [results1, setResults1] = useState(null);
  const [inputQuery, setInputQuery] = useState("");
  const [isListening, setIsListening] = useState(false);

  // Voice recognition state
  const recognitionRef = useRef(null);
  const [interimText, setInterimText] = useState("");
  const [finalText, setFinalText] = useState("");
  const [isRecognitionSupported, setIsRecognitionSupported] = useState(true);

  const navigate = useNavigate();

  // ✅ Load saved results when the component mounts
  useEffect(() => {
    const saved = localStorage.getItem("results");
    if (saved) {
      setResults(JSON.parse(saved));
      console.log("✅ Loaded saved results from localStorage");
    }
  }, []);

  // ✅ Save to localStorage every time results change
  useEffect(() => {
    if (results) {
      localStorage.setItem("results", JSON.stringify(results));
      console.log("💾 Results saved to localStorage");
    }
  }, [results]);

  useEffect(() => {
    const savedText = localStorage.getItem("extractedText");
    if (savedText) setExtractedText(JSON.parse(savedText));
  }, []);

  useEffect(() => {
    if (extractedText && Object.keys(extractedText).length > 0) {
      localStorage.setItem("extractedText", JSON.stringify(extractedText));
    }
  }, [extractedText]);

  // Initialize Web Speech API (SpeechRecognition)
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition || null;

    if (!SpeechRecognition) {
      console.warn("SpeechRecognition is not supported in this browser.");
      setIsRecognitionSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();

    // Config
    recognition.continuous = false; // stop automatically after speech ends
    recognition.interimResults = true; // we want interim results
    recognition.maxAlternatives = 1;
    recognition.lang = navigator.language || "en-IN"; // fallback to user's browser language

    // Event handlers
    recognition.onstart = () => {
      setIsListening(true);
      setInterimText("");
      setFinalText("");
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event);
      // On permission denied or not-allowed, stop listening and inform user
      if (event.error === "not-allowed" || event.error === "security") {
        setIsListening(false);
      }
    };

    recognition.onresult = (event) => {
      // Build transcript from results
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (final) {
        setFinalText((prev) => (prev ? prev + " " + final : final));
        setInputQuery((prev) => (prev ? prev + " " + final : final));
        setInterimText("");
      } else {
        setInterimText(interim);
      }
    };

    recognition.onend = () => {
      // recognition ended (either because user stopped speaking or manually stopped)
      setIsListening(false);
      // If we have any finalText (or interimText), set the query input accordingly
      const transcriptToSend = (finalText || interimText).trim();
      if (transcriptToSend) {
        setInputQuery(transcriptToSend);
        // Automatically send the query to backend when recognition ends
        // Use a microtask to ensure state updates have flushed
        setTimeout(() => {
          sendToBackend3(transcriptToSend);
        }, 100);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      // Cleanup
      try {
        if (recognitionRef.current) {
          recognitionRef.current.onstart = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          try {
            recognitionRef.current.abort();
          } catch (e) {}
        }
      } catch (err) {
        console.error("Error cleaning up recognition:", err);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // Handle file change
  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setResults(null);
    setExtractedText("");
  };

  const processFile = async () => {
    if (!file) return;
    setIsLoading(true);
    const fileType = file.type;

    if (fileType === "application/pdf") {
      await extractFromPdf(file);
    } else if (fileType.startsWith("image/")) {
      await extractFromImage(file);
    } else {
      setExtractedText("❌ Unsupported file type. Please upload a PDF or Image.");
      setIsLoading(false);
    }
  };

  // Send text to backend
  const sendToBackend = async (data1) => {
    try {
      const response = await fetch("http://localhost:5000/simplifier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `${data1}` }),
      });

      const data = await response.json();
      console.log("✅ Response from backend:", data);
      console.log("✅ Extracted Text:", extractedText);
      setResults(data);
    } catch (error) {
      console.error("❌ Error fetching from backend:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendToBackend3 = async (query) => {
    if (!query) return;
    setIsLoading(true);
    setResults1(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [`Document Content: ${extractedText}`, `User asked: ${query}`],
        }),
      });

      const data = await response.json();
      console.log("✅ Gemini response:", data);
      setResults1(data);
    } catch (error) {
      console.error("❌ Error fetching from backend:", error);
      setResults1({ error: "Failed to connect to the backend." });
    } finally {
      setIsLoading(false);
    }
  };

  const sendToBackend2 = async (data1) => {
    if (data1 === "english" || !data1) {
      setSelected(false);
      return;
    }
    setIsLoading(true);
    setSelected(true);

    try {
      // Create a detailed translation prompt with the full structure
      const translationPrompt = `
Translate the following legal document summary and all key clauses completely into ${data1} language.
You MUST return the response in this exact JSON format (no markdown, no code blocks, just raw JSON):

{
  "summary": "translated summary text here",
  "keyClauses": [
    {
      "title": "translated title",
      "detail": "translated detail",
      "status": "keep original English status unchanged",
      "alert": keep original boolean value unchanged
    }
  ]
}

Original Document:
Summary: ${results.summary}

Key Clauses to translate:
${results.keyClauses
  .map((clause, idx) => `
Clause ${idx + 1}:
- Title: ${clause.title}
- Detail: ${clause.detail}
- Status: ${clause.status} (DO NOT TRANSLATE)
- Alert: ${clause.alert} (DO NOT CHANGE)
`)
  .join("\n")}

Remember: Return ONLY valid JSON. Translate the "summary", "title", and "detail" fields. Keep "status" and "alert" values unchanged.
`;

      const response = await fetch("http://localhost:5000/translator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: translationPrompt }),
      });

      const data = await response.json();
      console.log("✅ Translation response:", data);

      // Check if response already has the correct structure
      if (data.summary && data.keyClauses) {
        setUpdated(data);
        setIsLoading(false);
      } else {
        // Try to extract JSON from markdown code blocks if present
        let content = typeof data === "string" ? data : JSON.stringify(data);

        // Remove markdown code blocks if present
        content = content.replace(/``````\n?/g, "");

        try {
          const parsed = JSON.parse(content);
          setUpdated(parsed);
        } catch (parseError) {
          console.error("Failed to parse translation:", parseError);
          // Fallback: keep original structure with translated summary only
          setUpdated({
            summary: content,
            keyClauses: results.keyClauses,
          });
        }
      }
    } catch (error) {
      console.error("❌ Error fetching from backend:", error);
      setSelected(false);
    }
  };

  // Extract from PDF
  const extractFromPdf = async (file) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const typedarray = new Uint8Array(reader.result);
        const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
        let finalText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: context, viewport }).promise;

          const {
            data: { text },
          } = await Tesseract.recognize(canvas.toDataURL("image/png"), "eng+hin+kan", {
            logger: (m) => console.log(m),
          });

          finalText += `${text}\n`;
        }

        const singleLine = finalText.replace(/\s*\n\s*/g, " ");
        setExtractedText(singleLine);
        await sendToBackend(singleLine);
      } catch (err) {
        console.error("PDF OCR error:", err);
        setExtractedText("❌ Failed to extract text from PDF.");
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Extract from image
  const extractFromImage = async (file) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const {
          data: { text },
        } = await Tesseract.recognize(reader.result, "eng+hin+kan", {
          logger: (m) => console.log(m),
        });
        const singleline = text.replace(/\s*\n\s*/g, " ");
        console.log(singleline);
        setExtractedText(singleline);
        await sendToBackend(singleline);
      } catch (err) {
        console.error("Image OCR error:", err);
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Start listening
  const startListening = () => {
    if (!isRecognitionSupported) return;
    const r = recognitionRef.current;
    if (!r) return;
    try {
      // reset interim/final
      setInterimText("");
      setFinalText("");
      // Some browsers will throw if start called repeatedly; guard it
      r.start();
      setIsListening(true);
    } catch (error) {
      console.error("Error starting recognition:", error);
      setIsListening(false);
    }
  };

  // Stop listening
  const stopListening = () => {
    const r = recognitionRef.current;
    if (!r) return;
    try {
      r.stop();
      // onend will fire and handle sending
    } catch (error) {
      console.error("Error stopping recognition:", error);
      setIsListening(false);
    }
  };

  // Analyse New Document: clear storage and refresh
  const analyseNewDocument = () => {
    try {
      localStorage.clear();
    } catch (e) {
      console.warn("Failed to clear localStorage:", e);
    }
    try {
      globalThis.location.reload();
    } catch (e) {
      window.location.reload();
    }
  };

  return (
    <section className="pt-32 pb-16 bg-gray-50 min-h-[calc(100vh-80px)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center space-x-4 mb-3">
          <FileText className="w-10 h-10 text-indigo-700" />
          <BookOpen className="w-10 h-10 text-yellow-600" />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-2">
          Legal Document Simplifier
        </h1>
        <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          Upload your contract (PDF, DOCX, or Image) to extract and simplify its contents.
        </p>

        {/* Upload Section */}
        <div className="bg-white p-8 rounded-xl shadow-2xl border border-gray-100">
          <div className="flex flex-col md:flex-row items-center justify-between border-b pb-6 mb-6 relative">
            <label
              htmlFor="document-upload"
              className={`flex flex-col items-center justify-center w-full md:w-2/5 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                file ? "border-green-500 bg-green-50" : "border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50"
              }`}
            >
              <input
                id="document-upload"
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.bmp"
                onChange={handleFileChange}
              />
              {file ? (
                <div className="text-center text-green-700">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-semibold">{fileName}</p>
                  <p className="text-sm">File ready for analysis.</p>
                </div>
              ) : (
                <div className="text-center text-indigo-600">
                  <UploadCloud className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-semibold">Click to upload document</p>
                  <p className="text-xs text-gray-500">PDF or Image (Max 5MB)</p>
                </div>
              )}
            </label>

            
            
            <button
              onClick={processFile}
              disabled={!file || isLoading}
              className={`w-full md:w-2/5 inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-xl shadow-lg transition duration-300 transform ${
                file && !isLoading ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.02]" : "bg-indigo-300 text-indigo-100 cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  Analyzing Document...
                </>
              ) : (
                <>
                  <BookOpen className="w-6 h-6 mr-3" />
                  Simplify Document 
                </>
              )}
            </button>

            {/* Analyse button positioned to touch the bottom border (md+) */}
            <button
              type="button"
              onClick={analyseNewDocument}
              disabled={isLoading}
              className="hidden md:inline-flex absolute right-4 -bottom-0 w-44 text-sm px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50"
            >
              Analyse New Document
            </button>
          </div>

          

          {/* Loading */}
          {isLoading && (
            <div className="text-center text-indigo-600 py-10">
              <Loader2 className="w-10 h-10 mx-auto animate-spin mb-3" />
              Extracting text using OCR...
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-6">
              <div className="p-6 bg-indigo-50 border border-indigo-200 rounded-lg shadow-inner">
                <h3 className="text-2xl font-bold text-indigo-700 mb-3">Simplified Summary</h3>
                <div className="text-gray-700 text-lg">
                  <ReactMarkdown>{selected && !isLoading ? updated.summary : results.summary}</ReactMarkdown>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Key Clauses & Important Details</h3>
                <div className="space-y-4">
                  {(selected && !isLoading ? updated.keyClauses : results.keyClauses)?.map((clause, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg shadow-md transition duration-300 ${
                        clause.isAlert ? "bg-red-50 border-l-4 border-red-500 hover:shadow-lg" : "bg-white border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`font-semibold text-lg ${clause.alert ? "text-red-700" : "text-gray-800"}`}>
                          {clause.alert ? <AlertTriangle className="w-5 h-5 inline mr-2" /> : <CheckCircle className="w-5 h-5 inline mr-2 text-indigo-500" />}
                          {clause.title}
                        </h4>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${clause.alert ? "bg-red-200 text-red-800" : "bg-green-100 text-green-800"}`}>
                          {clause.status}
                        </span>
                      </div>
                      <p className="text-gray-600 ml-7">{clause.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Translation & Query Section */}
          {results && (
            <div className="flex flex-row md:flex-col items-center justify-between gap-4 mt-8 bg-white p-5 rounded-xl shadow-md border border-gray-200">
              {/* Translation Buttons */}
              <div className="flex items-center gap-3">
                <span className="text-gray-700 font-semibold">Translate to:</span>
                {["English", "Hindi", "Kannada"].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => sendToBackend2(lang.toLowerCase())}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      selected && updated?.language === lang.toLowerCase() ? "bg-indigo-600 text-white shadow-lg scale-105" : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              {/* Query Search Box */}
              <div className="w-full mt-10 bg-white p-6 rounded-xl shadow-md border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Ask a question about your document</h3>

                <div className="flex items-center bg-gray-50 border border-gray-300 rounded-full px-4 py-2 shadow-inner focus-within:ring-2 focus-within:ring-indigo-500 transition">
                  <input
                    type="text"
                    placeholder="Ask anything..."
                    className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400"
                    value={inputQuery || ""}
                    onChange={(e) => setInputQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        sendToBackend3(inputQuery);
                      }
                    }}
                  />

                  {/* Voice button: shows only if supported */}
                  {isRecognitionSupported ? (
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
                      {isListening ? <MicOff className="w-5 h-5" aria-hidden="true" /> : <Mic className="w-5 h-5" aria-hidden="true" />}
                    </button>
                  ) : (
                    <div className="px-3 text-sm text-gray-400">Voice not supported</div>
                  )}

                  <button
                    onClick={() => sendToBackend3(inputQuery)}
                    disabled={isLoading || !inputQuery}
                    className="text-indigo-600 hover:text-indigo-800 ml-2 disabled:text-gray-400"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.85-4.15A7 7 0 1110 3a7 7 0 018.5 8.5z" />
                    </svg>
                  </button>
                </div>

                {/* Show live interim/final transcripts */}
                <div className="mt-3 text-sm text-gray-600">
                  {isListening && <div>Listening… <span className="italic">{interimText}</span></div>}
                  {!isListening && finalText && (
                    <div>
                      <strong>Heard:</strong> <span className="whitespace-pre-line">{finalText}</span>
                    </div>
                  )}
                </div>

                {/* Display Gemini’s Answer */}
                {isLoading && <div className="text-gray-500 mt-4 animate-pulse">⏳ Thinking...</div>}

                {results1?.reply && (
                  <div className="mt-6 bg-indigo-50 p-5 rounded-lg border border-indigo-200">
                    <h4 className="text-lg font-semibold text-indigo-700 mb-2">AI Answer</h4>
                    <p className="text-gray-700 whitespace-pre-line">
                      <ReactMarkdown>{results1.reply}</ReactMarkdown>
                    </p>
                  </div>
                )}

                {results1?.error && (
                  <div className="mt-6 bg-red-50 p-5 rounded-lg border border-red-200">
                    <h4 className="text-lg font-semibold text-red-700 mb-2">Error</h4>
                    <p className="text-gray-700">{results1.error}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg shadow-inner">
          <div className="flex items-center space-x-2 text-yellow-800 font-semibold mb-1">
            <AlertTriangle className="w-5 h-5" />
            <span>Legal Disclaimer:</span>
          </div>
          <p className="text-sm text-yellow-700">
            The simplification is for educational purposes only. Always consult a licensed attorney before acting on extracted information.
          </p>
        </div>
      </div>
    </section>
  );
};

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />
      <main>
        <DocumentSimple />
      </main>
      <Footer />
    </div>
  );
}
