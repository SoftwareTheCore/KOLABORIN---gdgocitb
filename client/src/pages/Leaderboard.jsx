import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import api from '../api';

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/leaderboard')
      .then(res => {
        setLeaderboard(res.data.leaderboard);
        setMyRank(res.data.me);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h2>🏆 Campus Leaderboard</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
          Fair recognition based on study group participation, Q&A answers, and verified event attendance.
        </p>
      </div>

      {/* Current User Highlight Card */}
      {myRank && (
        <div className="my-rank-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="rank-badge-circle">
              #{myRank.rank_no}
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Your Current Standing
              </span>
              <h3 style={{ fontSize: '1.25rem' }}>{myRank.name}</h3>
              <p style={{ fontSize: '0.85rem', opacity: 0.9 }}>{myRank.faculty || 'Campus Student'}</p>
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            ⭐ {myRank.total_points} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>pts</span>
          </div>
        </div>
      )}

      {/* Leaderboard Table List */}
      <div className="dash-card" style={{ marginTop: '1.5rem' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem 0' }}>Loading rankings...</p>
        ) : (
          <div className="leaderboard-list">
            {leaderboard.map((student) => {
              const isCurrentUser = student.user_id === user?.id;
              const isTop1 = student.rank_no === 1;
              const isTop2 = student.rank_no === 2;
              const isTop3 = student.rank_no === 3;

              return (
                <div
                  key={student.user_id}
                  className={`leaderboard-item ${isCurrentUser ? 'leaderboard-item-me' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span className={`rank-position-tag ${isTop1 ? 'pos-1' : isTop2 ? 'pos-2' : isTop3 ? 'pos-3' : ''}`}>
                      {isTop1 ? '🥇' : isTop2 ? '🥈' : isTop3 ? '🥉' : `#${student.rank_no}`}
                    </span>
                    <div>
                      <strong style={{ fontSize: '0.95rem' }}>
                        {student.name} {isCurrentUser && <span style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>(You)</span>}
                      </strong>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)' }}>
                        {student.faculty}
                      </span>
                    </div>
                  </div>

                  <span className="points-display">
                    ⭐ {student.total_points} pts
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
        💡 <em>Points reset daily limits automatically at local midnight (+07:00). Maximize your points by answering questions in Open Party!</em>
      </div>
    </div>
  );
}
