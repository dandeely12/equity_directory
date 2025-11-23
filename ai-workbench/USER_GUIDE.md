# AI Workbench User Guide

## Welcome to Your Local AI Workbench! 🎉

This guide will walk you through everything you need to know to use your AI Workbench, written for people who aren't technical experts. Think of this as your friendly companion to get started.

---

## Table of Contents

1. [What is the AI Workbench?](#what-is-the-ai-workbench)
2. [Getting Started](#getting-started)
3. [Understanding the Interface](#understanding-the-interface)
4. [Step-by-Step: Your First Chat](#step-by-step-your-first-chat)
5. [Working with Documents (Knowledge Base)](#working-with-documents-knowledge-base)
6. [Using RAG Mode (Smart Search)](#using-rag-mode-smart-search)
7. [Saving Your Favorite Settings (Profiles)](#saving-your-favorite-settings-profiles)
8. [Viewing Your Chat History](#viewing-your-chat-history)
9. [Understanding Costs and Tokens](#understanding-costs-and-tokens)
10. [Troubleshooting](#troubleshooting)

---

## What is the AI Workbench?

The AI Workbench is your **one-stop shop** for working with AI models locally on your computer. Instead of juggling multiple tools, websites, and apps, everything you need is in one place:

- **Chat with AI models** like Claude and ChatGPT
- **Store and search your documents** using a powerful vector database
- **Track your conversations** and see exactly how the AI works
- **Save your favorite settings** so you don't have to set them up every time
- **See detailed costs** so you know exactly what you're spending

Think of it like having your own personal AI assistant that lives on your computer, keeping everything organized and private.

---

## Getting Started

### Prerequisites (What You Need First)

Before you can use the AI Workbench, you need:

1. **Your Computer**: Windows, Mac, or Linux
2. **Node.js**: A program that runs JavaScript (version 18 or higher)
   - Download from: https://nodejs.org
   - Choose the "LTS" version (recommended)
3. **API Keys**: Think of these as passwords for AI services
   - **OpenAI API Key** (for ChatGPT): Get from https://platform.openai.com
   - **Anthropic API Key** (for Claude): Get from https://console.anthropic.com
4. **Qdrant** (Vector Database): A special database for documents
   - Easiest way: Use Docker (see below)

### Step 1: Install Qdrant (Your Document Database)

**Option A: Using Docker (Recommended)**
```bash
# Run this command in your terminal:
docker run -p 6333:6333 qdrant/qdrant
```
This starts a document database on your computer at `http://localhost:6333`

**Option B: Download Qdrant**
- Visit: https://qdrant.tech/documentation/quick-start/
- Follow their installation guide for your operating system

### Step 2: Set Up Your API Keys

1. Go to the `ai-workbench` folder on your computer
2. Create a new file called `.env` (note the dot at the beginning)
3. Copy this text into the file:

```
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
QDRANT_URL=http://localhost:6333
DATABASE_URL="file:./dev.db"
```

4. Replace `your_openai_key_here` with your actual OpenAI API key
5. Replace `your_anthropic_key_here` with your actual Anthropic API key
6. Save the file

**Important**: Never share this file with anyone! It contains your private keys.

### Step 3: Install and Start the Workbench

Open your terminal (Command Prompt on Windows, Terminal on Mac) and type these commands:

```bash
# Go to the ai-workbench folder
cd ai-workbench

# Install everything needed
npm install

# Set up the database
npx prisma generate
npx prisma migrate dev --name init

# Start the workbench
npm run dev
```

### Step 4: Open in Your Browser

Once it's running, open your web browser and go to:
```
http://localhost:3000
```

You should see the AI Workbench interface!

---

## Understanding the Interface

The AI Workbench is divided into **4 main areas**:

```
┌─────────────┬──────────────────────┬─────────────┐
│             │                      │             │
│   LEFT      │       MAIN           │   RIGHT     │
│  SIDEBAR    │      PANEL           │  SIDEBAR    │
│             │                      │             │
│  (Model     │  (Chat & Flows)      │ (Knowledge  │
│   Config)   │                      │   Base)     │
│             │                      │             │
└─────────────┴──────────────────────┴─────────────┘
                       │
                       │
              ┌────────┴──────────┐
              │  BOTTOM DRAWER    │
              │  (Observability)  │
              └───────────────────┘
```

### Left Sidebar (Model Configuration)
This is where you choose which AI model to use and adjust its settings.

### Main Panel (Chat & Flows)
This is where you actually chat with the AI and see your conversation history.

### Right Sidebar (Knowledge Base)
This is where you upload documents that the AI can search through and reference.

### Bottom Drawer (Observability)
This shows you detailed information about each conversation - what happened behind the scenes.

---

## Step-by-Step: Your First Chat

Let's have your first conversation with an AI model!

### Step 1: Choose a Model

1. Look at the **Left Sidebar**
2. Find the "Select Model" dropdown at the top
3. Click it and you'll see options like:
   - **Claude models** (from Anthropic): Great for long conversations and analysis
   - **GPT models** (from OpenAI): Great for general tasks
   - **Local models**: If you have LM Studio or Ollama running

4. Choose one (we recommend `claude-3-5-sonnet-20241022` or `gpt-4o`)

### Step 2: Adjust Settings (Optional)

Below the model selector, you'll see sliders:

- **Temperature** (0 to 2): How creative the AI is
  - Lower (0.3): More focused and consistent
  - Middle (0.7): Balanced (recommended)
  - Higher (1.5): More creative and random

- **Max Tokens**: How long the response can be
  - 1000 = Short responses
  - 4096 = Medium responses (recommended)
  - 8000+ = Long, detailed responses

- **Top P**: Another creativity control (usually leave at 1.0)

### Step 3: Write a System Prompt (Optional)

The system prompt tells the AI how to behave. Examples:

```
You are a helpful assistant who explains things simply.
```

or

```
You are an expert programmer who writes clean, well-documented code.
```

You can leave this blank for normal conversations.

### Step 4: Start Chatting!

1. Look at the **Main Panel**
2. Make sure the "Chat" tab is selected (at the top)
3. Type your question in the text box at the bottom
4. Press **Enter** or click **Send**

That's it! The AI will respond to your message.

**Example First Message:**
```
Hello! Can you explain what you can help me with?
```

---

## Working with Documents (Knowledge Base)

One of the most powerful features is uploading your own documents so the AI can search through them and answer questions based on YOUR information.

### Step 1: Create a Collection

A "collection" is like a folder for related documents.

1. Look at the **Right Sidebar** (Knowledge Base)
2. Find the "Collection Name" field
3. Type a name (e.g., "My Research Papers" or "Company Documents")
4. Click **Create Collection**

You'll see your new collection appear in the list below.

### Step 2: Upload a Document

1. Make sure you've created a collection first
2. Select your collection from the dropdown
3. Drag and drop a text file onto the upload area, OR click to browse

**Supported file types:**
- Plain text (.txt)
- Markdown (.md)
- JSON (.json)
- CSV (.csv)

### Step 3: Add Metadata (Optional but Helpful)

Metadata helps you organize and find documents later. Fill in any of these fields:

- **Title**: A friendly name for your document
- **Category**: Type of document (e.g., "Research", "Meeting Notes")
- **Realm**: The domain it belongs to (e.g., "Marketing", "Engineering")
- **Characters**: Key people mentioned in the document
- **Document Type**: Format (e.g., "Report", "Email", "Transcript")
- **Version**: Version number (e.g., "1.0", "Draft")

### Step 4: Upload

Click the **Upload** button and wait. The workbench will:
1. Break your document into small chunks
2. Convert each chunk into a vector (numerical representation)
3. Store everything in Qdrant

You'll see a success message when it's done!

### Managing Your Documents

In the **Documents** tab on the right sidebar, you can:

- **See all documents**: Listed with their names and metadata
- **Delete documents**: Click the trash icon next to any document
- **View stats**: See how many chunks each document has

---

## Using RAG Mode (Smart Search)

RAG stands for "Retrieval-Augmented Generation" - a fancy way of saying "search your documents before answering."

### What is RAG Mode?

Normally, when you ask the AI a question, it only knows what it was trained on. With RAG mode:
1. The AI first searches your uploaded documents
2. Finds the most relevant information
3. Uses that information to answer your question

This is incredibly powerful for:
- Asking questions about your own documents
- Getting accurate information from your knowledge base
- Reducing AI "hallucinations" (making things up)

### How to Use RAG Mode

1. Make sure you have documents uploaded (see previous section)
2. In the **Main Panel**, find the checkbox that says **"RAG Mode (Vector Search)"**
3. Check the box to turn it on
4. Select which collection to search from the dropdown next to it
5. Now type your question and send it

**Example:**

Let's say you uploaded your company's employee handbook. You can ask:
```
What is the vacation policy for full-time employees?
```

The AI will:
1. Search the handbook for relevant sections
2. Find the vacation policy
3. Answer based on YOUR document, not general knowledge

### Viewing What Was Retrieved

After getting a response, click **"View run details →"** below the message. In the bottom drawer that opens, go to the **"Retrieved Chunks"** tab. You'll see exactly which parts of your documents the AI found and used!

---

## Saving Your Favorite Settings (Profiles)

If you find yourself using the same model and settings repeatedly, save them as a profile!

### Creating a Profile

1. In the **Left Sidebar**, set up your model and settings exactly how you like them:
   - Choose your model
   - Adjust temperature and max tokens
   - Write your system prompt

2. Find the "Profile Name" field (below the settings)
3. Type a name (e.g., "My Writing Assistant" or "Code Helper")
4. Optionally add a description
5. Click **Save Profile**

### Loading a Profile

1. In the **Left Sidebar**, find the "Saved Profiles" section
2. You'll see all your saved profiles listed
3. Click **Load** next to any profile

All your settings will instantly change to match that profile!

### Deleting a Profile

Click the **Delete** button next to any profile you no longer need.

---

## Viewing Your Chat History

Every conversation you have is saved so you can review it later.

### Accessing History

1. In the **Main Panel**, click the **History** tab at the top
2. You'll see a list of all your previous chats and flows

### What You'll See

Each entry shows:
- **Type badge**: "chat" or "flow"
- **Mode**: "direct" or "vector_rag"
- **Status**: "completed" or "failed"
- **Message preview**: First part of your question
- **Timestamp**: When it happened
- **Duration**: How long it took (in milliseconds)
- **Token count**: How many tokens were used
- **Cost**: How much it cost (in dollars)

### Viewing Details

Click on any history item to open the **Observability Drawer** at the bottom. Here you can see:

#### Timeline Tab
A visual timeline showing each step:
1. When your request started
2. Vector search (if RAG mode was used)
3. Model call to the AI
4. When the response was received

#### Prompt/Response Tab
- **User Message**: Your original question
- **System Prompt**: The instructions given to the AI
- **Assistant Response**: The AI's full response
- **Augmented Context**: Any document chunks that were added (in RAG mode)

#### Retrieved Chunks Tab
If you used RAG mode, see:
- Which document chunks were found
- Relevance scores (higher = more relevant)
- The actual content of each chunk
- Metadata about where it came from

#### Raw Data Tab
Technical JSON data for debugging (you probably won't need this unless something goes wrong)

### Filtering History

Use the filter buttons to show:
- **All**: Everything
- **Chat**: Only chat conversations
- **Flows**: Only automated flows (when implemented)

---

## Understanding Costs and Tokens

AI models charge based on "tokens" - chunks of text they process.

### What is a Token?

Think of a token as roughly ¾ of a word. For example:
- "Hello world" = ~2 tokens
- "The quick brown fox" = ~4 tokens
- A typical paragraph = ~100-150 tokens

### How Costs Work

AI providers charge separately for:
- **Input tokens**: The text you send (your question + system prompt + document chunks)
- **Output tokens**: The text they send back (the AI's response)

Output tokens typically cost more than input tokens.

### Viewing Costs

Every message shows:
- **Token count**: In the history list
- **Total cost**: In dollars, right next to the token count

In the observability drawer, you can see detailed breakdowns:
- Input tokens used
- Output tokens used
- Cost calculation

### Tips to Reduce Costs

1. **Use smaller models**: GPT-3.5 costs less than GPT-4
2. **Reduce max tokens**: Shorter responses = lower cost
3. **Optimize RAG searches**: Use `topK: 3` instead of `topK: 10` (fewer chunks)
4. **Review system prompts**: Keep them concise

---

## Troubleshooting

### Problem: "Please select a model first"

**Solution**: You haven't chosen an AI model yet.
- Go to the Left Sidebar
- Click the "Select Model" dropdown
- Choose any model

### Problem: "Error: Invalid API key"

**Solution**: Your API key is wrong or missing.
1. Check your `.env` file in the `ai-workbench` folder
2. Make sure `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` is correctly set
3. Get a new key if needed
4. Restart the workbench (`npm run dev`)

### Problem: "Qdrant connection failed"

**Solution**: Your vector database isn't running.
1. Make sure Qdrant is started (Docker or local installation)
2. Check that `QDRANT_URL` in your `.env` file is correct
3. Default is `http://localhost:6333`
4. Try visiting http://localhost:6333/dashboard in your browser

### Problem: Document upload fails

**Possible causes:**
1. **File too large**: Try smaller files (under 1MB)
2. **Wrong file type**: Only .txt, .md, .json, .csv are supported
3. **Qdrant not running**: See above
4. **OpenAI API issue**: Check your API key has credits

### Problem: RAG mode doesn't find anything

**Solution**:
1. Make sure you uploaded documents to the selected collection
2. Try rephrasing your question to match words in your documents
3. Check that you selected the right collection in the dropdown

### Problem: Workbench won't start

**Check these:**
1. Is Node.js installed? (`node --version` in terminal)
2. Did you run `npm install`?
3. Did you run `npx prisma generate`?
4. Check for error messages in the terminal

### Problem: Chat is slow

**This is normal!** AI models can take:
- **10-30 seconds** for complex questions
- **Longer with RAG mode** (needs to search documents first)
- **Longer for larger models** (GPT-4 is slower than GPT-3.5)

Watch the observability drawer to see exactly where time is spent.

### Problem: "Model not available"

**Solution**:
1. Check your API key has access to that model
2. Try a different model
3. Check Anthropic/OpenAI status pages for outages

---

## Tips and Best Practices

### Getting the Best Responses

1. **Be specific**: Instead of "Tell me about dogs", ask "What are the best dog breeds for apartments?"
2. **Use system prompts**: Tell the AI how to behave upfront
3. **Use RAG for facts**: Upload documents and use RAG mode when you need accurate information from your files
4. **Iterate**: If the response isn't quite right, rephrase your question

### Organizing Your Knowledge Base

1. **Create separate collections** for different topics:
   - "Marketing Materials"
   - "Technical Documentation"
   - "Meeting Notes"
   - "Research Papers"

2. **Use consistent metadata**: This helps you find documents later
3. **Keep documents focused**: Smaller, topic-specific documents work better than huge files
4. **Delete outdated documents**: Keep your collections clean

### Managing Costs

1. **Start with cheaper models** for testing (GPT-3.5-turbo, Claude Haiku)
2. **Save profiles** for expensive setups so you don't accidentally use them
3. **Review history** regularly to see where you're spending
4. **Use local models** when possible (they're free!)

### Security Tips

1. **Never share your `.env` file**
2. **Don't upload sensitive documents** unless you trust the AI provider
3. **Review history** before sharing your screen
4. **Use local models** for very sensitive work

---

## Advanced Features (Coming Soon)

### Flows
Automated multi-step workflows where the AI performs a series of tasks. For example:
1. Search documents
2. Summarize findings
3. Generate a report
4. Save results

### Custom Tools
Ability to add your own custom tools that the AI can use during conversations.

---

## Getting Help

If you're stuck or something isn't working:

1. **Check this guide** - search for keywords related to your problem
2. **Read error messages** - they often tell you exactly what's wrong
3. **Check the terminal** - error details appear in the terminal where you ran `npm run dev`
4. **Review documentation** for specific AI providers:
   - OpenAI: https://platform.openai.com/docs
   - Anthropic: https://docs.anthropic.com
   - Qdrant: https://qdrant.tech/documentation

---

## Congratulations! 🎉

You now know how to use the AI Workbench! Start by:
1. Chatting with a model
2. Uploading some documents
3. Trying RAG mode
4. Saving your first profile

Have fun exploring your local AI assistant!
