import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";

// Our existing Webapp REST API base URL
const WEBAPP_API_URL = "http://localhost:3000/api";

// Create an MCP Server instance.
// This server acts as the bridge. It registers "Tools" that the AI can call.
const server = new McpServer({
    name: "Employee Directory MCP",
    version: "1.0.0",
});

// Tool 1: Get All Employees
server.registerTool(
    "get_all_employees",
    {
        description: "Fetch a list of all employees in the company",
    },
    async () => {
        try {
            const response = await axios.get(`${WEBAPP_API_URL}/employees`);
            return {
                content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
            };
        } catch (error: any) {
            return { content: [{ type: "text", text: `Error fetching employees: ${error.message}` }], isError: true };
        }
    }
);

// Tool 1b: Search Employees by Name
server.registerTool(
    "search_employees_by_name",
    {
        description: "Search for an employee by name to find their ID.",
        inputSchema: {
            name: z.string().describe("The name of the employee to search for")
        }
    },
    async ({ name }) => {
        try {
            const response = await axios.get(`${WEBAPP_API_URL}/employees/search`, { params: { name } });
            return {
                content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
            };
        } catch (error: any) {
            return { content: [{ type: "text", text: `Error searching employees: ${error.message}` }], isError: true };
        }
    }
);

// Tool 2: Get Employee Details by ID
server.registerTool(
    "get_employee_by_id",
    {
        description: "Fetch specific details for an employee using their ID",
        inputSchema: {
            employeeId: z.string().describe("The ID of the employee (e.g. 'emp1')")
        }
    },
    async ({ employeeId }) => {
        try {
            const response = await axios.get(`${WEBAPP_API_URL}/employees/${employeeId}`);
            return {
                content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
            };
        } catch (error: any) {
            return { content: [{ type: "text", text: `Error fetching employee: ${error.message}` }], isError: true };
        }
    }
);

// Tool 3: Get Employee Salary
server.registerTool(
    "get_employee_salary",
    {
        description: "Fetch the base salary and bonus for a specific employee",
        inputSchema: {
            employeeId: z.string().describe("The ID of the employee (e.g. 'emp1')")
        }
    },
    async ({ employeeId }) => {
        try {
            const response = await axios.get(`${WEBAPP_API_URL}/salary/${employeeId}`);
            return {
                content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
            };
        } catch (error: any) {
            return { content: [{ type: "text", text: `Error fetching salary: ${error.message}` }], isError: true };
        }
    }
);

// Tool 4: Get Employee Attendance
server.registerTool(
    "get_employee_attendance",
    {
        description: "Fetch attendance records (days present/absent) for a specific employee",
        inputSchema: {
            employeeId: z.string().describe("The ID of the employee (e.g. 'emp1')")
        }
    },
    async ({ employeeId }) => {
        try {
            const response = await axios.get(`${WEBAPP_API_URL}/attendance/${employeeId}`);
            return {
                content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
            };
        } catch (error: any) {
            return { content: [{ type: "text", text: `Error fetching attendance: ${error.message}` }], isError: true };
        }
    }
);

async function main() {
    // Start the server using 'stdio' transport.
    // This means the AI Agent will spawn this script as a child process and communicate via standard input/output.
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Employee MCP Server is running on stdio!");
}

main().catch((error) => {
    console.error("Fatal error starting MCP Server:", error);
    process.exit(1);
});
