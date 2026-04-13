'use client';

import { Sparkles } from 'lucide-react';

interface BranchSummaryProps {
  summary: string;
}

export default function BranchSummary({ summary }: BranchSummaryProps) {
  return (
    <div className="summary-callout animate-in">
      <div className="summary-label">
        <Sparkles size={14} />
        Smart Branch Analysis
      </div>
      <p>{summary}</p>
    </div>
  );
}
