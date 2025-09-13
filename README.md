# MERN To-Do Application

A lightweight MERN (MongoDB\* / Express / React / Node) style task management application. This implementation currently uses a JSON file for persistence (no database layer yet) while exposing a REST API that the React (Vite) client consumes. The server code has been written defensively with file‑locking, retry, backup, and recovery logic to keep your task data resilient against partial writes or JSON corruption.

> _Note: MongoDB is not yet integrated; storage is local JSON (`server/tasks.json`). The structure and separation make swapping in a real database straightforward later._

---

## ✨ Features

- Add, update (title + completion), and delete tasks
- Auto‑incrementing numeric IDs
- In‑file persistence with automatic backup + recovery (`tasks.backup.json`)
- Graceful handling of empty / corrupted JSON
- Idempotent, retryable client fetch helpers with exponential backoff
- Simple token-based demo login endpoint (static credentials)
- Modular file‑locked data layer preventing race conditions
- Vite + React 19 modern frontend (ESM, fast HMR)
- Concurrent dev startup (single root script launches client & server)

---

## 🧱 Tech Stack

| Layer       | Technology                                |
| ----------- | ----------------------------------------- |
| Client      | React 19, Vite                            |
| Server      | Node.js, Express 5 (beta), CORS           |
| Persistence | Local JSON file with backup/atomic writes |
| Tooling     | Nodemon, Concurrently, ESLint             |

---

## 🗂 Directory Structure

```
To-Do App/
  package.json              # Root: dev script (concurrently)
  README.md
  client/
    package.json
    vite.config.js
    src/
      api.js                # REST client with retry + parsing safety
      App.jsx, Dashboard.jsx
      ...styles/assets
  server/
    index.js                # Express API
    todoStore.js            # File-backed data layer with locking & backup logic
    tasks.json              # Primary data file (auto-created)
    tasks.backup.json       # Rolling backup (created automatically)
    nodemon.json
```

---

## 🏗 Architecture Overview

Frontend (React) calls REST endpoints under `/api/*`. The backend delegates CRUD operations to `todoStore.js`, which:

1. Acquires a mutex to serialize file access
2. Loads & validates JSON (with multi-attempt parsing and backup restore)
3. Performs mutation (create/update/remove)
4. Saves atomically: temp file -> validation -> rename
5. Maintains a backup copy before each write

This design permits future migration to a DB (Mongo, Postgres, etc.) by swapping only the store implementation while keeping route contracts stable.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (recommended)
- npm 9+ (comes with Node)

### 1. Clone

```bash
git clone <your-fork-or-origin-url> To-Do-App
cd To-Do-App
```

### 2. Install Dependencies (root script handles both subprojects)

```bash
npm install        # installs root devDependency (concurrently)
(cd server && npm install)
(cd client && npm install)
```

On Windows PowerShell you can run sequentially:

```powershell
npm install; cd server; npm install; cd ..; cd client; npm install; cd ..
```

### 3. Run in Development

```bash
npm run dev
```

This launches:

- Server: http://localhost:5000
- Client (Vite): http://localhost:5173 (proxy or direct fetch to /api if configured)

### 4. Build Client for Production

```bash
cd client
npm run build
```

The build output goes to `client/dist/`. (A production server integration step is not yet wired to serve these assets.)

### 5. Start Server Only

```bash
cd server
npm run start      # or: npm run dev (with nodemon)
```

---

## 🔐 Demo Login

A simple static login exists for demonstration only:

```
POST /api/login
{ "username": "admin", "password": "1234" }
-> { ok: true, token: "demo-admin-token", user: { username: "admin" } }
```

No authorization is enforced on task routes yet.

---

## 📦 API Reference

Base URL (dev): `http://localhost:5000/api`

### Health Check

GET `/health`
Response:

```json
{ "status": "ok" }
```

### Login

POST `/login`
Body:

```json
{ "username": "admin", "password": "1234" }
```

Responses:

- 200 OK:

```json
{ "ok": true, "token": "demo-admin-token", "user": { "username": "admin" } }
```

- 400 / 401 error:

```json
{ "ok": false, "message": "Invalid username or password" }
```

