import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Logo from '../components/Logo';
import api from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page login-page">
      <Link to="/" className="auth-brand" aria-label="KOLABORIN home">
        <Logo height={64} />
      </Link>
      <div className="auth-card">
        <div className="auth-header">
          <h2>Welcome to KOLABORIN</h2>
          <p className="auth-sub">Log in with your campus account</p>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Campus Email</label>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              required
              placeholder="e.g. mikail@kolaborin.test"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={submitting} className="btn-primary btn-block">
            {submitting ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Register here</Link>
        </div>

        <div className="demo-accounts-hint">
          <small>
            <strong>Demo Accounts:</strong><br />
            Student: <code>mikail@kolaborin.test</code><br />
            Organization: <code>hima@kolaborin.test</code><br />
            Admin: <code>admin@kolaborin.test</code><br />
            Password: <code>Password123!</code>
          </small>
        </div>
      </div>
    </div>
  );
}
