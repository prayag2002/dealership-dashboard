'use client';

import { SearchX } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export default function EmptyState({
  title = 'No data available',
  description = 'No sufficient data available for this time range. Try selecting a different period or uploading a dataset.',
}: EmptyStateProps) {
  return (
    <div
      className="card animate-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'var(--bg-tertiary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <SearchX size={22} style={{ color: 'var(--text-tertiary)' }} />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
        {title}
      </h3>
      <p style={{ fontSize: 13, color: 'var(--text-tertiary)', maxWidth: 360, lineHeight: 1.6 }}>
        {description}
      </p>
    </div>
  );
}
