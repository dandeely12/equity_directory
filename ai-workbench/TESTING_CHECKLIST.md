# AI Workbench Testing Checklist

Now that the API keys are configured and token counting is implemented, here's a comprehensive list of features to test:

## 🔑 API Configuration Tests

- [x] `.env` file created with valid API keys
- [ ] OpenAI API key is valid and working
- [ ] Anthropic API key is valid and working
- [ ] Environment variables are loaded correctly in Next.js

## 💬 Basic Chat Tests

### OpenAI Provider
- [ ] Test GPT-4o with a simple prompt
- [ ] Test GPT-4o Mini with a simple prompt
- [ ] Test GPT-4 Turbo with a simple prompt
- [ ] Test GPT-3.5 Turbo with a simple prompt
- [ ] Verify token counting is accurate
- [ ] Verify cost calculation is accurate
- [ ] Test streaming responses
- [ ] Test system prompts

### Anthropic Provider
- [ ] Test Claude 3.5 Sonnet (v2) with a simple prompt
- [ ] Test Claude 3 Opus with a simple prompt
- [ ] Test Claude 3 Haiku with a simple prompt
- [ ] Verify token counting is accurate
- [ ] Verify cost calculation is accurate
- [ ] Test streaming responses
- [ ] Test system prompts

## 🛠️ Advanced Features

### Function/Tool Calling
- [ ] Test OpenAI function calling with simple tools
- [ ] Test multiple function calls in one request
- [ ] Test tool choice parameter (auto, none, required)
- [ ] Verify tool call arguments are parsed correctly
- [ ] Test error handling for invalid tool calls

### JSON Mode
- [ ] Test OpenAI JSON mode (`response_format: { type: 'json_object' }`)
- [ ] Verify structured output is valid JSON
- [ ] Test with complex schemas

### Response Settings
- [ ] Test different temperature values (0, 0.5, 1.0)
- [ ] Test different max_tokens values
- [ ] Test top_p parameter
- [ ] Test frequency_penalty and presence_penalty (OpenAI)
- [ ] Test stop sequences

### Logprobs (OpenAI)
- [ ] Test logprobs enabled
- [ ] Test top_logprobs parameter
- [ ] Verify logprobs data structure

### Reproducibility
- [ ] Test seed parameter for deterministic outputs
- [ ] Verify same seed produces same results

## 🔄 Flow Execution Tests

### Basic Flows
- [ ] Create a simple 2-step flow
- [ ] Test flow execution end-to-end
- [ ] Verify step outputs pass to next steps
- [ ] Test flow with branches (if-then-else)
- [ ] Test flow with loops

### Multi-Model Flows
- [ ] Create flow using both OpenAI and Anthropic
- [ ] Verify cost tracking across multiple providers
- [ ] Test switching models mid-flow

### Error Handling
- [ ] Test flow behavior when a step fails
- [ ] Test retry logic
- [ ] Test timeout handling

## 📊 Vector Search & RAG Tests

### Embeddings
- [ ] Test OpenAI embeddings generation
- [ ] Test local embeddings (if configured)
- [ ] Verify embedding dimensions are correct
- [ ] Test batch embedding generation

### Qdrant Integration
- [ ] Connect to Qdrant instance
- [ ] Create a collection
- [ ] Upload test documents with embeddings
- [ ] Test vector similarity search
- [ ] Test metadata filtering
- [ ] Test score thresholds

### RAG Workflows
- [ ] Test end-to-end RAG with document upload
- [ ] Test retrieval quality
- [ ] Test context injection into prompts
- [ ] Verify retrieved documents are relevant
- [ ] Test with different chunk sizes

## 💰 Token Counting & Cost Analysis

### Basic Token Counting
- [ ] Verify token counts match API response
- [ ] Test cost calculation for each model
- [ ] Compare calculated costs with expected values
- [ ] Test with zero-cost local models

### Cost Breakdown
- [ ] Test `calculateCostBreakdown()` function
- [ ] Verify input vs output cost breakdown
- [ ] Test tokens-per-second calculation

### Aggregate Analysis
- [ ] Test `aggregateCostAnalysis()` with multiple calls
- [ ] Verify by-model aggregation
- [ ] Verify by-provider aggregation
- [ ] Test average calculations

### Cost Reports
- [ ] Generate chat run cost report
- [ ] Generate flow run cost report
- [ ] Generate summary report for multiple runs
- [ ] Verify formatting (currency, tokens, duration)

## 🎯 Model-Specific Features

### OpenAI Specific
- [ ] Test with all GPT models (4o, 4o-mini, 4-turbo, 4, 3.5-turbo)
- [ ] Test function calling with different models
- [ ] Test JSON mode compatibility
- [ ] Verify context window limits

