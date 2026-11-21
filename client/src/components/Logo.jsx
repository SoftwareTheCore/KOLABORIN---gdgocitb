import React, { useState } from 'react';

export default function Logo({ height = 32, className = '' }) {
  const [error, setError] = useState(false);

  if (error) {
    return <span className={`logo-fallback ${className}`}>KOLABORIN</span>;
  }

  return (
    <img
      src="/logo.png"
      alt="KOLABORIN"
      style={{ height: `${height}px`, width: 'auto', display: 'block' }}
      className={`logo-img ${className}`}
      onError={() => setError(true)}
    />
  );
}
