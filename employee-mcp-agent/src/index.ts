import { ChatOpenAI } from "@langchain/openai";
import { type BaseMessage, HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import express from "express";
import cors from "cors";

// 1. Initialize our local Ollama model using LangChain's OpenAI compatibility wrapper
// This bypasses strict LangChain checks, natively allowing gemma3 to use tool definitions
const llm = new ChatOpenAI({
    modelName: "gemma3:4b",
    apiKey: "ollama", // Required but arbitrary for local Ollama
    temperature: 0,
    configuration: {
        baseURL: "http://localhost:11434/v1",
    }
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

    // Bind the mapped tools to the model (REMOVED due to Ollama strict whitelist)
    // const llmWithTools = llm.bindTools(toolsForLlm);

    // 5. Express API Server
    const app = express();
    app.use(cors());
    app.use(express.json());

    // Basic System Prompt injecting the tools manually
    const toolDescriptions = toolsForLlm.map((t: any) => `- Name: ${t.name}\n  Description: ${t.description}\n  Inputs necessary: ${JSON.stringify(t.parameters)}`).join("\n\n");
    const systemPrompt = new SystemMessage(`You are a helpful office assistant. You have access to the following tools to fetch data:\n\n${toolDescriptions}\n\nTo use a tool, you MUST reply with ONLY a raw JSON strictly matching this format: {"tool": "tool_name", "args": {"arg1": "value"}}. Do not include any other text. If you can answer without a tool, provide a normal textual response.`);

    // In-memory chat history for the session
    const chatHistory: BaseMessage[] = [systemPrompt];

    app.post("/api/chat", async (req: any, res: any) => {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        try {
            console.log(`\nUser: ${message}`);
            chatHistory.push(new HumanMessage(message));

            // A. Send the user message (and history) to the LLM
            let responseMessage = await llm.invoke(chatHistory);
            chatHistory.push(responseMessage);

            let loopCount = 0;
            while (loopCount < 5) {
                loopCount++;
                let messageContent = responseMessage.content;
                if (typeof messageContent !== 'string') {
                    messageContent = JSON.stringify(messageContent);
                }

                let isToolCall = false;
                try {
                    // Remove markdown block formatting if present (e.g. ```json ... ```)
                    let sanitizedContent = messageContent.trim();
                    if (sanitizedContent.startsWith('```')) {
                        sanitizedContent = sanitizedContent.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
                    }

                    const parsedContent = JSON.parse(sanitizedContent);
                    if (parsedContent.tool && typeof parsedContent.args === 'object') {
                        isToolCall = true;
                        console.log(`[Agent resolving tool: ${parsedContent.tool} with args: ${JSON.stringify(parsedContent.args)}]`);

                        try {
                            const toolResult = await mcpClient.callTool({
                                name: parsedContent.tool,
                                arguments: parsedContent.args
                            });

                            const toolContent = toolResult.content as any[];
                            const outputText = toolContent.find((c: any) => c.type === 'text')?.text || "No text output";

                            // Push the tool response to history as a follow-up
                            chatHistory.push(new HumanMessage(
                                `[Observation from tool execution - ${parsedContent.tool}]:\n${outputText}\nInstruct: Analyze the tools results and answer my initial question. If you need to fetch more information to complete the answer, you MUST output ANOTHER tool call JSON.`
                            ));
                        } catch (toolErr: any) {
                            chatHistory.push(new HumanMessage(
                                `[Tool execution failed]: ${toolErr.message}\nInstruct: Explain the failure or answer without the tool.`
                            ));
                        }

                        // Invoke LLM again so it can give the final answer based on the tool result, or call a second tool
                        responseMessage = await llm.invoke(chatHistory);
                        chatHistory.push(responseMessage);
                    }
                } catch (jsonErr) {
                    // Not JSON, so it's a regular text response from the LLM. 
                    // Break out of the loop and return this response.
                    break;
                }

                if (!isToolCall) break;
            }

            // Safe fallback for responseMessage typing
            console.log("RAW LLM RESPONSE:", JSON.stringify(responseMessage, null, 2));
            const finalStringContent = typeof responseMessage.content === 'string' ? responseMessage.content : JSON.stringify(responseMessage.content);

            console.log(`Agent: ${finalStringContent}`);
            res.json({ reply: finalStringContent });

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
