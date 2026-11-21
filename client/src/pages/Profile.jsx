import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import api from '../api';

export default function Profile() {
  const { user, extra, refreshProfile } = useAuth();
  const [allBadges, setAllBadges] = useState([]);

  useEffect(() => {
    refreshProfile();
    if (user && user.role === 'student') {
      api.get('/badges/mine')
        .then((response) => setAllBadges(response.data))
        .catch(console.error);
    }
  }, [user]);

  if (!user) {
    return null;
  }

  const isStudent = user.role === 'student';
  const accountLabel = user.role === 'admin' ? 'Administrator' : 'Organization';

  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
      <div className="profile-card">
        <div className="profile-header">
          <div className="avatar-circle">{user.name.charAt(0).toUpperCase()}</div>
          <div>
            <h2>{user.name}</h2>
            <p className="profile-meta">
              {user.faculty || 'Campus Account'} {user.major ? `• ${user.major}` : ''}
            </p>
            <span className="badge-pill role-pill">{user.role.toUpperCase()}</span>
          </div>
        </div>

        {!isStudent && (
          <div className="stat-card" style={{ marginTop: '1.5rem' }}>
            <span className="stat-label">Account Type</span>
            <span className="stat-val">{accountLabel}</span>
          </div>
        )}

        {isStudent && (
          <>
            <div className="stats-grid" style={{ marginTop: '1.5rem' }}>
              <div className="stat-card">
                <span className="stat-label">Total Points</span>
                <span className="stat-val">⭐ {user.total_points}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Campus Leaderboard Rank</span>
                <span className="stat-val">#{extra.rank > 0 ? extra.rank : '-'}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Verified Badges</span>
                <span className="stat-val">🏅 {extra.badges.length}</span>
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <h3>Today's Daily Point Limits (Asia/Jakarta)</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.2rem', marginBottom: '0.75rem' }}>
                Daily limits protect fair gamification and prevent abuse. Resets at midnight.
              </p>
              <div className="caps-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Object.entries(extra.todayCaps).map(([action, info]) => {
                  const percent = Math.min(100, (info.earned / info.cap) * 100);
                  const isCapped = info.remaining <= 0;

                  return (
                    <div key={action} className="cap-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                          {action.replace('_', ' ')}
                          {isCapped && (
                            <span style={{ marginLeft: '0.5rem', color: 'var(--danger)', fontSize: '0.75rem' }}>
                              • Limit Reached
                            </span>
                          )}
                        </span>
                        <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                          {info.earned} / {info.cap} pts ({info.remaining} pts remaining)
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: isCapped ? 'var(--ok)' : 'var(--accent)'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: '2.5rem' }}>
              <h3>Recognitions & Badges</h3>
              {allBadges.length === 0 ? (
                <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>
                  No badge activity yet. Answer 5 questions in a subject study group to qualify for your first expertise badge!
                </p>
              ) : (
                <div className="badges-grid" style={{ marginTop: '1rem' }}>
                  {allBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className="badge-item"
                      style={{
                        borderLeft: `4px solid ${badge.status === 'approved' ? 'var(--ok)' : '#f59e0b'}`
                      }}
                    >
                      <span style={{ fontSize: '1.75rem' }}>🏅</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong>{badge.name}</strong>
                          <span
                            className={`status-badge status-${badge.status === 'approved' ? 'verified' : 'pending'}`}
                            style={{ fontSize: '0.7rem' }}
                          >
                            {badge.status.toUpperCase()}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                          {badge.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
