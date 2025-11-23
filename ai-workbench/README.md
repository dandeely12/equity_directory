# AI Workbench

Your local AI command center - a unified alternative to juggling multiple tools.

## What This Solves

This workbench addresses four main pain points:

1. **No More File Explosion** - Flows are stored in a database, not scattered across files
2. **Clear Tool Separation** - `vectorSearchTool` vs `docReadTool` with strict boundaries
3. **Full Observability** - See exactly what happened in every run (prompts, tools, docs, metrics)
4. **Single Hub** - Replace 6+ tools (LM Studio, Claude web, ChatGPT web, vector DB UIs, etc.) with one interface

## Features

### ✅ Currently Working

- **Qdrant Vector DB Interface** (Priority Feature)
  - Create and manage collections
  - Upload documents with rich metadata
  - Automatic chunking and vectorization
  - Full document management UI

- **Model Provider System**
  - Anthropic (Claude 3.5 Sonnet, Opus, Haiku)
  - OpenAI (GPT-4, GPT-3.5)
  - Local LLMs (LM Studio/Ollama compatible)

- **Chat with RAG** (Placeholder API ready)
  - Direct model chat
  - Vector-augmented generation (RAG) mode

- **4-Zone UI Layout**
  - Left: Model configuration
  - Main: Chat & Flows
  - Right: Knowledge base management
  - Bottom: Observability drawer

### 🚧 Coming Next

- Flow engine implementation
- Enhanced observability UI
- Model profiles (saved presets)
- Flow builder UI

## Quick Start

### Prerequisites

1. **Node.js 18+** installed
2. **Qdrant** running locally:
   ```bash
   docker run -p 6333:6333 qdrant/qdrant
   ```

### Installation

```bash
cd ai-workbench

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Edit .env and add your API keys:
# - OPENAI_API_KEY (for embeddings and GPT models)
# - ANTHROPIC_API_KEY (for Claude models)
# - LOCAL_LLM_BASE_URL (if using LM Studio)

# Initialize database
npx prisma generate
npx prisma migrate dev

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Configuration

### Environment Variables

```bash
# Required for embeddings and vector search
OPENAI_API_KEY=your_key_here

# Optional: Claude models
ANTHROPIC_API_KEY=your_key_here

# Optional: Local LLM
LOCAL_LLM_BASE_URL=http://localhost:1234/v1

# Qdrant (defaults shown)
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=

# Database (SQLite)
DATABASE_URL="file:./dev.db"
```

## Usage

### 1. Set Up Your Knowledge Base

1. Click "+ New" in the right sidebar to create a collection
2. Drag and drop `.txt`, `.md`, `.json`, or `.csv` files
3. Fill in metadata (category, realm, characters, etc.)
4. Documents are automatically chunked and vectorized

### 2. Chat with Your Docs

1. Select a model in the left sidebar (requires API key)
2. Type your message
3. Toggle "RAG Mode" to include vector search results
4. View the run details in the bottom drawer

### 3. Build Flows (Coming Soon)

Multi-step agentic workflows stored in the database.

## Architecture

```
ai-workbench/
├── app/
│   ├── api/
│   │   ├── chat/run/          # Chat with direct or RAG mode
│   │   ├── models/list/       # List available models
│   │   └── qdrant/            # Vector DB operations
│   │       ├── collections/   # Create, list collections
│   │       ├── documents/     # List, delete documents
│   │       └── upsert/        # Upload & vectorize documents
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── LeftSidebar.tsx        # Model configuration
│   ├── MainPanel.tsx          # Chat & flows
│   ├── RightSidebar.tsx       # Knowledge base (Fully working!)
│   └── ObservabilityDrawer.tsx
├── lib/
│   ├── config/
│   │   └── models.ts          # Model definitions
│   ├── providers/
│   │   ├── anthropic.ts       # Claude API
│   │   ├── openai.ts          # GPT API
│   │   ├── local.ts           # LM Studio/Ollama
│   │   └── index.ts           # Unified interface
│   ├── tools/
│   │   ├── vectorSearchTool.ts  # ONLY for Qdrant search
│   │   └── docReadTool.ts       # ONLY for local file reads
│   ├── chunking.ts            # Document processing
│   ├── db.ts                  # Prisma client
│   ├── embeddings.ts          # Embedding abstraction
│   └── qdrant.ts              # Vector DB client
├── prisma/
│   └── schema.prisma          # DB schema (flows, logs, profiles)
└── types/                     # TypeScript definitions
```

## Key Design Decisions

### 1. Tools Never Mix

- **vectorSearchTool** - ONLY searches Qdrant, never local files
- **docReadTool** - ONLY reads local files, never uses Qdrant

This prevents the common bug where agents mix up these tools.

### 2. Flows in Database, Not Files

No more:
- `flow_v1.py`
- `flow_v2_updated.py`
- `flow_final_really_final.py`

Instead, flows are JSON stored in SQLite, edited via UI.

### 3. Observability First

Every run logs:
- Full prompt and response
- Tool calls and arguments
- Retrieved document chunks
- Timing and token usage
- Costs

View it all in the bottom drawer.

## Development

```bash
# Run development server
npm run dev

# Generate Prisma client after schema changes
npx prisma generate

# Create new migration
npx prisma migrate dev --name your_migration_name

# View database
npx prisma studio
```

## Troubleshooting

### Qdrant Connection Fails

Make sure Qdrant is running:
```bash
docker run -p 6333:6333 qdrant/qdrant
```

Check `QDRANT_URL` in `.env` (default: `http://localhost:6333`)

### Upload Fails

1. Check `OPENAI_API_KEY` is set (needed for embeddings)
2. Check Qdrant is running
3. Check browser console for errors

### Models Don't Load

Add the appropriate API key to `.env`:
- `OPENAI_API_KEY` for GPT models
- `ANTHROPIC_API_KEY` for Claude models
- `LOCAL_LLM_BASE_URL` for local models

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: SQLite via Prisma 5
- **Vector DB**: Qdrant
- **Embeddings**: OpenAI (abstracted for future local models)
- **LLM Providers**: Anthropic, OpenAI, Local (LM Studio/Ollama)

## License

MIT
