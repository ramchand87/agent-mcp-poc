# Employee Directory AI Agent - Master Project

This project demonstrates an end-to-end implementation of an AI Agent using the **Model Context Protocol (MCP)** to interact with a custom enterprise backend. The system allows users to chat with an AI capable of searching employees, checking salaries, and viewing attendance records data using a local LLM.

## Architecture Overview

The project is split into four main components:

1.  **[Backend (NestJS)](./employee-mcp-webapp/README.md)**: A RESTful API serving employee data from a JSON database.
2.  **[MCP Server](./employee-mcp-server/README.md)**: A bridge that exposes the Backend's REST endpoints as MCP Tools.
3.  **[AI Agent (Express/LangChain)](./employee-mcp-agent/README.md)**: The "brain" that connects to Ollama, registers MCP tools, and handles autonomous logic.
4.  **[Frontend (React)](./employee-mcp-frontend/README.md)**: A premium glassmorphism dashboard and chat interface.

---

## Getting Started with local LLM

This project uses **Ollama** to run models locally.

1.  **Install Ollama**: Download from [ollama.com](https://ollama.com).
2.  **Run the model**: Open your terminal and run:
    ```bash
    ollama run gemma3:4b
    ```
3.  Ensure the Ollama server is running at `http://localhost:11434`.

---

## Component Details

| Component | Directory | Description |
| :--- | :--- | :--- |
| **Backend** | `employee-mcp-webapp` | NestJS REST API (Port 3000) |
| **MCP Server** | `employee-mcp-server` | StdIO bridge between AI and API |
| **AI Agent** | `employee-mcp-agent` | Express API for Chat (Port 3001) |
| **Frontend** | `employee-mcp-frontend` | React/Vite UI (Port 5173) |

---

## Chaining Logic & Tools

The AI Agent utilizes a custom autonomous loop to chain tools. If you ask "What is Jones' salary?", the agent will:
1.  **Search** for "Jones" to find his ID (`emp2`).
2.  **Fetch** salary for `emp2`.
3.  **Respond** with the final answer.

Alternatively, the agent can use the **Aggregator Tool** (`get_complete_employee_stats`) to fetch all three data points in a single parallelized request, demonstrating a more efficient MCP architecture.

Refer to the individual component READMEs for specific setup and architecture details.
