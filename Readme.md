# Onebox Email Aggregator

An Express + TypeScript backend that connects to one or more IMAP inboxes, ingests and normalizes emails, classifies them using Google Gemini, indexes them in Elasticsearch for fast search, stores product/agenda context in Pinecone for RAG-assisted suggested replies, and sends Slack notifications for high-signal emails. It also exposes REST APIs to search, retrieve, delete emails, generate suggested replies, and manage vector embeddings.

---

### API Documentation

https://documenter.getpostman.com/view/32416134/2sB3QDwDGJ

### Live Demo

https://onebox-email-aggregator-server.onrender.com

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express
- **Email**: ImapFlow, mailparser
- **AI**: Google Gemini via LangChain
- **Search**: Elasticsearch
- **Vector DB**: Pinecone
- **Notifications**: Slack Incoming Webhook

---

## Project Description

The goal of the Onebox Email Aggregator is to centralize email processing across accounts (e.g., Gmail, Outlook) and enhance productivity via AI and search:

- **Ingest**: Connects to IMAP, fetches emails from the last 30 days plus listens for new emails in real time.
- **Normalize**: Extracts plain text content from each email, capturing key fields such as `from`, `to`, `subject`, `date`, `messageId`, `body`, and `folder`.
- **Classify**: Uses Gemini to classify emails into categories: `Interested`, `Meeting Booked`, `Not Interested`, `Spam`, and `Out of Office`.
- **Index & Search**: Stores emails in Elasticsearch to enable fast text search and retrieval.
- **RAG Context**: Uses Pinecone to store a compact knowledge base for agenda/product context and retrieves relevant context during suggested reply generation.
- **Notify**: Sends a Slack notification whenever an email is categorized as `Interested`.

This service runs continuously, synchronizing emails in bulk initially and then streaming new emails as they arrive.

---

## Implemented Features

- **IMAP ingestion and real-time streaming** (`src/services/imap.service.ts`)

  - Connects to IMAP via `ImapFlow`.
  - Performs an initial sync for the last 30 days.
  - Subscribes to new-message events and processes them as they arrive.

- **Robust email parsing** (`src/services/emailProcessor.service.ts`)

  - Parses raw emails using `mailparser` and extracts plain-text bodies.
  - Falls back to HTML stripping if no text version is found.
  - Returns a normalized `EmailData` object for downstream processing.

- **AI-powered email categorization** (`src/services/geminiAI.service.ts`)

  - Uses Google Gemini (via `@langchain/google-genai`) to assign one of five categories.
    e.g. Interested, Meeting Booked, Not Interested, Spam, Out of Office
  - Categories guide downstream actions like Slack alerts and reply generation.

- **Searchable email store in Elasticsearch** (`src/services/elasticsearch.service.ts`)

  - Creates an index with explicit mappings for `account`, `messageId`, `folder`, `subject`, `from`, `to`, `body`, `category`, and `date`.
  - Supports bulk indexing, single save, full list retrieval, full-text search, and deletion (by ID or all).

- **Vector DB for RAG context (Pinecone)** (`src/services/vectorDB.service.ts`)

  - Generates embeddings for a compact knowledge base (`src/utils/knowledgeBase.ts`).
  - Upserts and deletes embeddings in a Pinecone index/namespace.
  - Performs similarity search to fetch agenda/product context by category.

- **Suggested reply generation** (`src/services/geminiAI.service.ts`)

  - Combines the original email with retrieved Pinecone context to prompt Gemini for a concise, professional reply body.

- **Slack notifications for interested leads** (`src/services/notification.service.ts`)

  - Posts a formatted message (from, subject, body) to a Slack Incoming Webhook when an email is categorized as `Interested`.

- **RESTful APIs** (`src/routes/*.ts`)

  - Email APIs under `/email` for search, retrieval, deletion, and suggested replies.
  - Vector DB APIs under `/vectordb` for creating and deleting embeddings.

---

## Project Structure

