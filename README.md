# Aether Tax Boilerplate

Full-stack starter with:

- Backend: Node.js + Express + Mongoose
- Frontend: React + Vite + Tailwind CSS

## Project Structure

```text
.
|-- backend
|   |-- src
|   |   |-- app.js
|   |   |-- server.js
|   |   `-- config/db.js
|   `-- .env.example
`-- frontend
    |-- src
    |   |-- App.tsx
    |   |-- main.tsx
    |   `-- index.css
    |-- tailwind.config.js
    `-- vite.config.ts
```

## Setup

1. Create backend env file:

```bash
cp backend/.env.example backend/.env
```

2. Update `backend/.env` with your MongoDB connection string.

3. Start both apps from root:

```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Run backend and frontend together
- `npm run dev:backend` - Run backend only
- `npm run dev:frontend` - Run frontend only
- `npm run build` - Build frontend for production

## Default URLs

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:5000/api/health`