### Get All Todos

GET `/todos`
Success 200:

```json
{
  "ok": true,
  "tasks": [
    {
      "id": 1,
      "title": "Task",
      "completed": false,
      "createdAt": "ISO",
      "updatedAt": "ISO"
    }
  ]
}
```

Failures: `500 { ok:false, message:"Failed to load tasks" }`

### Create Todo

POST `/todos`
Body:

```json
{ "title": "New task" }
```

Responses:

- 201 Created:

```json
{
  "ok": true,
  "task": {
    "id": 2,
    "title": "New task",
    "completed": false,
    "createdAt": "ISO",
    "updatedAt": "ISO"
  }
}
```

- 400 Missing title:

```json
{ "ok": false, "message": "Title is required" }
```

### Update Todo

PATCH `/todos/:id`
Body (any subset):

```json
{ "title": "Renamed", "completed": true }
```

Responses:

- 200 OK: `{ "ok": true, "task": { ...updatedTask } }`
- 400 Invalid ID / malformed body
- 404 Not found
- 500 Failed update

### Delete Todo

DELETE `/todos/:id`
Responses:

- 200 OK: `{ "ok": true }`
- 400 Invalid ID
- 404 Not found
- 500 Failure

---

## 🧪 Testing

No automated test suite is included yet. Potential next steps:

- Add Jest + Supertest for API routes
- Add React Testing Library for component tests
- Introduce contract tests for the data layer

---

## 📜 Available Scripts

Root:

- `npm run dev` – concurrently runs server + client

Server (`/server`):

- `npm start` – start API (production mode)
- `npm run dev` – start with nodemon (hot reload)

Client (`/client`):

- `npm run dev` – Vite dev server
- `npm run build` – production bundle
- `npm run preview` – preview built bundle
- `npm run lint` – ESLint check

---

## 🔄 Data Persistence & Integrity

The file store (`todoStore.js`) adds resilience:

- Mutex prevents concurrent read/write corruption
- Multi-attempt read parsing with backup fallback
- Backup created prior to each successful write
- Atomic writes using temporary file + rename
- Auto-heals empty / invalid `tasks.json`

Data Shape (`tasks.json`):

```json
{
  "tasks": [
    {
      "id": 1,
      "title": "Example",
      "completed": false,
      "createdAt": "ISO",
      "updatedAt": "ISO"
    }
  ]
}
```

---

## 🛠 Troubleshooting

| Issue                   | Cause                        | Fix                                                             |
| ----------------------- | ---------------------------- | --------------------------------------------------------------- |
| `Failed to load tasks`  | Corrupted `tasks.json`       | Delete `tasks.json` (it will regenerate) or restore from backup |
| Client cannot reach API | Wrong port / proxy misconfig | Ensure server on 5000; calls use `/api/*` relative path         |
| `Invalid ID` errors     | Non-numeric `:id` in URL     | Ensure integer IDs are used                                     |
| Empty response warnings | Server returned empty body   | Check server console for earlier errors                         |

---

## 🗺 Roadmap Ideas

- Replace file storage with MongoDB (true "M" in MERN)
- Auth + JWT enforcement on task routes
- User-specific task lists
- Pagination / filtering / search
- Optimistic UI updates & offline cache
- Tests & CI pipeline
- Dockerfile + Compose (client + server)
- Serve built client from Express in production

---

## 🤝 Contributing

1. Fork repo
2. Create feature branch: `git checkout -b feat/awesome`
3. Commit changes: `git commit -m "feat: add awesome"`
4. Push branch: `git push origin feat/awesome`
5. Open Pull Request

Use conventional commits if possible (feat, fix, chore, docs, refactor, test).

---

## 📄 License

This project is licensed under the ISC License (default in `package.json`). You may adapt licensing as needed.

---

## 🙏 Acknowledgements

- React & Vite teams
- Express maintainers
- Inspiration: building robust persistence without a database

---

## 📌 Notes

Express 5 is currently in stable release (5.1.x). If you prefer LTS stability semantics, you can lock to a specific minor version.

---

Happy hacking! 🚀
