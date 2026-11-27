import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';

export default function PublicProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/users/${id}`)
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="container" style={{ padding: '3rem 1rem', textAlign: 'center' }}>Loading profile...</div>;
  }

  if (!data) {
    return (
      <div className="container" style={{ padding: '2rem 1rem' }}>
        <div className="alert-error">Profile not found.</div>
      </div>
    );
  }

  const { user, badges } = data;

  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
      <div className="profile-card">
        <div className="profile-header">
          <div className="avatar-circle">
            {user.avatar_data ? <img src={user.avatar_data} alt="" /> : user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2>{user.name}</h2>
            <p className="profile-meta">
              {user.faculty || 'Campus Student'} {user.major ? `• ${user.major}` : ''}
            </p>
          </div>
        </div>

        <div className="stats-grid" style={{ marginTop: '1.5rem' }}>
          <div className="stat-card">
            <span className="stat-label">Total Points</span>
            <span className="stat-val">⭐ {user.total_points}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Campus Leaderboard Rank</span>
            <span className="stat-val">#{user.rank > 0 ? user.rank : '-'}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Verified Badges</span>
            <span className="stat-val">🏅 {badges.length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Study Group Diikuti</span>
            <span className="stat-val">{user.groups_joined_count ?? 0}</span>
          </div>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <h3>Earned Badges</h3>
          {badges.length === 0 ? (
            <p className="empty-state">No approved badges yet.</p>
          ) : (
            <div className="badges-grid" style={{ marginTop: '1rem' }}>
              {badges.map((badge) => (
                <div key={badge.id} className="badge-item">
                  <span style={{ fontSize: '1.75rem' }}>🏅</span>
                  <div>
                    <strong>{badge.name}</strong>
                    <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Link to="/leaderboard" className="btn-secondary" style={{ display: 'inline-block', marginTop: '1.5rem' }}>
          Back to leaderboard
        </Link>
      </div>
    </div>
  );
}
