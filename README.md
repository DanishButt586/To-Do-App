# MERN To‑Do Application

Hi! I'm **Danish Butt** and this repository contains my **very first MERN stack project**. I built it to learn core full‑stack concepts: structuring a React frontend, exposing a clean REST API with Express, and designing a persistence layer (currently file‑based) that can later be swapped for a real database like MongoDB.

This app is a lightweight task manager. Even though it's an early learning project, I challenged myself to add production‑style resilience: safe JSON parsing, backups, atomic writes, and a simple modular data layer. I wrote the README myself to document what I learned and where I want to take the project next.

> Note: MongoDB is **not integrated yet**. Data is stored locally in `server/tasks.json` with an automatic backup file. Replacing the store with MongoDB should only require changing `todoStore.js`.

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
    tasks.backup.json       # Rolling backup (created automatically)
  <!-- The previous "Getting Started" section was intentionally removed to keep this README focused on the learning summary and architecture. I can reintroduce a quickstart later if needed. -->

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

## 👨‍💻 Developer

| Name        | Role              | Notes |
|-------------|-------------------|-------|
| Danish Butt | Developer / Owner | First MERN project – exploring full‑stack patterns |

This is a personal learning project right now, so external contributions are paused until I solidify the roadmap. I may open it for issues / PRs later once I add MongoDB and tests.

---

## 📄 License

This project is licensed under the ISC License (default in `package.json`). You may adapt licensing as needed.

---

## 🙏 Acknowledgements

I learned a lot from official docs (React, Vite, Express) and from experimenting with how to make file persistence safer. Even though this is my first MERN-style project, I tried to think about reliability early.

---

## 📌 Notes

Express 5 is currently in stable release (5.1.x). Future improvement: lock versions and introduce environment-based config + MongoDB.

---

Thanks for checking out my first MERN project! 🚀
