import { ChatOllama } from "@langchain/ollama";
import { type BaseMessage, HumanMessage } from "@langchain/core/messages";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import * as readLine from 'readline';

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

    // 5. Interactive Chat Loop
    const rl = readLine.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const chatHistory: BaseMessage[] = [];

    const askQuestion = () => {
        rl.question("\nYou: ", async (input) => {
            if (input.toLowerCase() === 'exit') {
                process.exit(0);
            }

            chatHistory.push(new HumanMessage(input));

            try {
                // A. Send the user message (and history) to the LLM
                const responseMessage = await llmWithTools.invoke(chatHistory);

                chatHistory.push(responseMessage);

                // B. Check if the LLM decided to use a Tool
                if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
                    for (const toolCall of responseMessage.tool_calls) {
                        console.log(`\n[Agent executing tool: ${toolCall.name} with args: ${JSON.stringify(toolCall.args)}]`);

                        // C. Execute the chosen tool against the connected MCP server
                        const toolResult = await mcpClient.callTool({
                            name: toolCall.name,
                            arguments: toolCall.args
                        });

                        // For simplicity in this demo, log the raw text content back
                        const toolContent = toolResult.content as any[];
                        const outputText = toolContent.find((c: any) => c.type === 'text')?.text || "No text output";
                        console.log(`[Tool Result]:\n`, outputText);

                        // In a real LangChain ReAct loop, you would append this tool response back to the chatHistory 
                        // and invoke the LLM *again* so it can formulate a final answer based on the tool result.
                        // For this specific sample, we just display the raw data retrieved via the tool.
                    }
                } else {
                    // Normal conversation without tool use
                    console.log(`\nAgent: ${responseMessage.content}`);
                }
            } catch (e: any) {
                console.error("Error communicating with Agent:", e.message);
            }

            askQuestion();
        });
    };

    console.log("\nAgent Ready. You can ask questions like: 'Fetch all employees' or type 'exit' to quit.");
    askQuestion();
}

main().catch(console.error);
