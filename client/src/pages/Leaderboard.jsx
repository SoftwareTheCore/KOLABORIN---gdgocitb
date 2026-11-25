import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import api from '../api';

const medals = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    api.get('/leaderboard')
      .then((res) => {
        setLeaderboard(res.data.leaderboard);
        setMyRank(res.data.me);
      })
      .catch((err) => {
        console.error('Failed to load leaderboard:', err);
        setLoadError('Peringkat belum dapat dimuat. Coba muat ulang halaman.');
      })
      .finally(() => setLoading(false));
  }, []);

  const podium = leaderboard.slice(0, 3);
  const remainingStudents = leaderboard.slice(3);

  return (
    <main className="container leaderboard-page">
      <section className="leaderboard-hero">
        <div className="leaderboard-hero-top">
          <span className="leaderboard-season"><span aria-hidden="true">●</span> Hall of Fame &amp; Merit Kampus</span>
          <span className="leaderboard-scope">ITB · Peringkat berdasarkan XP</span>
        </div>
        <div className="leaderboard-title-row">
          <div>
            <span className="eyebrow">Kolaborasi yang berdampak</span>
            <h1>Papan Peringkat Kolaborator</h1>
            <p>Apresiasi untuk kontribusi belajar bersama, diskusi, dan aktivitas kampus.</p>
          </div>
          <Link to="/party" className="btn-primary">Raih XP lewat Open Party <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      {myRank && (
        <section className="leaderboard-my-rank">
          <div className="leaderboard-avatar">{myRank.name?.charAt(0).toUpperCase() || '?'}</div>
          <div className="leaderboard-my-rank-info">
            <span>Peringkatmu saat ini</span>
            <strong>{myRank.name} {myRank.user_id === user?.id && <small>ANDA</small>}</strong>
            <span>{myRank.faculty || 'Mahasiswa ITB'} · #{myRank.rank_no}</span>
          </div>
          <div className="leaderboard-my-xp">
            <span>Total XP</span>
            <strong>⭐ {myRank.total_points}</strong>
          </div>
        </section>
      )}

      {loadError ? (
        <div className="empty-state">{loadError}</div>
      ) : loading ? (
        <div className="empty-state">Memuat peringkat...</div>
      ) : leaderboard.length === 0 ? (
        <div className="empty-state">Belum ada data peringkat untuk ditampilkan.</div>
      ) : (
        <>
          <section className="leaderboard-podium-section">
            <div className="leaderboard-section-title">
              <div>
                <span className="eyebrow">Mahasiswa teraktif</span>
                <h2>Top Kolaborator</h2>
              </div>
              <span>{leaderboard.length} peserta</span>
            </div>
            <div className="leaderboard-podium">
              {podium.map((student, index) => (
                <article className={`podium-card podium-${index + 1}`} key={student.user_id}>
                  <span className="podium-medal" aria-hidden="true">{medals[index]}</span>
                  <div className="leaderboard-avatar podium-avatar">{student.name?.charAt(0).toUpperCase() || '?'}</div>
                  <span className="podium-rank">#{student.rank_no}</span>
                  <h3>{student.name}</h3>
                  <p>{student.faculty || 'Mahasiswa ITB'}</p>
                  <strong className="podium-points">⭐ {student.total_points} XP</strong>
                  {student.user_id === user?.id && <span className="podium-you">Peringkatmu</span>}
                </article>
              ))}
            </div>
          </section>

          <div className="leaderboard-lower-grid">
            <section className="leaderboard-table-card">
              <div className="leaderboard-section-title">
                <div>
                  <span className="eyebrow">Papan peringkat</span>
                  <h2>Kontributor lainnya</h2>
                </div>
              </div>
              {remainingStudents.length === 0 ? (
                <p className="empty-state compact-empty">Top 3 saat ini adalah seluruh peserta yang tersedia.</p>
              ) : (
                <div className="leaderboard-list">
                  {remainingStudents.map((student) => {
                    const isCurrentUser = student.user_id === user?.id;
                    return (
                      <div
                        key={student.user_id}
                        className={`leaderboard-item ${isCurrentUser ? 'leaderboard-item-me' : ''}`}
                      >
                        <div className="leaderboard-row-person">
                          <span className="leaderboard-row-rank">#{student.rank_no}</span>
                          <div>
                            <strong>{student.name} {isCurrentUser && <small>ANDA</small>}</strong>
                            <span>{student.faculty || 'Mahasiswa ITB'}</span>
                          </div>
                        </div>
                        <strong className="points-display">⭐ {student.total_points} XP</strong>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <aside className="leaderboard-guide">
              <span className="leaderboard-guide-icon" aria-hidden="true">✦</span>
              <span className="eyebrow">Kolaborin XP</span>
              <h2>Kontribusi konsisten, dampak nyata.</h2>
              <p>XP mencerminkan aktivitas yang tercatat di platform, termasuk bergabung dalam study group dan berbagi jawaban yang membantu.</p>
              <Link to="/profile">Lihat progres &amp; lencana →</Link>
            </aside>
          </div>
        </>
      )}
    </main>
  );
}
