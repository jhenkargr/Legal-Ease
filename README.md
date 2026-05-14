# LegalEase

LegalEase is a full-stack legal assistant built as a three-part system:

- A React frontend for chat, document simplification, lawyer search, and legal document templates.
- An Express backend that connects the frontend to AI services, a MySQL lawyer database, and external models.
- A FastAPI service that performs document ingestion and retrieval-augmented question answering over uploaded PDFs.

The goal of the project is to make legal information easier to access, understand, and act on.

## What the project does

LegalEase gives users four main experiences:

1. Ask legal questions in a chat-style interface.
2. Upload a legal document and get a plain-English summary with key clauses and translations.
3. Find lawyers by specialization, city, and language.
4. Generate legal document templates with live PDF previews and export support.

## How it works

The application is split into independent services so each responsibility stays focused:

- The frontend gathers user input, handles local document parsing and voice input, and renders the user interface.
- The Express backend exposes routes for chat, simplification, translation, and lawyer search.
- The FastAPI service indexes uploaded documents into FAISS and answers questions by retrieving relevant chunks before sending the final prompt to Cohere.

Typical request flow:

- The user opens the site in the browser.
- The React app routes them to the desired tool.
- The frontend sends requests to the backend or FastAPI service using the configured base URLs.
- The backend returns structured AI output or database results.
- The frontend formats and displays the response, often with markdown rendering or PDF previewing.

## Project Structure

```text
backend/
  server.js
  routes/
    chat.js
    lawyer.js
    simplifier.js
    translator.js
fastapi/
  Scripts/
    main.py
    requirements.txt
frontend/
  src/
    App.jsx
    Components/
    Templates/
```

## Frontend pages

- Home: introduces the product and its legal tools.
- Know Your Rights: a chat interface for legal guidance powered by the backend chat route.
- Simplify Docs: uploads PDFs or images, extracts text, summarizes legal content, translates the summary, and can query the document through the FastAPI service.
- Templates: lets users fill out form-based legal templates and preview the generated PDF live.
- Find Lawyers: searches a MySQL-backed lawyer directory with filters for specialization, city, and language.

## Backend routes

- `POST /chat` sends the conversation to Cohere and returns a markdown-formatted legal response.
- `POST /simplifier` sends legal text to NVIDIA’s model and returns a structured JSON summary with key clauses.
- `POST /translator` translates the summary JSON while preserving the structure.
- `GET /lawyer/lawyers` searches the lawyer directory with optional filters.
- `GET /lawyer/:id` returns one lawyer record by ID.

## FastAPI service

The FastAPI app supports document retrieval workflows:

- `POST /upload` saves a PDF, extracts text, chunks it, embeds the chunks with Cohere, and stores them in FAISS.
- `POST /query` takes chat history or a question, retrieves the most relevant document chunks, and generates a grounded answer.

This makes the document assistant behave like a simple retrieval-augmented generation pipeline.

## Setup

### 1. Backend

Install dependencies and start the server:

```bash
cd backend
npm install
npm start
```

Required backend environment variables:

- `PORT`
- `CLIENT_URL`
- `COHERE_API_KEY`
- `COHERE_MODEL`
- `NVIDIA_API_KEY`
- `NVIDIA_MODEL`
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_PORT`

### 2. Frontend

Install dependencies and run Vite:

```bash
cd frontend
npm install
npm run dev
```

Useful frontend environment variables:

- `VITE_EXPRESS_API_URL` defaults to `http://localhost:5000`
- `VITE_FAST_API_URL` defaults to `http://localhost:8000`

### 3. FastAPI service

The current FastAPI app lives in `fastapi/Scripts/main.py`. Start it with Uvicorn from that folder:

```bash
cd fastapi/Scripts
uvicorn main:app --reload --port 8000
```

Install Python dependencies from the matching requirements file in the same environment before starting the server.

## Data requirements

The lawyer search feature expects a MySQL database with a `Lawyer` table containing fields used by the UI and API, including:

- `lawyer_id`
- `first_name`
- `last_name`
- `specialization`
- `city`
- `state`
- `experience_years`
- `rating`
- `hourly_rate`
- `bio`
- `languages`
- `phone`
- `email`
- `website_url`

## Notes

- Keep API keys and database credentials in local `.env` files.
- The AI responses are intended to help users understand legal information, not replace a licensed attorney.
- Uploaded documents are indexed locally into FAISS for faster retrieval over future queries.

## Suggested next steps

- Add a sample `.env.example` file for each service.
- Add a short deployment section for the frontend, backend, and FastAPI service.
- Add screenshots for each user-facing page.