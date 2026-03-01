# Employee Directory Frontend

A modern, responsive web dashboard and chat interface for interacting with the Employee AI system.

## Architecture

- **Framework**: React 19 + TypeScript
- **Bundler**: Vite
- **Styling**: Vanilla CSS (Custom Design System)
- **Design Aesthetic**: Premium Dark Mode with Glassmorphism.

## Features

- **Data Dashboard**: Action buttons for instant API lookups.
- **AI Chat Console**: A dedicated console to talk to the AI Agent.
- **Dynamic Updates**: Real-time state management for message history and loading states.

## Invocation

The frontend communicates with:
- **NestJS Backend** (Port 3000): For direct dashboard actions.
- **AI Agent API** (Port 3001): For the integrated chat console.

## How to Run

```bash
cd employee-mcp-frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.
