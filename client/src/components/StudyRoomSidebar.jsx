import React, { useEffect, useRef, useState } from 'react';

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;
const TIMER_CIRCUMFERENCE = 2 * Math.PI * 52;

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
}

function PomodoroTimer() {
  const [mode, setMode] = useState('focus');
  const [remainingSeconds, setRemainingSeconds] = useState(FOCUS_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const deadline = useRef(null);
  const duration = mode === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS;
  const progress = Math.min(1, Math.max(0, 1 - remainingSeconds / duration));

  useEffect(() => {
    if (!isRunning) return undefined;

    const tick = () => {
      const secondsLeft = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setRemainingSeconds(secondsLeft);

      if (secondsLeft === 0) {
        setIsRunning(false);
        if (mode === 'focus') setCompletedSessions((count) => count + 1);
        const nextMode = mode === 'focus' ? 'break' : 'focus';
        setMode(nextMode);
        setRemainingSeconds(nextMode === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS);
      }
    };

    deadline.current = Date.now() + remainingSeconds * 1000;
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const toggleTimer = () => {
    if (isRunning) {
      const secondsLeft = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setRemainingSeconds(secondsLeft);
      setIsRunning(false);
      return;
    }

    if (remainingSeconds === 0) {
      setRemainingSeconds(duration);
    }
    setIsRunning(true);
  };

  const addFiveMinutes = () => {
    setRemainingSeconds((seconds) => seconds + 5 * 60);
    if (isRunning) deadline.current += 5 * 60 * 1000;
  };

  const skipInterval = () => {
    const nextMode = mode === 'focus' ? 'break' : 'focus';
    setIsRunning(false);
    setMode(nextMode);
    setRemainingSeconds(nextMode === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS);
  };

  return (
    <section className="study-room-card pomodoro-card" aria-label="Pomodoro timer">
      <div className="study-room-card-heading">
        <h3>⏱ Pomodoro Sinergi</h3>
        <span className="study-room-pill">Sesi #{(completedSessions % 4) + 1}/4</span>
      </div>

      <div className="pomodoro-dial" aria-live="polite">
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle className="pomodoro-track" cx="60" cy="60" r="52" />
          <circle
            className="pomodoro-progress"
            cx="60"
            cy="60"
            r="52"
            strokeDasharray={TIMER_CIRCUMFERENCE}
            strokeDashoffset={TIMER_CIRCUMFERENCE * (1 - progress)}
          />
        </svg>
        <div className="pomodoro-time">
          <strong>{formatTime(remainingSeconds)}</strong>
          <span>{mode === 'focus' ? 'Fokus penuh' : 'Waktu istirahat'}</span>
        </div>
      </div>

      <p className="pomodoro-local-note">
        Timer berjalan di perangkat ini dan belum tersinkronisasi dengan anggota lain.
      </p>

      <div className="pomodoro-actions">
        <button type="button" className="btn-primary" onClick={toggleTimer}>
          {isRunning ? 'Pause' : 'Mulai'}
        </button>
        <button type="button" className="btn-secondary" onClick={addFiveMinutes} aria-label="Tambah lima menit">
          +5 m
        </button>
        <button type="button" className="btn-secondary" onClick={skipInterval}>
          {mode === 'focus' ? 'Istirahat' : 'Fokus berikutnya'}
        </button>
      </div>
    </section>
  );
}

export default function StudyRoomSidebar({ group, members }) {
  const maxMembers = Number(group.max_members) || members.length;
  const emptySeats = Math.max(0, maxMembers - members.length);

  return (
    <aside className="study-room-sidebar">
      <section className="study-room-card">
        <div className="study-room-card-heading">
          <h3>👥 Virtual Desk</h3>
          <span className="study-room-pill">{members.length}/{maxMembers}</span>
        </div>

        <div className="study-room-seats">
          {members.map((member) => {
            const isHost = member.user_id === group.creator_id;
            const initials = member.name
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part.charAt(0))
              .join('')
              .toUpperCase();

            return (
              <div className="study-room-seat" key={member.user_id}>
                <div className="study-room-avatar" aria-hidden="true">{initials}</div>
                <strong title={member.name}>
                  {member.name} {member.badges && <span title={`Badge: ${member.badges}`}>🏅</span>}
                </strong>
                <span>{isHost ? 'Host' : [member.faculty, member.major].filter(Boolean).join(' • ') || 'Anggota'}</span>
              </div>
            );
          })}
          {Array.from({ length: emptySeats }, (_, index) => (
            <div className="study-room-seat study-room-empty-seat" key={`empty-${index}`}>
              <span aria-hidden="true">＋</span>
              <strong>Kursi kosong</strong>
              <span>Menunggu anggota</span>
            </div>
          ))}
        </div>

        <div className="study-room-member-summary">
          <span>Anggota meja</span>
          <strong>{members.length} dari {maxMembers} kursi terisi</strong>
        </div>
      </section>

      <PomodoroTimer />
    </aside>
  );
}