```
onebox-email-aggregator/
├─ src/
│  ├─ index.ts                      # App entrypoint (Express app, routes, IMAP start, error middleware)
│  ├─ config/
│  │  ├─ elasticsearch.ts          # ES client and connectivity check
│  │  ├─ geminiAI.ts               # Gemini model configuration
│  │  ├─ imapAccounts.ts           # IMAP accounts configuration (reads creds from env)
│  │  └─ pinecone.ts               # Pinecone client and index instance
│  ├─ routes/
│  │  ├─ email.route.ts            # Search, retrieve, delete emails; generate suggested reply
│  │  └─ vectorDB.route.ts         # Create/Delete embeddings in Pinecone
│  ├─ services/
│  │  ├─ elasticsearch.service.ts  # Index management, CRUD, search operations
│  │  ├─ emailProcessor.service.ts # Email parse/normalize utilities
│  │  ├─ geminiAI.service.ts       # Categorization & suggested reply with Gemini
│  │  ├─ imap.service.ts           # IMAP streaming + initial batch ingestion
│  │  ├─ notification.service.ts   # Slack notification sender
│  │  └─ vectorDB.service.ts       # Embeddings CRUD + search in Pinecone
│  └─ utils/
│     ├─ errorResponse.ts          # Custom error class used across services
│     └─ knowledgeBase.ts          # Compact KB used for embeddings and RAG context
├─ package.json                     # Scripts and dependencies
├─ tsconfig.json                    # TypeScript configuration
└─ Readme.md                        # This file
```

---

## Setup & Configuration

1. Install dependencies

```bash
npm install
```

2. Environment variables

Create a `.env` file in the project root with the following keys. Use placeholder/example values; never commit real secrets to version control.

```bash
# Server
PORT=3000

# IMAP (example: Gmail App Password)
GMAIL_USER=your.name@gmail.com
GMAIL_PASS=your-app-password
# (Optionally add Outlook credentials if you enable that account in config)
# OUTLOOK_USER=...
# OUTLOOK_PASS=...

# Google Gemini
GEMINI_API_KEY=your-gemini-api-key

# Elasticsearch
ES_INDEX_NAME=onebox-emails
ES_URL=https://<user>:<password>@<host>:443

# Slack Incoming Webhook
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Pinecone
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX_NAME=onebox-email-aggregator
PINECONE_NAMESPACE=emails
PINECONE_EMBEDDING_MODEL=llama-text-embed-v2
```

3. IMAP account configuration

- Edit `src/config/imapAccounts.ts` to add or remove accounts.
- Credentials are read from environment variables; do not hardcode secrets.

4. Elasticsearch preparation

- Ensure your Elasticsearch cluster is reachable with the `ES_URL` you provide.
- The service will create the index automatically if it does not exist during bulk save.

Then set in your `.env`:

```bash
ES_URL=http://localhost:9200
ES_INDEX_NAME=onebox-emails
```

5. Pinecone preparation

- Create a Pinecone index and set `PINECONE_INDEX_NAME` and `PINECONE_NAMESPACE` accordingly.
- The vector dimension is handled by the embedding model; ensure your index is compatible.

---

## Running the Project

Development mode (requires `nodemon` available; install globally if needed):

```bash
npm run dev
```

Alternatively, run directly with `ts-node`:

```bash
npx ts-node src/index.ts
```

Production build (optional if you prefer transpiling):

```bash
tsc
node dist/index.js
```

When the server starts, it will:

- Check connectivity to Elasticsearch.
- Start IMAP connections for all configured accounts.
- Perform a 30-day backfill and then listen for new emails in real time.

---

## API Usage Examples

Base URL: `http://localhost:<PORT>` (default `3000`)

### Health

```bash
curl http://localhost:3000/
# => Onebox Email Aggregator
```

### Vector DB: create embeddings

```bash
curl -X POST http://localhost:3000/vectordb/create-embeddings
# Creates Pinecone embeddings from `src/utils/knowledgeBase.ts`
```

### Vector DB: delete embeddings

```bash
curl -X DELETE http://localhost:3000/vectordb/delete-embeddings
```

### Email: full-text search

```bash
curl http://localhost:3000/email/search/:<searchQuery>
# JSON: { success, message, count, data: EmailData[] }
```

### Email: get all (paginated via size=100 in service)

```bash
curl http://localhost:3000/email/all
```

### Email: get by messageId

```bash
curl http://localhost:3000/email/searchById/<messageId>
```

### Email: delete by messageId

```bash
curl -X DELETE http://localhost:3000/email/deleteById/<messageId>
```

### Email: delete all

```bash
curl -X DELETE http://localhost:3000/email/all
```

### Email: generate suggested reply

```bash
curl http://localhost:3000/email/generateSuggestedReply/<messageId>
# Requires: email exists in Elasticsearch, Pinecone embeddings created, and category match is found
# Returns: { success, message, data: "<reply body>" }
```

---

## License

This project is provided as part of an engineering assignment. Licensing terms can be adapted as needed.