### Anthropic Specific
- [ ] Test with all Claude models (3.5 Sonnet v1/v2, Opus, Sonnet, Haiku)
- [ ] Test extended thinking (if available)
- [ ] Test with long contexts (up to 200K tokens)
- [ ] Verify max_tokens behavior

## 🔐 Security & Error Handling

### API Key Management
- [ ] Test with missing API keys
- [ ] Test with invalid API keys
- [ ] Verify error messages are informative
- [ ] Ensure keys are not exposed in logs

### Rate Limiting
- [ ] Test behavior under rate limits
- [ ] Test retry logic with exponential backoff
- [ ] Monitor API usage to avoid hitting limits

### Input Validation
- [ ] Test with empty prompts
- [ ] Test with very long prompts
- [ ] Test with special characters
- [ ] Test with malformed tool definitions

## 🎨 UI/UX Tests

### Chat Interface
- [ ] Test sending messages
- [ ] Test streaming message display
- [ ] Test conversation history
- [ ] Test model switching mid-conversation
- [ ] Test settings panel

### Flow Editor
- [ ] Test visual flow editor
- [ ] Test adding/removing nodes
- [ ] Test connecting nodes
- [ ] Test saving flows
- [ ] Test loading flows
- [ ] Test flow execution from editor

### Cost Display
- [ ] Test real-time cost display during chat
- [ ] Test cost summary after flow completion
- [ ] Test historical cost tracking
- [ ] Test cost breakdown visualizations

## 📈 Performance Tests

### Response Time
- [ ] Measure time to first token (streaming)
- [ ] Measure total response time
- [ ] Compare performance across models
- [ ] Test with concurrent requests

### Memory Usage
- [ ] Monitor memory with large contexts
- [ ] Test with many concurrent conversations
- [ ] Test with large flow executions

### Database Performance
- [ ] Test with large number of saved conversations
- [ ] Test with large number of flow runs
- [ ] Test query performance on logs

## 🧪 Integration Tests

### End-to-End Scenarios
- [ ] Complete RAG workflow: upload → embed → search → generate
- [ ] Multi-step flow with external API calls
- [ ] Chat with tool calling and RAG
- [ ] Flow with multiple models and cost tracking

### Real-World Use Cases
- [ ] Document Q&A system
- [ ] Code generation with multiple iterations
- [ ] Data extraction and structuring
- [ ] Multi-agent collaboration flow

## 📝 Documentation Tests

- [ ] Verify README.md is up to date
- [ ] Verify USER_GUIDE.md covers all features
- [ ] Test all code examples in documentation
- [ ] Verify API documentation is accurate

## 🚀 Priority Test Items

Based on the new API keys and token counter implementation, prioritize these tests:

1. **High Priority**
   - Basic chat with OpenAI (GPT-4o)
   - Basic chat with Anthropic (Claude 3.5 Sonnet)
   - Token counting accuracy
   - Cost calculation accuracy
   - Streaming responses

2. **Medium Priority**
   - Function calling (OpenAI)
   - Flow execution with cost tracking
   - RAG workflow if Qdrant is configured
   - Cost reporting utilities

3. **Low Priority**
   - Advanced settings (temperature, top_p, etc.)
   - Logprobs and reproducibility
   - Performance benchmarks
   - UI polish

## 💡 Quick Start Tests

To quickly verify the system is working:

```bash
# Start the development server
cd ai-workbench
npm run dev
```

Then test:
1. Open http://localhost:3000
2. Send a message to GPT-4o: "Hello, what's 2+2?"
3. Check the response and cost displayed
4. Switch to Claude 3.5 Sonnet
5. Send the same message
6. Compare costs between models

## 📊 Expected Cost Ranges

For reference, here are approximate costs per 1K tokens:

**OpenAI:**
- GPT-4o: $0.0025 in / $0.01 out
- GPT-4o Mini: $0.00015 in / $0.0006 out
- GPT-4 Turbo: $0.01 in / $0.03 out

**Anthropic:**
- Claude 3.5 Sonnet: $0.003 in / $0.015 out
- Claude 3 Opus: $0.015 in / $0.075 out
- Claude 3 Haiku: $0.00025 in / $0.00125 out

A simple "Hello" message (10-20 tokens) should cost less than $0.001.

## 🐛 Known Issues to Test

- [ ] Test behavior when Qdrant is not running
- [ ] Test behavior when local LLM is not available
- [ ] Test database migrations
- [ ] Test with different Node.js versions

---

**Last Updated:** 2025-11-24
**API Keys Status:** ✅ Configured
**Token Counter:** ✅ Implemented
