import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Logo from '../components/Logo';
import api from '../api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [faculty, setFaculty] = useState('');
  const [major, setMajor] = useState('');
  const [role, setRole] = useState('student');
  const [organizationName, setOrganizationName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      if (role === 'organization' && !organizationName.trim()) {
        setError('Organization name is required.');
        setSubmitting(false);
        return;
      }
      const res = await api.post('/auth/register', {
        name,
        email,
        password,
        faculty,
        major,
        role,
        organizationName
      });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
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
          <h2>Join KOLABORIN</h2>
          <p className="auth-sub">Create your campus collaboration profile</p>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              name="name"
              autoComplete="name"
              required
              placeholder="e.g. Farrel Arkan"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Campus Email</label>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              required
              placeholder="e.g. student@itb.ac.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password (min. 8 characters)</label>
            <input
              id="password"
              type="password"
              name="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="faculty">Faculty / School</label>
              <input
                id="faculty"
                type="text"
                name="faculty"
                autoComplete="organization"
                placeholder="e.g. STEI"
                value={faculty}
                onChange={(e) => setFaculty(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="major">Major / Program</label>
              <input
                id="major"
                type="text"
                name="major"
                autoComplete="off"
                placeholder="e.g. Informatics"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="role">Account Type</label>
            <select
              id="role"
              name="role"
              autoComplete="off"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="student">Student</option>
              <option value="organization">Organization</option>
            </select>
          </div>

          {role === 'organization' && (
            <div className="form-group">
              <label htmlFor="organizationName">Organization Name</label>
              <input
                id="organizationName"
                type="text"
                name="organizationName"
                autoComplete="organization"
                required
                placeholder="e.g. HMIF"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
              />
            </div>
          )}

          <button type="submit" disabled={submitting} className="btn-primary btn-block">
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  );
}
