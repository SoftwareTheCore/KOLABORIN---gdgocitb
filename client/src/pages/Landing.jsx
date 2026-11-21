import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

export default function Landing() {
  return (
    <main className="landing-page">
      <nav className="landing-nav" aria-label="Primary navigation">
        <Link to="/" className="landing-brand" aria-label="KOLABORIN home">
          <Logo height={64} />
        </Link>
        <div className="landing-nav-actions">
          <Link to="/login" className="btn-secondary">Log In</Link>
          <Link to="/register" className="btn-primary">Create Account</Link>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <span className="landing-kicker">Campus collaboration platform</span>
          <h1>More connections.<br />More collaboration.</h1>
          <p>Find study groups, verified organizations, events, and active campus places from one live map.</p>
          <div className="landing-actions">
            <Link to="/register" className="btn-primary">Join as Student</Link>
            <Link to="/login" className="btn-secondary">Sign In</Link>
          </div>
        </div>

        <div className="landing-preview" aria-label="KOLABORIN platform preview">
          <div className="landing-preview-header">
            <span className="landing-preview-dot" />
            <strong>Live campus activity</strong>
          </div>
          <div className="landing-preview-map">
            <span className="landing-map-route route-one" />
            <span className="landing-map-route route-two" />
            <span className="landing-map-pin pin-one">5</span>
            <span className="landing-map-pin pin-two">3</span>
            <span className="landing-map-pin pin-three">4</span>
          </div>
          <div className="landing-preview-stats">
            <div><strong>18</strong><span>Studying now</span></div>
            <div><strong>6</strong><span>Campus places</span></div>
            <div><strong>12</strong><span>Study groups</span></div>
          </div>
        </div>
      </section>

      <section className="landing-roles" aria-label="Platform roles">
        <article>
          <strong>Student</strong>
          <p>Join study groups, communities, events, and build points.</p>
        </article>
        <article>
          <strong>Organization</strong>
          <p>Publish events, manage applicants, and collaborate with campus organizations.</p>
        </article>
        <article>
          <strong>Admin</strong>
          <p>Verify organizations and places, and approve badges.</p>
        </article>
      </section>
    </main>
  );
}
