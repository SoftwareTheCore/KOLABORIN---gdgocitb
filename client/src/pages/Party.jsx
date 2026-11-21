import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import api from '../api';

export default function Party() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [groups, setGroups] = useState([]);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const fetchGroups = async () => {
    try {
      const url = subjectFilter ? `/groups?subject=${encodeURIComponent(subjectFilter)}` : '/groups';
      const res = await api.get(url);
      setGroups(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [subjectFilter]);

  const handleJoin = async (groupId) => {
    try {
      const res = await api.post(`/groups/${groupId}/join`);
      showToast(res.data.points?.awarded > 0 ? `+${res.data.points.awarded} points earned! 🎉` : 'Joined group successfully!');
      refreshProfile();
      fetchGroups();
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not join group');
    }
  };

  // Distinct subjects for filter
  const subjects = ['All', 'Database Systems', 'Calculus', 'Data Structures', 'Linear Algebra', 'Thermodynamics', 'Software Engineering'];

  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: '1100px', margin: '0 auto' }}>
      {toast && <div className="toast-pill">{toast}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2>Open Party 🎉</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
            Find study partners, join active study sessions, and ask questions.
          </p>
        </div>
        <Link to="/groups/new" className="btn-primary">
          ➕ Create Study Group
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="filter-scroll" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
        {subjects.map(s => {
          const isSelected = (s === 'All' && !subjectFilter) || subjectFilter === s;
          return (
            <button
              key={s}
              onClick={() => setSubjectFilter(s === 'All' ? '' : s)}
              className={isSelected ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem', borderRadius: '9999px', whiteSpace: 'nowrap' }}
            >
              {s}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading study groups...</p>
      ) : groups.length === 0 ? (
        <div className="empty-state" style={{ padding: '3rem 1rem', background: 'var(--card)', borderRadius: 'var(--radius-card)', border: '1px solid var(--border)' }}>
          <h3>No study groups found</h3>
          <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>Be the first to create one for this subject!</p>
          <Link to="/groups/new" className="btn-primary" style={{ marginTop: '1rem' }}>
            Create Study Group
          </Link>
        </div>
      ) : (
        <div className="party-grid">
          {groups.map(g => {
            const percent = Math.min(100, (g.member_count / g.max_members) * 100);
            return (
              <div key={g.id} className="party-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span className="tag-subject">{g.subject}</span>
                  <span className={`status-badge status-${g.status === 'open' ? 'verified' : 'pending'}`}>
                    {g.status.toUpperCase()}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem' }}>{g.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.75rem', flex: 1 }}>
                  {g.description || 'No description provided.'}
                </p>

                <div style={{ fontSize: '0.85rem', color: 'var(--text)', marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span>📍 <strong>{g.location_name}</strong></span>
                  <span>🕒 {new Date(g.scheduled_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                  <span>👤 Host: {g.creator_name}</span>
                </div>

                {/* Member Progress Bar */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem', color: 'var(--muted)' }}>
                    <span>Members</span>
                    <span><strong>{g.member_count}</strong> / {g.max_members}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${percent}%` }}></div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link to={`/groups/${g.id}`} className="btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>
                    Open Space
                  </Link>
                  {g.is_member ? (
                    <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.75rem', color: 'var(--ok)', fontWeight: 600, fontSize: '0.85rem' }}>
                      ✓ Joined
                    </span>
                  ) : g.status === 'full' ? (
                    <button disabled className="btn-secondary" style={{ opacity: 0.6, fontSize: '0.85rem' }}>
                      Full
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoin(g.id)}
                      className="btn-primary"
                      style={{ fontSize: '0.85rem' }}
                    >
                      Join (+5 pts)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
