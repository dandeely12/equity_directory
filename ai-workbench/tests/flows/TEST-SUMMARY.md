# Flow Tests Summary

## Overview

**8 Flow Tests** | **~50 Micro Tests** | **< $0.02 Total Cost**

All tests use **ONLY the cheapest models**:
- `gpt-4o-mini` - $0.00015 input / $0.0006 output per 1k tokens
- `claude-3-haiku-20240307` - $0.00025 input / $0.00125 output per 1k tokens

---

## Test Structure

```
tests/flows/
├── 1-chat-flow.test.ts              (6 micro tests)
├── 2-flow-execution.test.ts         (7 micro tests)
├── 3-document-management.test.ts    (6 micro tests)
├── 4-vector-search.test.ts          (6 micro tests)
├── 5-token-cost-tracking.test.ts    (6 micro tests)
├── 6-multi-provider.test.ts         (6 micro tests)
├── 7-tool-execution.test.ts         (6 micro tests)
├── 8-observability.test.ts          (6 micro tests)
├── README.md
├── TEST-SUMMARY.md
├── jest.config.js
└── run-tests.sh
```

---

## Flow Breakdown

### FLOW 1: Chat Flow
**Tests**: Complete conversation lifecycle

**Micro Tests**:
1. Send simple message → Verify response
2. Verify conversation stored in database
3. Test streaming response chunks
4. Verify token counting works
5. Verify cost tracking accurate
6. Test error handling for invalid messages

---

### FLOW 2: Flow Execution
**Tests**: Multi-step AI workflows with branching

**Micro Tests**:
1. Create basic 2-step flow
2. Execute flow end-to-end
3. Test conditional branching (if/then)
4. Verify step outputs passed correctly
5. Test flow with tool calls
6. Verify flow results stored
7. Test error recovery in flows

---

### FLOW 3: Document Management
**Tests**: RAG pipeline (upload → chunk → embed → store)

**Micro Tests**:
1. Upload single document
2. Verify chunking works (500/1000/2000 char chunks)
3. Generate embeddings for chunks
4. Store in Qdrant collection
5. Verify metadata attached correctly
6. Test duplicate document handling

---

### FLOW 4: Vector Search
**Tests**: Semantic similarity search

**Micro Tests**:
1. Simple search query
2. Verify top-k results returned
3. Test relevance scores
4. Test filtering by metadata
5. Test empty result handling
6. Verify search performance (< 500ms)

---

### FLOW 5: Token & Cost Tracking
**Tests**: Accurate token counting and cost calculation

**Micro Tests**:
1. Count tokens for simple message
2. Count tokens with tool calls
3. Calculate cost for GPT-4o Mini
4. Calculate cost for Claude Haiku
5. Verify cumulative cost tracking
6. Test cost logging to database

---

### FLOW 6: Multi-Provider
**Tests**: Switch between Anthropic/OpenAI/Local

**Micro Tests**:
1. Send message with GPT-4o Mini (OpenAI)
2. Send same message with Claude Haiku (Anthropic)
3. Send message with Local LLM (if available)
4. Verify all return same schema
5. Test provider failover
6. Verify cost calculated per provider

---

### FLOW 7: Tool Execution
**Tests**: AI function calling and tool use

**Micro Tests**:
1. Simple tool call (vectorSearch)
2. Tool call with parameters
3. Multiple sequential tool calls
4. Verify tool results passed back to model
5. Test tool error handling
6. Verify tool execution logged

---

### FLOW 8: Observability
**Tests**: Logging and monitoring

**Micro Tests**:
1. Chat logged to database
2. Flow execution logged
3. Token counts logged
4. Costs logged
5. Errors logged with stack traces
6. Test log retrieval API

---

## Running Tests

```bash
# Make sure server is running first
npm run dev

# In another terminal:

# Run all flows
cd tests/flows
./run-tests.sh

# Run specific flow
./run-tests.sh 1-chat-flow.test.ts

# Run with npm
npm test tests/flows
```

---

## Cost Breakdown

| Flow | Micro Tests | Avg Tokens | Est Cost |
|------|-------------|------------|----------|
| 1. Chat Flow | 6 | 3,000 | $0.002 |
| 2. Flow Execution | 7 | 4,000 | $0.003 |
| 3. Document Mgmt | 6 | 3,500 | $0.002 |
| 4. Vector Search | 6 | 2,000 | $0.001 |
| 5. Token & Cost | 6 | 3,000 | $0.002 |
| 6. Multi-Provider | 6 | 3,500 | $0.003 |
| 7. Tool Execution | 6 | 3,500 | $0.003 |
| 8. Observability | 6 | 3,000 | $0.002 |
| **TOTAL** | **49** | **~25,500** | **< $0.02** |

**All tests use GPT-4o Mini at $0.00015 input / $0.0006 output per 1k tokens**

---

## Next Steps

After validating with paid models, test with **Local LLM** (FREE):
- LM Studio
- Ollama
- Custom local models

Zero cost testing for development!
