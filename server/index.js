const express = require('express');
const cors = require('cors');
const todoStore = require('./todoStore');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ ok: false, message: 'Username and password are required' });
  }

  if (username === 'admin' && password === '1234') {
    return res.json({ ok: true, token: 'demo-admin-token', user: { username: 'admin' } });
  } else {
    return res.status(401).json({ ok: false, message: 'Invalid username or password' });
  }
});

app.get('/api/todos', async (req, res) => {
  try {
    console.log('GET /api/todos called');
    const tasks = await todoStore.getAll();
    console.log('Retrieved tasks:', tasks);
    res.json({ ok: true, tasks });
  } catch (e) {
    console.error('GET /api/todos error:', e);
    if (e.message && e.message.includes('JSON')) {
      console.log('JSON parse error detected, attempting to recover...');
      try {
        const { promises: fs } = require('fs');
        const path = require('path');
        const dataFile = path.join(__dirname, 'tasks.json');
        await fs.writeFile(dataFile, JSON.stringify({ tasks: [] }, null, 2), 'utf8');
        console.log('Recovery successful, returning empty tasks array');
        return res.json({ ok: true, tasks: [] });
      } catch (recoveryError) {
        console.error('Recovery failed:', recoveryError);
      }
    }
    res.status(500).json({ ok: false, message: 'Failed to load tasks' });
  }
});

app.post('/api/todos', async (req, res) => {
  try {
    const { title } = req.body || {};
    if (!title || !title.trim()) return res.status(400).json({ ok: false, message: 'Title is required' });
    const task = await todoStore.create({ title });
    res.status(201).json({ ok: true, task });
  } catch (e) {
    res.status(500).json({ ok: false, message: 'Failed to create task' });
  }
});

app.patch('/api/todos/:id', async (req, res) => {
  try {
    console.log('PATCH /api/todos/:id called');
    console.log('params:', req.params);
    console.log('body:', req.body);

    const id = parseInt(req.params.id, 10);
    console.log('parsed id:', id);

    if (Number.isNaN(id)) {
      console.log('Invalid ID error');
      return res.status(400).json({ ok: false, message: 'Invalid ID' });
    }

    const { title, completed } = req.body || {};
    console.log('updates:', { title, completed });

    const updated = await todoStore.update(id, { title, completed });
    console.log('todoStore.update result:', updated);

    if (!updated) {
      console.log('Task not found error');
      return res.status(404).json({ ok: false, message: 'Task not found' });
    }

    console.log('Success, returning:', updated);
    res.json({ ok: true, task: updated });
  } catch (e) {
    console.error('PATCH error:', e);
    res.status(500).json({ ok: false, message: 'Failed to update task' });
  }
});

app.delete('/api/todos/:id', async (req, res) => {
  try {
    console.log('DELETE /api/todos/:id called');
    console.log('params:', req.params);

    const id = parseInt(req.params.id, 10);
    console.log('parsed id:', id);

    if (Number.isNaN(id)) {
      console.log('Invalid ID error');
      return res.status(400).json({ ok: false, message: 'Invalid ID' });
    }

    const removed = await todoStore.remove(id);
    console.log('todoStore.remove result:', removed);

    if (!removed) {
      console.log('Task not found error for delete');
      return res.status(404).json({ ok: false, message: 'Task not found' });
    }

    console.log('Delete success');
    res.json({ ok: true });
  } catch (e) {
    console.error('DELETE error:', e);
    res.status(500).json({ ok: false, message: 'Failed to delete task' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
