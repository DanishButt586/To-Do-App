import { useState } from 'react';
import './App.css';
import Dashboard from './Dashboard';

export default function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setUser(data.user);
        setIsAuthenticated(true);
        // Clear form
        setUsername('');
        setPassword('');
      } else {
        setMessage(`❌ ${data.message || 'Login failed'}`);
      }
    } catch {
      setMessage('🔗 Network error - please check your connection');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setMessage('');
  };

  // Show Dashboard if authenticated
  if (isAuthenticated) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  // Show Login form if not authenticated
  return (
    <div className="container">
      <form className="card" onSubmit={onSubmit}>
        <div className="login-icon">📝</div>
        <h1>TaskMaster Login</h1>
        <p className="login-subtitle">Organize your tasks, boost your productivity</p>
        
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          required
          disabled={loading}
        />
        
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          disabled={loading}
        />
        
        <button type="submit" disabled={loading}>
          {loading ? (
            <>
              <span>🔄</span> Signing in...
            </>
          ) : (
            <>
              <span>🚀</span> Sign In
            </>
          )}
        </button>
        
        {message && <div className="message">{message}</div>}
      </form>
    </div>
  );
}
