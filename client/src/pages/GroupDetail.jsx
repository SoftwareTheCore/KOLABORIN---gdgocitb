import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import api from '../api';
import StudyRoomSidebar from '../components/StudyRoomSidebar';
import StudyRoomWorkspace from '../components/StudyRoomWorkspace';

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();

  const [data, setData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Q&A / Posting state
  const [postType, setPostType] = useState('question'); // question, answer, note
  const [content, setContent] = useState('');
  const [replyToParentId, setReplyToParentId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4500);
  };

  const loadGroupAndPosts = async () => {
    try {
      const [resGroup, resPosts] = await Promise.all([
        api.get(`/groups/${id}`),
        api.get(`/groups/${id}/posts`)
      ]);
      setData(resGroup.data);
      setPosts(resPosts.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load group');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroupAndPosts();
  }, [id]);

  const handleJoin = async () => {
    try {
      const res = await api.post(`/groups/${id}/join`);
      showToast(res.data.points?.awarded > 0 ? `+${res.data.points.awarded} points earned! 🎉` : 'Joined group successfully!');
      refreshProfile();
      loadGroupAndPosts();
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not join group');
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Are you sure you want to leave this study group?')) return;
    try {
      await api.delete(`/groups/${id}/join`);
      showToast('You have left the group.');
      refreshProfile();
      loadGroupAndPosts();
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not leave group');
    }
  };

  const handleClose = async () => {
    if (!window.confirm('Close this group? It will no longer accept new members or appear on the map.')) return;
    try {
      await api.patch(`/groups/${id}`, { status: 'closed' });
      showToast('Group has been closed.');
      loadGroupAndPosts();
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not close group');
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const res = await api.post(`/groups/${id}/posts`, {
        type: postType,
        content: content.trim(),
        parent_id: replyToParentId
      });

      let message = 'Posted successfully!';
      if (res.data.points?.awarded > 0) {
        message = `+${res.data.points.awarded} points earned! 🎉`;
      } else if (res.data.points?.capped) {
        message = 'Daily limit reached for answer points.';
      }

      if (res.data.badgeRequested) {
        message += ` 🏅 You qualified for "${res.data.badgeName || 'Expert'}" badge! Pending moderator approval.`;
      }

      showToast(message);
      setContent('');
      setReplyToParentId(null);
      setPostType('question');
      refreshProfile();
      // Reload posts
      const pRes = await api.get(`/groups/${id}/posts`);
      setPosts(pRes.data);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to submit post');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="container" style={{ padding: '3rem 1rem', textAlign: 'center' }}>Loading study space...</div>;
  }

  if (error || !data) {
    return <div className="container" style={{ padding: '2rem 1rem' }}><div className="alert-error">{error}</div></div>;
  }

  const { group, members, isMember, isCreator } = data;

  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: '1400px', margin: '0 auto' }}>
      {toast && <div className="toast-pill">{toast}</div>}

      {/* Group Header Card */}
      <div className="group-detail-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span className="tag-subject">{group.subject}</span>
              <span className={`status-badge status-${group.status === 'open' ? 'verified' : 'pending'}`}>
                {group.status.toUpperCase()}
              </span>
            </div>
            <h2>{group.title}</h2>
            <p style={{ color: 'var(--muted)', marginTop: '0.25rem' }}>
              📍 <strong>{group.location_name}</strong> {group.location_address ? `(${group.location_address})` : ''} •{' '}
              🕒 {new Date(group.scheduled_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {isMember ? (
              <>
                <span style={{ display: 'flex', alignItems: 'center', color: 'var(--ok)', fontWeight: 600, fontSize: '0.9rem' }}>
                  ✓ You are a member
                </span>
                {!isCreator && (
                  <button onClick={handleLeave} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
                    Leave Group
                  </button>
                )}
                {isCreator && group.status !== 'closed' && (
                  <button onClick={handleClose} className="btn-secondary" style={{ fontSize: '0.85rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                    Close Group
                  </button>
                )}
              </>
            ) : group.status === 'full' ? (
              <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Group is Full</span>
            ) : group.status === 'closed' ? (
              <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Group Closed</span>
            ) : (
              <button onClick={handleJoin} className="btn-primary">
                Join Group (+5 pts)
              </button>
            )}
          </div>
        </div>

        {group.description && (
          <p style={{ marginTop: '1rem', fontSize: '0.95rem', lineHeight: 1.5, background: 'var(--bg)', padding: '0.75rem', borderRadius: 'var(--radius-btn)' }}>
            {group.description}
          </p>
        )}
      </div>

      {/* Study room: discussions and the group desk */}
      <div className="group-detail-grid" style={{ marginTop: '1.5rem' }}>
        {/* Left Column: Discussion & Q&A */}
        <div>
          <div className="dash-card">
            <h3>💬 Group Discussion & Q&A</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.2rem', marginBottom: '1rem' }}>
              Post questions and provide helpful answers to earn +10 points & expert badges.
            </p>

            {/* Posting Box (Members only) */}
            {isMember ? (
              <form onSubmit={handlePostSubmit} style={{ background: 'var(--bg)', padding: '1rem', borderRadius: 'var(--radius-btn)', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {!replyToParentId ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setPostType('question')}
                          className={postType === 'question' ? 'btn-primary' : 'btn-secondary'}
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                        >
                          ❓ Question
                        </button>
                        <button
                          type="button"
                          onClick={() => setPostType('note')}
                          className={postType === 'note' ? 'btn-primary' : 'btn-secondary'}
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                        >
                          📝 Note
                        </button>
                      </>
                    ) : (
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>
                        💬 Replying as Answer (+10 pts)
                      </span>
                    )}
                  </div>

                  {replyToParentId && (
                    <button
                      type="button"
                      onClick={() => { setReplyToParentId(null); setPostType('question'); }}
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      Cancel reply
                    </button>
                  )}
                </div>

                <textarea
                  required
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={
                    replyToParentId
                      ? 'Write your detailed answer (min 10 chars to earn points)...'
                      : postType === 'question'
                      ? 'Ask a question for your study group...'
                      : 'Share a note or study resource...'
                  }
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: 'var(--radius-btn)',
                    border: '1px solid var(--border)',
                    background: 'var(--card)',
                    color: 'var(--text)',
                    fontFamily: 'inherit'
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="submit" disabled={submitting} className="btn-primary" style={{ fontSize: '0.85rem' }}>
                    {submitting ? 'Posting...' : replyToParentId ? 'Submit Answer (+10 pts)' : 'Post to Space'}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ padding: '1rem', background: 'var(--bg)', borderRadius: 'var(--radius-btn)', textAlign: 'center', marginBottom: '1.5rem', color: 'var(--muted)' }}>
                🔒 Join this study group to ask questions and share answers.
              </div>
            )}

            {/* Q&A Thread List */}
            {posts.length === 0 ? (
              <p className="empty-state">No discussions yet. Be the first to ask a question!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {posts.map((post) => (
                  <div key={post.id} className="post-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <strong>{post.author_name}</strong>
                        {post.author_badges && (
                          <span title={post.author_badges} style={{ fontSize: '0.9rem' }}>🏅</span>
                        )}
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                          • {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className={`post-type-tag type-${post.type}`}>
                        {post.type.toUpperCase()}
                      </span>
                    </div>

                    <p style={{ marginTop: '0.4rem', fontSize: '0.95rem', lineHeight: 1.4 }}>
                      {post.content}
                    </p>

                    {/* Reply button for questions */}
                    {isMember && post.type === 'question' && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <button
                          onClick={() => {
                            setReplyToParentId(post.id);
                            setPostType('answer');
                          }}
                          style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                          ✍️ Answer this question (+10 pts)
                        </button>
                      </div>
                    )}

                    {/* Nested Answers */}
                    {post.answers && post.answers.length > 0 && (
                      <div className="nested-answers" style={{ marginTop: '0.75rem', paddingLeft: '1rem', borderLeft: '2px solid var(--primary-soft)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {post.answers.map((ans) => (
                          <div key={ans.id} style={{ background: 'var(--bg)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-btn)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                              <strong>{ans.author_name}</strong>
                              {ans.author_badges && <span title={ans.author_badges}>🏅</span>}
                              <span style={{ fontSize: '0.75rem', color: 'var(--ok)', fontWeight: 600 }}>Answer</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                                • {new Date(ans.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p style={{ marginTop: '0.25rem', fontSize: '0.9rem' }}>{ans.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <StudyRoomWorkspace />
        <StudyRoomSidebar group={group} members={members} />
      </div>
    </div>
  );
}
