import { ChatOllama } from "@langchain/ollama";
import { type BaseMessage, HumanMessage } from "@langchain/core/messages";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import express from "express";
import cors from "cors";

// 1. Initialize our local Ollama model using LangChain
const llm = new ChatOllama({
    baseUrl: "http://localhost:11434",
    model: "gemma3:4b",
    temperature: 0,
});

async function main() {
    console.log("Starting MCP Agent Client...");

    // 2. Setup the transport to connect to our custom MCP Server.
    // Because our server runs via stdio, we spawn it as a child process.
    // Adjust the path to 'node' and the compiled 'index.js' as needed based on your workspace setup
    const transport = new StdioClientTransport({
        command: "node",
        args: ["../employee-mcp-server/build/index.js"], // Path to the compiled MCP server we built
    });

    const mcpClient = new Client({ name: "ollama-agent", version: "1.0.0" }, {
        capabilities: {},
    });

    console.log("Connecting to MCP Server...");
    await mcpClient.connect(transport);
    console.log("Connected successfully!");

    // 3. Fetch the available tools provided by the MCP server
    const toolListResponse = await mcpClient.listTools();

    // 4. Register these tools with our LangChain LLM instance
    // The MCP SDK returns tools in a format we can dynamically parse to the model.
    const toolsForLlm = toolListResponse.tools.map((tool: any) => ({
        name: tool.name,
        description: tool.description,
        // Provide an empty/dynamic JSON schema for tools without schemas to satisfy LangChain typing loosely,
        // though gemma3:4b natively understands structured parameters given the proper schema.
        parameters: tool.inputSchema || { type: "object", properties: {} },
    }));

    if (toolsForLlm.length > 0) {
        console.log(`Registered ${toolsForLlm.length} tools. Binding to LLM...`);
    }

    // Bind the mapped tools to the model
    const llmWithTools = llm.bindTools(toolsForLlm);

    // 5. Express API Server
    const app = express();
    app.use(cors());
    app.use(express.json());

    // In-memory chat history for the session
    const chatHistory: BaseMessage[] = [];

    app.post("/api/chat", async (req: any, res: any) => {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        try {
            console.log(`\nUser: ${message}`);
            chatHistory.push(new HumanMessage(message));

            // A. Send the user message (and history) to the LLM
            let responseMessage = await llmWithTools.invoke(chatHistory);
            chatHistory.push(responseMessage);

            // B. Check if the LLM decided to use a Tool
            if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
                // We'll iterate through all tool calls, though often there's just one
                for (const toolCall of responseMessage.tool_calls) {
                    console.log(`[Agent resolving tool: ${toolCall.name} with args: ${JSON.stringify(toolCall.args)}]`);

                    // C. Execute the chosen tool against the connected MCP server
                    const toolResult = await mcpClient.callTool({
                        name: toolCall.name,
                        arguments: toolCall.args
                    });

                    const toolContent = toolResult.content as any[];
                    const outputText = toolContent.find((c: any) => c.type === 'text')?.text || "No text output";

                    // Push the tool response to history as a follow-up
                    chatHistory.push(new HumanMessage(
                        `[Observation from tool execution - ${toolCall.name}]:\n${outputText}\nInstruct: Analyze the tools results and answer my initial question.`
                    ));
                }

                // D. Invoke LLM again so it can give the final answer based on the tool result
                responseMessage = await llmWithTools.invoke(chatHistory);
                chatHistory.push(responseMessage);
            }

            console.log(`Agent: ${responseMessage.content}`);
            res.json({ reply: responseMessage.content });

        } catch (e: any) {
            console.error("Error processing chat:", e.message);
            res.status(500).json({ error: "Failed to process chat: " + e.message });
        }
    });

    const PORT = 3001;
    app.listen(PORT, () => {
        console.log(`\nAgent API Server running on port ${PORT}`);
        console.log(`Accepting POST requests at http://localhost:${PORT}/api/chat`);
    });
}

main().catch(console.error);
