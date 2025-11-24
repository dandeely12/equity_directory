# Flow Tests

**8 comprehensive flow tests** covering all major functionality.

## Test Organization

Each test file represents a complete **FLOW** with **micro-tests** nested inside.

## Test Models (CHEAPEST ONLY)

- **Primary**: `gpt-4o-mini` - $0.00015 input / $0.0006 output per 1k tokens
- **Secondary**: `claude-3-haiku-20240307` - $0.00025 input / $0.00125 output per 1k tokens
- **Local**: `local-llm` - FREE (when available)

## Flow Tests

### 1. Chat Flow (`1-chat-flow.test.ts`)
End-to-end conversation testing.

**Micro tests:**
- 1.1 - Send simple message → Verify response
- 1.2 - Verify conversation stored in database
- 1.3 - Test streaming response chunks
- 1.4 - Verify token counting
- 1.5 - Verify cost tracking
- 1.6 - Error handling for invalid messages

---

### 2. Flow Execution (`2-flow-execution.test.ts`)
Multi-step AI workflows with branches.

**Micro tests:**
- 2.1 - Create basic 2-step flow
- 2.2 - Execute flow end-to-end
- 2.3 - Test conditional branching
- 2.4 - Verify step outputs passed correctly
- 2.5 - Test flow with tool calls
- 2.6 - Verify flow results stored
- 2.7 - Test error recovery

---

### 3. Document Management (`3-document-management.test.ts`)
RAG pipeline: upload → chunk → embed → store.

**Micro tests:**
- 3.1 - Upload single document
- 3.2 - Verify chunking (500/1000/2000 char)
- 3.3 - Generate embeddings
- 3.4 - Store in Qdrant
- 3.5 - Verify metadata attached
- 3.6 - Test duplicate handling

---

### 4. Vector Search (`4-vector-search.test.ts`)
Semantic similarity search and retrieval.

**Micro tests:**
- 4.1 - Simple search query
- 4.2 - Verify top-k results
- 4.3 - Test relevance scores
- 4.4 - Test metadata filtering
- 4.5 - Test empty result handling
- 4.6 - Verify performance (< 500ms)

---

### 5. Token & Cost Tracking (`5-token-cost-tracking.test.ts`)
Accurate token counting and cost calculation.

**Micro tests:**
- 5.1 - Count tokens for simple message
- 5.2 - Count tokens with tool calls
- 5.3 - Calculate cost for GPT-4o Mini
- 5.4 - Calculate cost for Claude Haiku
- 5.5 - Verify cumulative cost tracking
- 5.6 - Test cost logging to database

---

### 6. Multi-Provider (`6-multi-provider.test.ts`)
Switch between Anthropic/OpenAI/Local seamlessly.

**Micro tests:**
- 6.1 - Send message with GPT-4o Mini
- 6.2 - Send message with Claude Haiku
- 6.3 - Send message with Local LLM
- 6.4 - Verify same schema across providers
- 6.5 - Test provider failover
- 6.6 - Verify cost per provider

---

### 7. Tool Execution (`7-tool-execution.test.ts`)
AI function calling and tool use.

**Micro tests:**
- 7.1 - Simple tool call (vectorSearch)
- 7.2 - Tool call with parameters
- 7.3 - Multiple sequential tool calls
- 7.4 - Verify tool results passed back
- 7.5 - Test tool error handling
- 7.6 - Verify tool execution logged

---

### 8. Observability (`8-observability.test.ts`)
Logging and monitoring for all operations.

**Micro tests:**
- 8.1 - Chat logged to database
- 8.2 - Flow execution logged
- 8.3 - Token counts logged
- 8.4 - Costs logged
- 8.5 - Errors logged with stack traces
- 8.6 - Test log retrieval API

---

## Running Tests

```bash
# Run all flow tests
npm test tests/flows

# Run specific flow
npm test tests/flows/1-chat-flow.test.ts

# Run with coverage
npm test -- --coverage tests/flows
```

## Cost Estimation

Each flow test uses **GPT-4o Mini** by default:
- Average tokens per test: ~500 input, ~200 output
- Cost per test: ~$0.0001 - $0.0003
- Total cost for all 8 flows (~50 micro-tests): **< $0.02**

Minimal cost, maximum coverage.
