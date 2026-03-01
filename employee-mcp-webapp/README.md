# Employee MCP Webapp (Backend)

The core data service for the Employee Directory project. Built with **NestJS**, it provides a managed interface to the employee database.

## Architecture

- **Framework**: NestJS (TypeScript)
- **Database**: Local JSON file (`src/backend-data.json`)
- **Design Pattern**: Service-Controller architecture for clean separation of concerns.

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/employees` | List all employees |
| `GET` | `/api/employees/search?name=...` | Search employees by fuzzy name |
| `GET` | `/api/employees/:id` | Get full details for a specific ID |
| `GET` | `/api/salary/:employeeId` | Get salary and bonus data |
| `GET` | `/api/attendance/:employeeId` | Get attendance history |

## Invocation

This component is consumed primarily by the **MCP Server**. It runs on port **3000** by default.

## How to Run

```bash
cd employee-mcp-webapp
npm install
npm run start:dev
```
