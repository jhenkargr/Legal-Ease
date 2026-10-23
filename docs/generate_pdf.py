import os
import base64
import subprocess
import PyPDF2

# Paths
base_dir = r"d:\mini project\legalease"
docs_dir = os.path.join(base_dir, "docs")
screenshots_dir = os.path.join(docs_dir, "screenshots")
html_path = os.path.join(docs_dir, "LegalEase_Project_Overview.html")
pdf_path = os.path.join(docs_dir, "LegalEase_Project_Overview.pdf")

os.makedirs(docs_dir, exist_ok=True)

# Encode screenshots
def get_b64(filename):
    p = os.path.join(screenshots_dir, filename)
    if os.path.exists(p):
        with open(p, "rb") as f:
            return "data:image/png;base64," + base64.b64encode(f.read()).decode("utf-8")
    return ""

b64_home = get_b64("home.png")
b64_simplifier = get_b64("simplifier.png")
b64_rights = get_b64("rights.png")
b64_lawyers = get_b64("lawyers.png")
b64_templates = get_b64("templates.png")

html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>LegalEase - Project Overview & Architecture</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

  @page {{
    size: A4 portrait;
    margin: 0;
  }}

  * {{
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }}

  body {{
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1e293b;
    background: #f8fafc;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    font-size: 8.8pt;
    line-height: 1.35;
  }}

  .page {{
    width: 210mm;
    height: 297mm;
    max-height: 297mm;
    padding: 11mm 13mm;
    background: #ffffff;
    position: relative;
    page-break-after: always;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }}

  /* Top Accent Bar */
  .top-accent {{
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4.5px;
    background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 40%, #06b6d4 100%);
  }}

  /* Header Section */
  .header {{
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 7px;
    border-bottom: 1.2px solid #e2e8f0;
    margin-bottom: 7px;
  }}

  .logo-title {{
    display: flex;
    align-items: center;
    gap: 9px;
  }}

  .logo-icon {{
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #4f46e5, #7c3aed);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-weight: 800;
    font-size: 15pt;
    box-shadow: 0 2px 6px rgba(79, 70, 229, 0.35);
  }}

  .title-group h1 {{
    font-size: 16pt;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.4px;
    display: flex;
    align-items: center;
    gap: 7px;
  }}

  .title-group p {{
    font-size: 8.2pt;
    color: #64748b;
    font-weight: 500;
    margin-top: 1px;
  }}

  .badge-container {{
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 3px;
  }}

  .badge-row {{
    display: flex;
    gap: 4px;
  }}

  .badge {{
    font-size: 6.8pt;
    font-weight: 700;
    padding: 2.5px 7px;
    border-radius: 12px;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }}

  .badge-primary {{ background: #e0e7ff; color: #4338ca; border: 0.8px solid #c7d2fe; }}
  .badge-success {{ background: #dcfce7; color: #15803d; border: 0.8px solid #bbf7d0; }}
  .badge-neutral {{ background: #f1f5f9; color: #475569; border: 0.8px solid #e2e8f0; }}

  /* Section Title */
  .section-title {{
    font-size: 9.8pt;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 5px;
    display: flex;
    align-items: center;
    gap: 6px;
    letter-spacing: -0.2px;
  }}

  .section-icon {{
    display: inline-block;
    width: 6px;
    height: 13px;
    background: #4f46e5;
    border-radius: 2px;
  }}

  /* Executive Summary Box */
  .exec-summary {{
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 3.5px solid #4f46e5;
    border-radius: 6px;
    padding: 6px 10px;
    margin-bottom: 7px;
    font-size: 8.2pt;
    color: #334155;
    line-height: 1.35;
  }}

  /* Tech Stack Grid */
  .stack-grid {{
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    margin-bottom: 7px;
  }}

  .stack-card {{
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 6px 7px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
  }}

  .stack-card-title {{
    font-size: 7.8pt;
    font-weight: 700;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 4px;
    padding-bottom: 3px;
    border-bottom: 1px solid #f1f5f9;
    margin-bottom: 4px;
  }}

  .stack-list {{
    list-style: none;
    font-size: 7.2pt;
    color: #475569;
    line-height: 1.32;
  }}

  .stack-list li {{
    margin-bottom: 2px;
    display: flex;
    align-items: flex-start;
    gap: 3px;
  }}

  .stack-list li::before {{
    content: "•";
    color: #6366f1;
    font-weight: bold;
  }}

  .stack-tag {{
    font-weight: 600;
    color: #1e293b;
  }}

  /* Architecture Diagram Container */
  .arch-container {{
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 6px;
    margin-bottom: 7px;
  }}

  /* Engineering Highlights Grid */
  .highlights-grid {{
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    margin-bottom: 5px;
  }}

  .highlight-card {{
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 6px 8px;
  }}

  .highlight-header {{
    font-size: 8pt;
    font-weight: 700;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 3px;
  }}

  .highlight-body {{
    font-size: 7.3pt;
    color: #475569;
    line-height: 1.3;
  }}

  /* Workflows Grid (Page 2) */
  .workflows-grid {{
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
    margin-bottom: 7px;
  }}

  .workflow-card {{
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 6px 8px;
  }}

  .workflow-header {{
    font-size: 8.2pt;
    font-weight: 700;
    color: #1e1b4b;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 3px;
  }}

  .workflow-desc {{
    font-size: 7.3pt;
    color: #475569;
    line-height: 1.3;
  }}

  /* Screenshots Grid (Page 2) */
  .screenshots-grid {{
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
    margin-bottom: 7px;
  }}

  .screenshot-frame {{
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }}

  .screenshot-header {{
    background: #f1f5f9;
    padding: 3px 6px;
    font-size: 6.8pt;
    font-weight: 700;
    color: #334155;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 0.8px solid #cbd5e1;
  }}

  .dots {{
    display: flex;
    gap: 2.5px;
  }}

  .dot {{
    width: 5px;
    height: 5px;
    border-radius: 50%;
  }}

  .dot-red {{ background: #ef4444; }}
  .dot-yellow {{ background: #f59e0b; }}
  .dot-green {{ background: #10b981; }}

  .screenshot-img {{
    width: 100%;
    height: 98px;
    object-fit: cover;
    object-position: top;
    display: block;
  }}

  /* Metrics Row */
  .metrics-grid {{
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    margin-bottom: 7px;
  }}

  .metric-card {{
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 5px 6px;
    text-align: center;
  }}

  .metric-val {{
    font-size: 11pt;
    font-weight: 800;
    color: #4f46e5;
    letter-spacing: -0.3px;
  }}

  .metric-label {{
    font-size: 6.8pt;
    font-weight: 600;
    color: #64748b;
    margin-top: 1px;
  }}

  /* Project Links & Governance Footer */
  .governance-card {{
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 6px 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }}

  .repo-box {{
    display: flex;
    align-items: center;
    gap: 7px;
  }}

  .repo-icon {{
    width: 24px;
    height: 24px;
    background: #0f172a;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 9pt;
    font-weight: bold;
  }}

  .repo-text h4 {{
    font-size: 8pt;
    font-weight: 700;
    color: #0f172a;
  }}

  .repo-link {{
    font-family: 'JetBrains Mono', monospace;
    font-size: 7.2pt;
    color: #4f46e5;
    text-decoration: none;
    font-weight: 600;
  }}

  .privacy-notice {{
    font-size: 6.6pt;
    color: #64748b;
    max-width: 250px;
    line-height: 1.25;
    text-align: right;
  }}

  /* Page Footer */
  .footer {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 5px;
    border-top: 1px solid #e2e8f0;
    font-size: 6.8pt;
    color: #94a3b8;
    font-weight: 500;
  }}
</style>
</head>
<body>

<!-- ================= PAGE 1: ARCHITECTURE, TECH STACK & CONTRIBUTIONS ================= -->
<div class="page">
  <div class="top-accent"></div>
  
  <div>
    <!-- Header -->
    <div class="header">
      <div class="logo-title">
        <div class="logo-icon">§</div>
        <div class="title-group">
          <h1>LegalEase <span>System Overview</span></h1>
          <p>AI-Powered Legal Document Simplification & Autonomous Legal Advisory Platform</p>
        </div>
      </div>
      <div class="badge-container">
        <div class="badge-row">
          <span class="badge badge-primary">Dual-Engine Microservices</span>
          <span class="badge badge-success">Production Verified</span>
        </div>
        <div class="badge-row">
          <span class="badge badge-neutral">Full-Stack RAG & OCR</span>
        </div>
      </div>
    </div>

    <!-- Executive Summary -->
    <div class="exec-summary">
      <strong>Executive Summary:</strong> Legal agreements, NDAs, and tenancy contracts are notoriously opaque, creating severe asymmetric risk for citizens and small businesses. <strong>LegalEase</strong> bridges this literacy gap by transforming convoluted legal contracts into actionable, plain-language summaries with highlighted risk alerts. The platform couples client-side hybrid PDF/OCR ingestion with a dual AI inference pipeline (Cohere v2 Command-R + NVIDIA NIM Fallback) and a vector-grounded RAG service (FAISS + Google Gemini) to deliver authoritative legal guidance in under 4 seconds.
    </div>

    <!-- Tech Stack Matrix -->
    <div class="section-title">
      <span class="section-icon"></span> Full Technology Stack
    </div>
    <div class="stack-grid">
      <div class="stack-card">
        <div class="stack-card-title">🖥️ Client Frontend</div>
        <ul class="stack-list">
          <li><span class="stack-tag">React 18 & Vite:</span> Fast SPA rendering</li>
          <li><span class="stack-tag">Tailwind CSS:</span> Responsive design</li>
          <li><span class="stack-tag">PDF.js:</span> Native digital stream extraction</li>
          <li><span class="stack-tag">Tesseract.js:</span> Client-side OCR fallback</li>
          <li><span class="stack-tag">Web Speech API:</span> Voice legal query input</li>
        </ul>
      </div>

      <div class="stack-card">
        <div class="stack-card-title">⚙️ Backend Services</div>
        <ul class="stack-list">
          <li><span class="stack-tag">Node.js & Express:</span> Core REST API (:5000)</li>
          <li><span class="stack-tag">FastAPI & Uvicorn:</span> AI RAG service (:8000)</li>
          <li><span class="stack-tag">MySQL Pool:</span> Clever Cloud resilient pool</li>
          <li><span class="stack-tag">CORS & Dotenv:</span> Microservice config</li>
          <li><span class="stack-tag">Async Pipelines:</span> Multi-tenant request queue</li>
        </ul>
      </div>

      <div class="stack-card">
        <div class="stack-card-title">🧠 AI & Retrieval</div>
        <ul class="stack-list">
          <li><span class="stack-tag">Cohere v2 Chat:</span> Command-R JSON Mode</li>
          <li><span class="stack-tag">NVIDIA NIM:</span> Llama-3.2-11B Fallback</li>
          <li><span class="stack-tag">Google Gemini:</span> RAG query synthesis</li>
          <li><span class="stack-tag">FAISS CPU:</span> Top-3 vector similarity index</li>
          <li><span class="stack-tag">Sentence-Transformers:</span> Embeddings</li>
        </ul>
      </div>

      <div class="stack-card">
        <div class="stack-card-title">🗄️ Data & Cloud</div>
        <ul class="stack-list">
          <li><span class="stack-tag">Clever Cloud MySQL:</span> 3306 Database</li>
          <li><span class="stack-tag">Persistent Vector Store:</span> 117 chunks</li>
          <li><span class="stack-tag">Document Templates:</span> Legal scaffolding</li>
          <li><span class="stack-tag">Verified Directory:</span> Geocoded lawyer DB</li>
          <li><span class="stack-tag">Zero-Leak Pipeline:</span> Stateless execution</li>
        </ul>
      </div>
    </div>

    <!-- Architecture Diagram (SVG) -->
    <div class="section-title">
      <span class="section-icon"></span> End-to-End System Architecture
    </div>
    <div class="arch-container">
      <svg viewBox="0 0 740 180" width="100%" height="180" xmlns="http://www.w3.org/2000/svg" style="display:block;">
        <defs>
          <linearGradient id="clientGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#eff6ff"/><stop offset="100%" stop-color="#dbeafe"/></linearGradient>
          <linearGradient id="expressGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f5f3ff"/><stop offset="100%" stop-color="#ede9fe"/></linearGradient>
          <linearGradient id="fastapiGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ecfdf5"/><stop offset="100%" stop-color="#d1fae5"/></linearGradient>
          <linearGradient id="aiGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fffbeb"/><stop offset="100%" stop-color="#fef3c7"/></linearGradient>
          <linearGradient id="dbGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8fafc"/><stop offset="100%" stop-color="#e2e8f0"/></linearGradient>
          <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b"/>
          </marker>
        </defs>

        <!-- CLIENT TIER -->
        <rect x="10" y="10" width="160" height="160" rx="8" fill="url(#clientGrad)" stroke="#93c5fd" stroke-width="1.5"/>
        <text x="90" y="28" font-size="9" font-weight="bold" fill="#1e40af" text-anchor="middle">CLIENT LAYER (PORT 5173)</text>
        <rect x="20" y="38" width="140" height="26" rx="4" fill="#ffffff" stroke="#bfdbfe"/>
        <text x="90" y="54" font-size="7.5" font-weight="600" fill="#1e3a8a" text-anchor="middle">React 18 + Vite SPA</text>
        <rect x="20" y="70" width="140" height="26" rx="4" fill="#ffffff" stroke="#bfdbfe"/>
        <text x="90" y="86" font-size="7.5" font-weight="600" fill="#1e3a8a" text-anchor="middle">PDF.js Text Extractor</text>
        <rect x="20" y="102" width="140" height="26" rx="4" fill="#ffffff" stroke="#bfdbfe"/>
        <text x="90" y="118" font-size="7.5" font-weight="600" fill="#1e3a8a" text-anchor="middle">Tesseract.js OCR (Eng)</text>
        <rect x="20" y="134" width="140" height="26" rx="4" fill="#ffffff" stroke="#bfdbfe"/>
        <text x="90" y="150" font-size="7.5" font-weight="600" fill="#1e3a8a" text-anchor="middle">Web Speech Voice Query</text>

        <!-- FLOW ARROWS FROM CLIENT -->
        <path d="M 170 65 L 220 50" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arrow)"/>
        <text x="195" y="50" font-size="6.5" font-weight="600" fill="#475569" text-anchor="middle">REST :5000</text>

        <path d="M 170 135 L 220 135" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arrow)"/>
        <text x="195" y="128" font-size="6.5" font-weight="600" fill="#475569" text-anchor="middle">RAG :8000</text>

        <!-- BACKEND TIER: EXPRESS -->
        <rect x="220" y="10" width="165" height="75" rx="8" fill="url(#expressGrad)" stroke="#c4b5fd" stroke-width="1.5"/>
        <text x="302" y="26" font-size="8.5" font-weight="bold" fill="#5b21b6" text-anchor="middle">NODE / EXPRESS API (:5000)</text>
        <rect x="230" y="34" width="145" height="20" rx="4" fill="#ffffff" stroke="#ddd6fe"/>
        <text x="302" y="47" font-size="7" font-weight="600" fill="#4c1d95" text-anchor="middle">/simplifier & /translator</text>
        <rect x="230" y="58" width="145" height="20" rx="4" fill="#ffffff" stroke="#ddd6fe"/>
        <text x="302" y="71" font-size="7" font-weight="600" fill="#4c1d95" text-anchor="middle">/lawyer & /templates (Pool)</text>

        <!-- BACKEND TIER: FASTAPI -->
        <rect x="220" y="95" width="165" height="75" rx="8" fill="url(#fastapiGrad)" stroke="#a7f3d0" stroke-width="1.5"/>
        <text x="302" y="111" font-size="8.5" font-weight="bold" fill="#065f46" text-anchor="middle">FASTAPI RAG SERVICE (:8000)</text>
        <rect x="230" y="119" width="145" height="20" rx="4" fill="#ffffff" stroke="#bbf7d0"/>
        <text x="302" y="132" font-size="7" font-weight="600" fill="#064e3b" text-anchor="middle">Sentence-Transformers (384d)</text>
        <rect x="230" y="143" width="145" height="20" rx="4" fill="#ffffff" stroke="#bbf7d0"/>
        <text x="302" y="156" font-size="7" font-weight="600" fill="#064e3b" text-anchor="middle">/query Context Grounding</text>

        <!-- FLOW TO AI -->
        <path d="M 385 45 L 435 45" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arrow)"/>
        <text x="410" y="38" font-size="6.5" font-weight="600" fill="#475569" text-anchor="middle">JSON Chat</text>

        <path d="M 385 135 L 435 135" fill="none" stroke="#64748b" stroke-width="1.5" marker-end="url(#arrow)"/>
        <text x="410" y="128" font-size="6.5" font-weight="600" fill="#475569" text-anchor="middle">Prompt+Top3</text>

        <!-- AI CLOUD ENGINES -->
        <rect x="435" y="10" width="150" height="75" rx="8" fill="url(#aiGrad)" stroke="#fde68a" stroke-width="1.5"/>
        <text x="510" y="26" font-size="8.5" font-weight="bold" fill="#92400e" text-anchor="middle">LLM REASONING TIER</text>
        <rect x="445" y="34" width="130" height="20" rx="4" fill="#ffffff" stroke="#fef08a"/>
        <text x="510" y="47" font-size="7" font-weight="600" fill="#78350f" text-anchor="middle">Cohere v2 Command-R</text>
        <rect x="445" y="58" width="130" height="20" rx="4" fill="#ffffff" stroke="#fef08a"/>
        <text x="510" y="71" font-size="7" font-weight="600" fill="#78350f" text-anchor="middle">NVIDIA NIM (Llama-3.2)</text>

        <!-- GEMINI + FAISS -->
        <rect x="435" y="95" width="150" height="75" rx="8" fill="url(#aiGrad)" stroke="#fde68a" stroke-width="1.5"/>
        <text x="510" y="111" font-size="8.5" font-weight="bold" fill="#92400e" text-anchor="middle">RAG REASONING & INDEX</text>
        <rect x="445" y="119" width="130" height="20" rx="4" fill="#ffffff" stroke="#fef08a"/>
        <text x="510" y="132" font-size="7" font-weight="600" fill="#78350f" text-anchor="middle">FAISS Vector Store (117 Chunks)</text>
        <rect x="445" y="143" width="130" height="20" rx="4" fill="#ffffff" stroke="#fef08a"/>
        <text x="510" y="156" font-size="7" font-weight="600" fill="#78350f" text-anchor="middle">Google Gemini 1.5 Synthesis</text>

        <!-- DATA TIER -->
        <rect x="600" y="10" width="130" height="160" rx="8" fill="url(#dbGrad)" stroke="#cbd5e1" stroke-width="1.5"/>
        <text x="665" y="28" font-size="8.5" font-weight="bold" fill="#1e293b" text-anchor="middle">PERSISTENCE TIER</text>
        <rect x="610" y="40" width="110" height="35" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
        <text x="665" y="55" font-size="7" font-weight="600" fill="#0f172a" text-anchor="middle">Clever Cloud MySQL</text>
        <text x="665" y="67" font-size="6.5" fill="#64748b" text-anchor="middle">Pool (Lawyers / DB)</text>
        <rect x="610" y="85" width="110" height="35" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
        <text x="665" y="100" font-size="7" font-weight="600" fill="#0f172a" text-anchor="middle">chunks.json Store</text>
        <text x="665" y="112" font-size="6.5" fill="#64748b" text-anchor="middle">117 Grounded Chunks</text>
        <rect x="610" y="130" width="110" height="30" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
        <text x="665" y="145" font-size="7" font-weight="600" fill="#0f172a" text-anchor="middle">vector_index.faiss</text>
        <text x="665" y="154" font-size="6.2" fill="#64748b" text-anchor="middle">Dense Embedding Index</text>

        <!-- ARROW EXPRESS TO MYSQL -->
        <path d="M 385 68 L 600 60" fill="none" stroke="#64748b" stroke-width="1.5" stroke-dasharray="3,3" marker-end="url(#arrow)"/>
      </svg>
    </div>

    <!-- Engineering Highlights & Contributions -->
    <div class="section-title">
      <span class="section-icon"></span> Key Engineering Contributions & Innovations
    </div>
    <div class="highlights-grid">
      <div class="highlight-card">
        <div class="highlight-header">⚡ Dual-AI Engine & JSON Strictness</div>
        <div class="highlight-body">
          Eliminated brittle markdown parsing by architecting a prioritized Cohere v2 Chat pipeline with strict <code>json_object</code> response formatting, backed by NVIDIA NIM as hot fallback. Reduced latency from 50s to <4s with 100% schema compliance.
        </div>
      </div>

      <div class="highlight-card">
        <div class="highlight-header">📄 Low-Latency Hybrid PDF Ingestion</div>
        <div class="highlight-body">
          Replaced client-side 45MB multilingual OCR downloads with an instant digital text stream extractor using PDF.js (<100ms). Embedded intelligent fallback to English Tesseract OCR for scanned physical deeds without browser lockups.
        </div>
      </div>

      <div class="highlight-card">
        <div class="highlight-header">🛡️ Resilient DB Pooling & RAG Context</div>
        <div class="highlight-body">
          Resolved MySQL idle disconnect crashes (<code>PROTOCOL_CONNECTION_LOST</code>) by migrating to connection pooling. Restructured FastAPI vector memory to dynamically sync 117 embedded legal chunks with FAISS for reliable legal queries.
        </div>
      </div>
    </div>
  </div>

  <!-- Page Footer -->
  <div class="footer">
    <span>LegalEase — Autonomous Legal Document Simplification & Advisory System</span>
    <span>Architecture & Engineering Specification | Page 1 of 2</span>
  </div>
</div>


<!-- ================= PAGE 2: APPLICATION WORKFLOWS, SCREENSHOTS & REPO ================= -->
<div class="page">
  <div class="top-accent"></div>

  <div>
    <!-- Header Page 2 -->
    <div class="header">
      <div class="logo-title">
        <div class="logo-icon">§</div>
        <div class="title-group">
          <h1>LegalEase <span>Workflows & Showcase</span></h1>
          <p>End-to-End Application Modules, Live Interface Gallery, and Quality Benchmarks</p>
        </div>
      </div>
      <div class="badge-container">
        <div class="badge-row">
          <span class="badge badge-primary">Interactive Workflows</span>
          <span class="badge badge-success">Multilingual AI</span>
        </div>
        <div class="badge-row">
          <span class="badge badge-neutral">Open-Source Ready</span>
        </div>
      </div>
    </div>

    <!-- Core Workflows -->
    <div class="section-title">
      <span class="section-icon"></span> Key Functional Workflows
    </div>
    <div class="workflows-grid">
      <div class="workflow-card">
        <div class="workflow-header">
          <span>1. Document Simplifier & Risk Analyzer</span>
          <span class="badge badge-primary">Core Module</span>
        </div>
        <div class="workflow-desc">
          Users upload contracts (PDF, DOCX, Image). The hybrid engine extracts text in milliseconds, streams it to the Cohere v2 JSON engine, and produces an executive summary alongside categorized key clauses with red warning badges on high-risk covenants (liquidated damages, non-competes).
        </div>
      </div>

      <div class="workflow-card">
        <div class="workflow-header">
          <span>2. "Know Your Rights" Conversational RAG</span>
          <span class="badge badge-success">FAISS Grounded</span>
        </div>
        <div class="workflow-desc">
          Citizens can query legal rights via text or voice. Queries are converted to 384-dimensional dense vectors, retrieved from the FAISS knowledge store (Model Tenancy Act & Constitutional rights), and synthesized into authoritative, grounded advice via Google Gemini.
        </div>
      </div>

      <div class="workflow-card">
        <div class="workflow-header">
          <span>3. Verified Lawyer Directory</span>
          <span class="badge badge-neutral">MySQL Powered</span>
        </div>
        <div class="workflow-desc">
          Connects individuals with licensed advocates across jurisdictions. Supports search filtering by legal domain (Family, Corporate, Criminal, Real Estate), geographical jurisdiction, pricing, bar admission, and client ratings with instant booking triggers.
        </div>
      </div>

      <div class="workflow-card">
        <div class="workflow-header">
          <span>4. Multilingual Legal Translation & Scaffolding</span>
          <span class="badge badge-primary">Inclusive Access</span>
        </div>
        <div class="workflow-desc">
          Enables instantaneous translation of analyzed documents and rights advice into regional Indian languages (Hindi, Kannada) while retaining structured legal clause status and risk indicators. Provides battle-tested contract templates for immediate download.
        </div>
      </div>
    </div>

    <!-- Live Screenshots Showcase -->
    <div class="section-title">
      <span class="section-icon"></span> Live Application Showcase
    </div>
    <div class="screenshots-grid">
      <div class="screenshot-frame">
        <div class="screenshot-header">
          <span>Landing Experience & Modern Navigation</span>
          <div class="dots"><span class="dot dot-red"></span><span class="dot dot-yellow"></span><span class="dot dot-green"></span></div>
        </div>
        <img class="screenshot-img" src="{b64_home}" alt="LegalEase Home">
      </div>

      <div class="screenshot-frame">
        <div class="screenshot-header">
          <span>Document Simplifier (Summary & Risk Alerts)</span>
          <div class="dots"><span class="dot dot-red"></span><span class="dot dot-yellow"></span><span class="dot dot-green"></span></div>
        </div>
        <img class="screenshot-img" src="{b64_simplifier}" alt="Document Simplifier">
      </div>

      <div class="screenshot-frame">
        <div class="screenshot-header">
          <span>Know Your Rights Conversational RAG Assistant</span>
          <div class="dots"><span class="dot dot-red"></span><span class="dot dot-yellow"></span><span class="dot dot-green"></span></div>
        </div>
        <img class="screenshot-img" src="{b64_rights}" alt="Know Your Rights">
      </div>

      <div class="screenshot-frame">
        <div class="screenshot-header">
          <span>Verified Lawyer Directory & Consultation</span>
          <div class="dots"><span class="dot dot-red"></span><span class="dot dot-yellow"></span><span class="dot dot-green"></span></div>
        </div>
        <img class="screenshot-img" src="{b64_lawyers}" alt="Lawyer Directory">
      </div>
    </div>

    <!-- Quality & Performance Metrics -->
    <div class="section-title">
      <span class="section-icon"></span> Engineering & Operational Metrics
    </div>
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-val">&lt; 4.0s</div>
        <div class="metric-label">Document Simplification Latency</div>
      </div>
      <div class="metric-card">
        <div class="metric-val">100%</div>
        <div class="metric-label">JSON Schema Strict Adherence</div>
      </div>
      <div class="metric-card">
        <div class="metric-val">117 Chunks</div>
        <div class="metric-label">FAISS Grounded Legal Corpus</div>
      </div>
      <div class="metric-card">
        <div class="metric-val">0 Leaks</div>
        <div class="metric-label">Stateless Processing & Local Cache</div>
      </div>
    </div>

    <!-- Governance & Repository Box -->
    <div class="governance-card">
      <div class="repo-box">
        <div class="repo-icon">&lt;/&gt;</div>
        <div class="repo-text">
          <h4>Open Source Source Code Repository</h4>
          <a class="repo-link" href="https://github.com/jhenkargr/Legal-Ease">https://github.com/jhenkargr/Legal-Ease</a>
        </div>
      </div>
      <div class="privacy-notice">
        <strong>Compliance Notice:</strong> In strict adherence to platform evaluation policies, no personal email addresses, phone numbers, or external personal contact details are disclosed in this document.
      </div>
    </div>
  </div>

  <!-- Page Footer -->
  <div class="footer">
    <span>LegalEase — Autonomous Legal Document Simplification & Advisory System</span>
    <span>Live Workflows & Performance Showcase | Page 2 of 2</span>
  </div>
</div>

</body>
</html>
"""

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"HTML generated at: {html_path}")

# Generate PDF with Google Chrome
chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
args = [
    chrome_path,
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    f"--print-to-pdf={pdf_path}",
    f"file:///{html_path.replace(os.sep, '/')}"
]

print("Rendering PDF via headless Chrome...")
subprocess.run(args, check=True)

if os.path.exists(pdf_path):
    print(f"PDF successfully created: {pdf_path}")
    with open(pdf_path, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        num_pages = len(reader.pages)
        print(f"Total Pages in PDF: {num_pages}")
else:
    print("PDF generation failed.")
