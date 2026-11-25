import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import api from '../api';

export default function CommunityRoom() {
  const { id } = useParams();
  const { user, refreshProfile } = useAuth();

  const [community, setCommunity] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [messages, setMessages] = useState([]);
  const [myRole, setMyRole] = useState('member');
  const [inputText, setInputText] = useState('');
  const [directorySearch, setDirectorySearch] = useState('');
  const [isBroadcast, setIsBroadcast] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [directoryError, setDirectoryError] = useState('');
  const [toast, setToast] = useState('');

  const messagesEndRef = useRef(null);
  const messageRequestRef = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const loadMessages = async () => {
    const requestId = ++messageRequestRef.current;
    setLoading(true);
    setLoadError('');
    try {
      const res = await api.get(`/communities/${id}/messages`);
      if (requestId !== messageRequestRef.current) return;
      setCommunity(res.data.community);
      setMessages(res.data.messages);
      setMyRole(res.data.myRole);
    } catch (err) {
      if (requestId !== messageRequestRef.current) return;
      console.error('Failed to load community messages:', err);
      setLoadError(err.response?.data?.error || 'Pesan komunitas belum dapat dimuat.');
    } finally {
      if (requestId === messageRequestRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    setCommunity(null);
    setMessages([]);
    loadMessages();
    return () => {
      messageRequestRef.current += 1;
    };
  }, [id]);

  useEffect(() => {
    let active = true;
    api.get('/communities')
      .then((res) => {
        if (active) setCommunities(res.data);
      })
      .catch((err) => {
        console.error('Failed to load community directory:', err);
        if (active) setDirectoryError('Daftar komunitas belum dapat dimuat.');
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const filteredCommunities = useMemo(() => {
    const query = directorySearch.trim().toLowerCase();
    if (!query) return communities;
    return communities.filter((item) => (
      [item.name, item.category, item.org_name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    ));
  }, [communities, directorySearch]);
  const communityDirectoryItem = communities.find((item) => String(item.id) === String(id));
  const latestBroadcast = [...messages].reverse().find((message) => message.is_broadcast);
  const latestMessages = messages.slice(-3).reverse();

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || submitting) return;

    const content = inputText.trim();
    setInputText('');

    const optimisticMsg = {
      id: Date.now(),
      user_id: user.id,
      author_name: user.name,
      content,
      is_broadcast: isBroadcast,
      is_auto_reply: false,
      created_at: new Date()
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setSubmitting(true);

    try {
      if (!isBroadcast) setIsTyping(true);
      const res = await api.post(`/communities/${id}/messages`, { content, isBroadcast });

      if (res.data.points?.awarded > 0) {
        showToast(`+${res.data.points.awarded} XP`);
        refreshProfile();
      }

      setIsBroadcast(false);
      if (res.data.reply) {
        setTimeout(() => {
          setIsTyping(false);
          setMessages((prev) => [...prev, res.data.reply]);
        }, 800);
      } else {
        setIsTyping(false);
      }
    } catch (err) {
      setIsTyping(false);
      showToast(err.response?.data?.error || 'Pesan gagal dikirim.');
      loadMessages();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !community) {
    return <main className="container community-workspace-page"><div className="empty-state">Menghubungkan ke Chat Hub...</div></main>;
  }

  if (loadError && !community) {
    return (
      <main className="container community-workspace-page">
        <div className="empty-state">
          <h2>Komunitas tidak dapat dibuka</h2>
          <p>{loadError}</p>
          <Link to="/communities" className="btn-secondary">Kembali ke komunitas</Link>
        </div>
      </main>
    );
  }

  if (!community) return null;

  return (
    <main className="container community-workspace-page">
      {toast && <div className="toast-pill">{toast}</div>}

      <header className="community-workspace-toolbar">
        <div className="community-workspace-title">
          <span className="community-title-mark" aria-hidden="true">#</span>
          <div>
            <span className="eyebrow">Community Chat Hub</span>
            <h1>Ruang diskusi kampus</h1>
          </div>
          <span className="community-prototype-status">Sinkronisasi manual</span>
        </div>
        <Link to="/communities" className="btn-secondary">＋ Buat / gabung channel</Link>
      </header>

      <div className="community-workspace-grid">
        <aside className="community-channel-sidebar">
          <div className="community-current-card">
            <span className="community-current-avatar">{community.name.charAt(0).toUpperCase()}</span>
            <div>
              <strong>{community.name}</strong>
              <span>{community.org_name || communityDirectoryItem?.category || 'Komunitas kampus'}</span>
            </div>
          </div>
          <Link to="/communities" className="community-create-link">＋ Jelajahi komunitas</Link>
          <label className="community-directory-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Cari komunitas..."
              value={directorySearch}
              onChange={(event) => setDirectorySearch(event.target.value)}
            />
          </label>
          <div className="community-channel-heading">
            <span>Komunitas</span>
            <span>{communities.length}</span>
          </div>
          {directoryError ? (
            <p className="community-directory-error">{directoryError}</p>
          ) : (
            <nav className="community-directory" aria-label="Daftar komunitas">
              {filteredCommunities.map((item) => (
                <Link
                  to={`/communities/${item.id}`}
                  key={item.id}
                  className={`community-directory-item ${String(item.id) === String(id) ? 'active' : ''}`}
                >
                  <span aria-hidden="true">#</span>
                  <span>{item.name}</span>
                  {item.is_member && <small>{item.member_count}</small>}
                </Link>
              ))}
              {filteredCommunities.length === 0 && <p className="community-directory-empty">Tidak ada komunitas yang cocok.</p>}
            </nav>
          )}
          <div className="community-sidebar-note">
            <strong>Prototype chat</strong>
            <p>Balasan otomatis menggunakan aturan sederhana, bukan sinkronisasi realtime.</p>
          </div>
        </aside>

        <section className="community-main-panel">
          <header className="community-room-header">
            <div>
              <div className="community-room-name-row">
                <span aria-hidden="true">#</span>
                <h2>{community.name}</h2>
                {community.org_status === 'verified' && <span className="community-verified">Terverifikasi</span>}
              </div>
              <p>{community.description || 'Ruang diskusi komunitas kampus.'}</p>
            </div>
            <Link to="/communities" aria-label="Kembali ke semua komunitas" className="community-back-link">Semua komunitas</Link>
          </header>

          {latestBroadcast && (
            <div className="community-announcement">
              <span aria-hidden="true">📢</span>
              <div>
                <strong>Pengumuman terbaru · {latestBroadcast.author_name}</strong>
                <p>{latestBroadcast.content}</p>
              </div>
            </div>
          )}

          {loadError && <p className="community-inline-error">{loadError}</p>}
          <div className="community-messages">
            {messages.map((message) => {
              const isMe = message.user_id === user.id && !message.is_auto_reply;
              return (
                <article
                  key={message.id}
                  className={`community-message-row ${isMe ? 'is-mine' : ''} ${message.is_broadcast ? 'is-broadcast' : ''}`}
                >
                  {!isMe && <span className="community-message-avatar">{message.author_name?.charAt(0).toUpperCase() || '?'}</span>}
                  <div className="community-message-content">
                    <div className="community-message-meta">
                      <strong>{isMe ? 'Kamu' : message.author_name}</strong>
                      {message.is_broadcast && <span>Pengumuman</span>}
                      {message.is_auto_reply && <span>Bot</span>}
                      <time>{new Date(message.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</time>
                    </div>
                    <p>{message.content}</p>
                  </div>
                </article>
              );
            })}

            {messages.length === 0 && !loading && <p className="community-messages-empty">Belum ada percakapan. Mulai diskusi di bawah.</p>}
            {isTyping && <div className="community-typing">Kolaborin Bot sedang menyiapkan balasan…</div>}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="community-message-form">
            {myRole === 'admin' && (
              <label className="community-broadcast-toggle">
                <input
                  type="checkbox"
                  checked={isBroadcast}
                  onChange={(event) => setIsBroadcast(event.target.checked)}
                />
                Pengumuman
              </label>
            )}
            <div className="community-message-input-row">
              <input
                type="text"
                required
                maxLength={500}
                placeholder={isBroadcast ? 'Tulis pengumuman...' : 'Kirim pesan ke komunitas...'}
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
              />
              <button type="submit" disabled={submitting || !inputText.trim()} className="btn-primary">
                {submitting ? 'Mengirim...' : 'Kirim'}
              </button>
            </div>
            <small>Enter untuk mengirim · Maksimal 500 karakter</small>
          </form>
        </section>

        <aside className="community-info-sidebar">
          <section className="community-info-card">
            <div className="community-info-heading">
              <span className="eyebrow">Tentang komunitas</span>
              {community.org_status === 'verified' && <span className="community-verified">✓ Terverifikasi</span>}
            </div>
            <h3>{community.name}</h3>
            {community.org_name && <p className="community-org-name">{community.org_name}</p>}
            <p>{community.description || 'Belum ada deskripsi komunitas.'}</p>
            <div className="community-info-stats">
              <span><strong>{communityDirectoryItem?.member_count ?? '—'}</strong> Anggota</span>
              <span><strong>{communityDirectoryItem?.category || 'Umum'}</strong> Kategori</span>
            </div>
          </section>

          <section className="community-info-card">
            <div className="community-info-heading">
              <span className="eyebrow">Aktivitas terbaru</span>
              <span>{messages.length}</span>
            </div>
            {latestMessages.length ? (
              <div className="community-recent-list">
                {latestMessages.map((message) => (
                  <div className="community-recent-item" key={message.id}>
                    <strong>{message.author_name}</strong>
                    <p>{message.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="community-directory-empty">Pesan terbaru akan muncul di sini.</p>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
