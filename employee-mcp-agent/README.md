# Employee AI Agent (Express API)

The intelligent layer of the project. It acts as an **MCP Client**, connecting to the local LLM and the MCP Server to provide a chat-based interface for data retrieval.

## Architecture

- **Model**: `gemma3:4b` (via Ollama)
- **Orchestration**: LangChain (`ChatOpenAI` adapter for local compatibility)
- **Logic**: Custom autonomous loop for tool chaining and JSON parsing.
- **Server**: Express.js (Port 3001)

## Tool Chaining Mechanism

Due to limitations in Ollama's native tool-binding for specific models, this agent uses a **Manual JSON Parser**:
1.  **System Prompt**: Injects tool descriptions and instructions.
2.  **Extraction**: Sanitizes LLM output (stripping Markdown) and parses JSON tool calls.
3.  **Recursive Execution**: A `while` loop allows the agent to chain multiple tool calls autonomously before giving a final answer.

## Invocation

- **HTTP API**: Exposes `POST /api/chat` for the Frontend.
- **CLI Logs**: Logs tool resolutions and LLM thoughts to the terminal in real-time.

## How to Run

```bash
cd employee-mcp-agent
npm install
npx tsc
node build/index.js
```
