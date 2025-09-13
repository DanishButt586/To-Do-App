import { useEffect, useState, useCallback, useRef } from 'react';
import './Dashboard.css';
import { fetchTodos, createTodo, updateTodo, deleteTodo } from './api';

export default function Dashboard({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [updatingIds, setUpdatingIds] = useState(new Set());
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false); // Track updating tasks
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false); // Track logout confirmation
  const inputRef = useRef(null); // Reference to the input field

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchTodos();
      setTasks(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  // Placeholder simple streak: consecutive days with at least one task created (not rigorous)
  const streak = (() => {
    const dates = [...new Set(tasks.map(t => t.createdAt?.slice(0,10)))].sort();
    if (!dates.length) return 0;
    let count = 1;
    for (let i = dates.length - 1; i > 0; i--) {
      const d1 = new Date(dates[i]);
      const d0 = new Date(dates[i-1]);
      const diff = (d1 - d0)/(1000*60*60*24);
      if (diff === 1) count++; else if (diff > 1) break;
    }
    return count;
  })();

  const visibleTasks = tasks.filter(t =>
    filter === 'all' ? true : filter === 'active' ? !t.completed : t.completed
  );

  async function handleCreate(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      setCreating(true);
      const task = await createTodo(newTitle.trim());
      setTasks(prev => [...prev, task]);
      setNewTitle('');
      // Keep focus on the input field after adding a task
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  }

  async function toggleComplete(task) {
    // Prevent rapid multiple clicks on the same task
    if (updatingIds.has(task.id)) {
      console.log('Toggle already in progress for task:', task.id);
      return;
    }

    console.log('toggleComplete called for task:', task);
    
    // Mark this task as being updated
    setUpdatingIds(prev => new Set([...prev, task.id]));
    
    try {
      const updated = await updateTodo(task.id, { completed: !task.completed });
      console.log('toggleComplete success:', updated);
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    } catch (e) { 
      console.error('toggleComplete error:', e);
      setError(e.message); 
    } finally {
      // Remove task from updating set
      setUpdatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(task.id);
        return newSet;
      });
    }
  }

  async function saveEdit(task) {
    if (!editingTitle.trim()) { setEditingId(null); return; }
    try {
      const updated = await updateTodo(task.id, { title: editingTitle.trim() });
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
      setEditingId(null);
      setEditingTitle('');
    } catch (e) { setError(e.message); }
  }

  async function remove(task) {
    console.log('remove called for task:', task);
    const id = task.id;
    // optimistic
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await deleteTodo(id);
      console.log('remove success for id:', id);
    } catch (e) {
      console.error('remove error:', e);
      setError(e.message);
      // revert
      load();
    }
  }

  async function completeAll() {
    const toUpdate = tasks.filter(t => !t.completed);
    for (const t of toUpdate) {
      try { const upd = await updateTodo(t.id, { completed: true }); setTasks(prev => prev.map(x => x.id===t.id?upd:x)); } catch(e){ setError(e.message); break; }
    }
  }

  async function clearCompleted() {
    const done = tasks.filter(t => t.completed);
    for (const t of done) {
      try { 
        const updated = await updateTodo(t.id, { completed: false }); 
        setTasks(prev => prev.map(x => x.id === t.id ? updated : x)); 
      } catch(e){ 
        setError(e.message); 
        break; 
      }
    }
  }

  async function deleteAll() {
    setShowDeleteAllConfirm(true);
  }

  async function confirmDeleteAll() {
    setShowDeleteAllConfirm(false);
    const allIds = tasks.map(t => t.id);
    // optimistic clear
    setTasks([]);
    for (const id of allIds) {
      try { await deleteTodo(id); } catch(e){ setError(e.message); }
    }
  }

  function handleLogoutRequest() {
    setShowLogoutConfirm(true);
  }

  function confirmLogout() {
    setShowLogoutConfirm(false);
    onLogout();
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <h1 title="TaskMaster - Your productivity companion">📝 TaskMaster Dashboard</h1>
          <button 
            className="logout-btn" 
            onClick={handleLogoutRequest}
            title="Sign out of your account"
          >🚪 Logout</button>
        </div>
        <div className="dashboard-content">
          <div className="welcome-section">
            <div className="avatar" title="Your profile avatar">👨‍💼</div>
            <h2 title={`Hello ${user?.username}, ready to be productive?`}>Welcome back, {user?.username}!</h2>
            <p title="Your daily motivation">Plan it. Do it. Finish strong.</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card" title={`You have ${total} total tasks in your list`}>
              <div className="stat-icon">📋</div>
              <div className="stat-info"><h3>Total</h3><p className="stat-number">{total}</p></div>
            </div>
            <div className="stat-card" title={`${completed} tasks completed - Great job!`}>
              <div className="stat-icon">✅</div>
              <div className="stat-info"><h3>Done</h3><p className="stat-number">{completed}</p></div>
            </div>
            <div className="stat-card" title={`${pending} tasks still need your attention`}>
              <div className="stat-icon">⏳</div>
              <div className="stat-info"><h3>Pending</h3><p className="stat-number">{pending}</p></div>
            </div>
            <div className="stat-card" title={`Your productivity streak is ${streak} days strong!`}>
              <div className="stat-icon">🔥</div>
              <div className="stat-info"><h3>Streak</h3><p className="stat-number">{streak}d</p></div>
            </div>
          </div>

          <section className="todo-panel">
            <form onSubmit={handleCreate} className="todo-create-row">
              <input
                ref={inputRef}
                className="todo-input"
                placeholder="Add a new task..."
                title="Type your task and press Enter or click Add"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                disabled={creating}
              />
              <button 
                className="action-btn primary" 
                disabled={creating || !newTitle.trim()}
                title={creating ? 'Adding task...' : 'Click to add this task to your list'}
              >
                {creating ? 'Adding...' : 'Add'}
              </button>
            </form>

            <div className="todo-filters">
              {['all','active','completed'].map(f => (
                <button
                  key={f}
                  type="button"
                  className={`filter-btn ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                  title={`Show ${f} tasks`}
                >{f.charAt(0).toUpperCase()+f.slice(1)}</button>
              ))}
              <div className="flex-spacer" />
              <div className="bulk-actions">
                <button 
                  type="button" 
                  className="mini-btn" 
                  onClick={completeAll} 
                  disabled={!tasks.some(t=>!t.completed)} 
                  title="Mark all pending tasks as completed"
                >✔ All</button>
                <button 
                  type="button" 
                  className="mini-btn" 
                  onClick={clearCompleted} 
                  disabled={!tasks.some(t=>t.completed)} 
                  title="Mark all completed tasks as incomplete"
                >Uncheck</button>
                <button 
                  type="button" 
                  className="mini-btn danger" 
                  onClick={deleteAll} 
                  disabled={!tasks.length} 
                  title="Delete ALL tasks permanently"
                >Del All</button>
                <button 
                  type="button" 
                  className="refresh-btn" 
                  onClick={load} 
                  title="Refresh the task list from server"
                >↻</button>
              </div>
            </div>

            <div className="todo-list-wrapper">
              {loading && <div className="loading">Loading tasks...</div>}
              {!loading && visibleTasks.length === 0 && <div className="empty">No tasks {filter !== 'all' ? filter : ''} yet.</div>}
              <ul className="todo-list">
                {visibleTasks.map(task => (
                  <li 
                    key={task.id} 
                    className={`todo-item ${task.completed ? 'done' : ''} ${updatingIds.has(task.id) ? 'updating' : ''}`}
                    title={`Created: ${new Date(task.createdAt).toLocaleDateString()} | Updated: ${new Date(task.updatedAt).toLocaleDateString()}`}
                  >
                    <button
                      type="button"
                      className="check-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleComplete(task);
                      }}
                      disabled={updatingIds.has(task.id)}
                      aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
                      title={updatingIds.has(task.id) ? 'Updating...' : (task.completed ? 'Click to mark as incomplete' : 'Click to mark as complete')}
                    >{updatingIds.has(task.id) ? '⏳' : (task.completed ? '✔' : '')}</button>
                    {editingId === task.id ? (
                      <input
                        className="edit-input"
                        value={editingTitle}
                        autoFocus
                        onChange={e => setEditingTitle(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); saveEdit(task);} if (e.key==='Escape'){ setEditingId(null); } }}
                        onBlur={() => saveEdit(task)}
                        title="Press Enter to save, Escape to cancel"
                      />
                    ) : (
                      <span
                        className="title"
                        onDoubleClick={() => { setEditingId(task.id); setEditingTitle(task.title); }}
                        title={`"${task.title}" - Double-click to edit`}
                      >{task.title}</span>
                    )}
                    <div className="item-actions">
                      <button 
                        type="button" 
                        className="icon-btn" 
                        onClick={(e) => {
                          e.stopPropagation(); 
                          setEditingId(task.id); 
                          setEditingTitle(task.title);
                        }} 
                        title="Edit this task"
                      >✏️</button>
                      <button 
                        type="button" 
                        className="icon-btn danger" 
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(task);
                        }} 
                        title="Delete this task permanently"
                      >🗑️</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            {error && <div className="error-box">{error}</div>}
          </section>
        </div>
      </div>

      {/* Custom Delete All Confirmation Modal */}
      {showDeleteAllConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteAllConfirm(false)}>
          <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🗑️ Delete All Tasks</h3>
            </div>
            <div className="modal-content">
              <p>Are you sure you want to delete <strong>all {tasks.length} tasks</strong>?</p>
              <p className="modal-warning">⚠️ This action cannot be undone!</p>
            </div>
            <div className="modal-actions">
              <button 
                className="modal-btn cancel-btn" 
                onClick={() => setShowDeleteAllConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="modal-btn confirm-btn" 
                onClick={confirmDeleteAll}
              >
                Yes, Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="custom-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🚪 Confirm Logout</h3>
            </div>
            <div className="modal-content">
              <p>Are you sure you want to <strong>logout</strong>?</p>
              <p className="modal-warning">You'll need to login again to access your tasks.</p>
            </div>
            <div className="modal-actions">
              <button 
                className="modal-btn cancel-btn" 
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="modal-btn confirm-btn" 
                onClick={confirmLogout}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}