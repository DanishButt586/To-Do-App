# MERN To‑Do Application

Hi! I'm **Danish Butt**. This is my **first MERN stack application** and building it has been an amazing learning experience. My goal was to understand how the client and server pieces fit together while keeping the code clean, structured, and a bit more robust than a basic tutorial app.

It’s a lightweight task manager where you can add tasks, toggle completion, rename them, and delete them. I focused on reliability even with simple file storage: safe JSON handling, backups, and atomic writes so the data file does not easily corrupt. Writing this helped me understand full‑stack flow end‑to‑end.

> MongoDB is **not integrated yet** – persistence is a local JSON file (`server/tasks.json`) plus an automatic backup. Swapping in a real database later should mainly involve replacing `todoStore.js`.

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

## 🗂 Directory Structure (Current)

```
To-Do-App/
  README.md
  package.json                 # Root scripts (concurrently for dev)
  client/
    package.json
    vite.config.js
    src/
      main.jsx
      App.jsx
      Dashboard.jsx
      api.js                   # Client-side fetch layer w/ retry & safe JSON
      App.css / index.css / ...
  server/
    package.json
    index.js                   # Express server (routes: health, login, todos CRUD)
    todoStore.js               # File-based data layer (locking, backups, atomic writes)
    tasks.json                 # Primary data file (auto-created)
    tasks.backup.json          # Automatic backup
    nodemon.json
```

### 🧭 How the App Works (UI Perspective)
1. You open the app and see an input box to add a new task and a list of existing tasks.
2. Type a title and submit – the task appears instantly with a checkbox (completed state is initially off).
3. Click the checkbox to toggle completion; the UI reflects the new state and persists it.
4. Rename a task (if UI allows inline editing – otherwise future improvement) or simply manage completion.
5. Delete a task using its delete control; it is removed from the list and from storage.
6. All interactions call a small REST API behind the scenes; if something goes wrong the client has retry + safe error messaging.

This flow helped me learn request/response cycles, optimistic updates, and safe parsing patterns.

---

## 🔐 Demo Login

Static credentials (for demo only):

Username: `admin`
Password: `1234`

Currently tasks are not locked to a user; this login is just a learning placeholder.

---

<!-- API Reference section intentionally removed per current scope: focusing on user-facing behavior rather than endpoint documentation. -->

---

<!-- Testing roadmap removed for now to keep focus on the current implementation. -->

---

<!-- Available scripts section removed per instruction. -->

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

<!-- Roadmap removed: focusing only on the current application state. -->

---

## 👨‍💻 Developer

| Name        | Role              | Notes                                              |
| ----------- | ----------------- | -------------------------------------------------- |
| Danish Butt | Developer / Owner | First MERN project – exploring full‑stack patterns |

This is a personal learning project right now. I am keeping the scope focused as I build confidence with the MERN stack basics.

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
