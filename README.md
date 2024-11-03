# AI Agent Dashboard (AgentTrace)

## Overview

The AI Agent Dashboard is a web-based application designed to visualize and interact with messages from AI agents. It provides a user-friendly interface to explore conversations, tool usage, and decision-making processes of multiple AI agents.

## Features

- Display messages from multiple AI agents
- Visualize conversation chains and group chats
- Show tool use calls, thinking processes, and results
- Real-time updates of agent interactions
- Responsive design for various devices

## Tech Stack

- Frontend: React with Next.js
- Backend: FastAPI
- Styling: Tailwind CSS
- State Management: React Query

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- Python (v3.7 or later)

### Installation

1. Set up the frontend:

   ```
   cd frontend
   npm install
   ```

3. Set up the backend:
   ```
   cd backend
   pip install -r requirements.txt
   ```

### Running the Application

You can start both the frontend and backend concurrently using the `run.py` file in the top-level of this repository.

```bash
python -m run
```

Alternatively, 

1. Start the backend server:

   ```
   cd backend
   uvicorn main:app --reload
   ```

2. In a new terminal, start the frontend development server:

   ```
   cd frontend
   npm run dev
   ```

Open your browser and navigate to `http://localhost:3000`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
