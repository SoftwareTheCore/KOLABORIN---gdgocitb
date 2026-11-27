import React from 'react';

export function PageSkeleton() {
  return (
    <main className="container loading-skeleton-page" aria-busy="true" aria-label="Memuat halaman">
      <span className="skeleton-line skeleton-heading" />
      <span className="skeleton-line skeleton-copy" />
      <div className="skeleton-grid">
        {[0, 1, 2].map((item) => <span className="skeleton-block" key={item} />)}
      </div>
      <span className="skeleton-block skeleton-large-block" />
    </main>
  );
}

export function CardSkeletonList({ count = 3 }) {
  return (
    <div className="skeleton-grid" aria-busy="true" aria-label="Memuat data">
      {Array.from({ length: count }, (_, item) => <span className="skeleton-block" key={item} />)}
    </div>
  );
}
