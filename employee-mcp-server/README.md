# Employee MCP Server

A bridge component that implements the **Model Context Protocol (MCP)**. It maps the custom REST API endpoints into "Tools" that any MCP-compliant AI client can understand and execute.

## Architecture

- **Protocol**: MCP (Model Context Protocol)
- **Transport**: Standard Input/Output (StdIO)
- **Integration**: Uses `axios` to communicate with the NestJS Backend.

## Tools Exposed

1.  `get_all_employees`: returns full list.
2.  `search_employees_by_name`: find IDs by human names.
3.  `get_employee_by_id`: basic info lookups.
4.  `get_employee_salary`: financial data retrieval.
5.  `get_employee_attendance`: tracking records.
6.  `get_complete_employee_stats`: **Aggregator tool** that fetches profile, salary, and attendance in parallel.

## Invocation

This component is designed to be spawned as a **child process** by an AI Agent (the MCP Client). It communicates via `stdin`/`stdout`.

## Deployment

Building the server:
```bash
cd employee-mcp-server
npm install
npx tsc
```
The resulting `build/index.js` is the entry point used by the Agent.
