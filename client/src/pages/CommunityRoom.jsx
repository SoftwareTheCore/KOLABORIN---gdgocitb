import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import api from '../api';

export default function CommunityRoom() {
  const { id } = useParams();
  const { user, refreshProfile } = useAuth();

  const [community, setCommunity] = useState(null);
  const [messages, setMessages] = useState([]);
  const [myRole, setMyRole] = useState('member');
  const [inputText, setInputText] = useState('');
  const [isBroadcast, setIsBroadcast] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const loadMessages = async () => {
    try {
      const res = await api.get(`/communities/${id}/messages`);
      setCommunity(res.data.community);
      setMessages(res.data.messages);
      setMyRole(res.data.myRole);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || submitting) return;

    const content = inputText.trim();
    setInputText('');

    // Optimistic user message insertion
    const tempId = Date.now();
    const optimisticMsg = {
      id: tempId,
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
      // If it's a regular message, show typing indicator before auto-reply
      if (!isBroadcast) {
        setIsTyping(true);
      }

      const res = await api.post(`/communities/${id}/messages`, {
        content,
        isBroadcast
      });

      // Show points notification
      if (res.data.points?.awarded > 0) {
        showToast(`+${res.data.points.awarded} point earned!`);
        refreshProfile();
      }

      setIsBroadcast(false);

      // Typing simulation delay (600 to 900ms) for auto-reply as specified in FR-COM-3
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
      showToast(err.response?.data?.error || 'Failed to send message');
      loadMessages();
    } finally {
      setSubmitting(false);
    }
  };

  if (!community) {
    return <div className="container" style={{ padding: '3rem 1rem', textAlign: 'center' }}>Connecting to community hub...</div>;
  }

  return (
    <div className="container" style={{ padding: '1.5rem 1rem', maxWidth: '850px', margin: '0 auto' }}>
      {toast && <div className="toast-pill">{toast}</div>}

      {/* Community Header */}
      <div className="group-detail-header" style={{ padding: '1rem 1.25rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem' }}>💬 {community.name}</h2>
              {community.org_name && (
                <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                  (🏛️ {community.org_name})
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
              {community.description || 'Campus community chat space'}
            </p>
          </div>
          <Link to="/communities" className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
            ← All Hubs
          </Link>
        </div>
      </div>

      {/* Chat Messages Box */}
      <div className="chat-container">
        <div className="chat-messages-scroll">
          {messages.map((m) => {
            const isMe = m.user_id === user.id && !m.is_auto_reply;
            return (
              <div
                key={m.id}
                className={`chat-bubble-row ${isMe ? 'chat-row-me' : 'chat-row-other'} ${m.is_broadcast ? 'chat-row-broadcast' : ''}`}
              >
                <div className={`chat-bubble ${isMe ? 'bubble-me' : m.is_broadcast ? 'bubble-broadcast' : 'bubble-other'}`}>
                  {/* Author Header */}
                  <div className="bubble-author">
                    <span>{m.author_name}</span>
                    {m.is_broadcast && <span className="broadcast-pill">📢 ANNOUNCEMENT</span>}
                    {m.is_auto_reply && <span className="auto-reply-pill">🤖 AUTO-REPLY</span>}
                  </div>

                  {/* Content */}
                  <div className="bubble-content">{m.content}</div>

                  {/* Timestamp */}
                  <div className="bubble-time">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="chat-bubble-row chat-row-other">
              <div className="bubble-other typing-bubble">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="chat-input-bar">
          {myRole === 'admin' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0 0.5rem' }}>
              <input
                type="checkbox"
                id="broadcastCheck"
                checked={isBroadcast}
                onChange={(e) => setIsBroadcast(e.target.checked)}
              />
              <label htmlFor="broadcastCheck" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)', cursor: 'pointer' }}>
                📢 Broadcast
              </label>
            </div>
          )}

          <input
            type="text"
            required
            maxLength={500}
            placeholder={isBroadcast ? 'Type an announcement (no auto-reply)...' : 'Ask about events, study groups, places, or points...'}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="chat-text-input"
          />

          <button type="submit" disabled={submitting || !inputText.trim()} className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
            Send
          </button>
        </form>

        <div className="chat-footer-note">
          Prototype chat: replies are automatic rule-based assistant responses.
        </div>
      </div>
    </div>
  );
}
