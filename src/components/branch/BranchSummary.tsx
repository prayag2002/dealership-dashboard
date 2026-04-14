'use client';

import { Sparkles, TrendingUp, TrendingDown, Target, Users, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatPercent } from '../../lib/utils';

interface SummarySection {
  icon: 'performance' | 'target' | 'topRep' | 'risk' | 'channel' | 'action';
  text: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

interface BranchSummaryProps {
  summary: string;
  sections?: SummarySection[];
}

/** Parse a plain-text summary into structured sections */
function parseSummary(text: string): SummarySection[] {
  const sentences = text.split(/\.\s+/).filter(s => s.trim().length > 0);
  return sentences.map((s, i) => {
    const sentence = s.endsWith('.') ? s : s + '.';
    let icon: SummarySection['icon'] = 'performance';
    let sentiment: SummarySection['sentiment'] = 'neutral';

    if (sentence.includes('generated') || sentence.includes('revenue') || sentence.includes('ranked')) {
      icon = 'performance';
    }
    if (sentence.includes('Target achievement') || sentence.includes('target')) {
      icon = 'target';
    }
    if (sentence.includes('Top performer')) {
      icon = 'topRep';
      sentiment = 'positive';
    }
    if (sentence.includes('Below') || sentence.includes('below') || sentence.includes('critically') || sentence.includes('lost') || sentence.includes('Lost')) {
      icon = 'risk';
      sentiment = 'negative';
    }
    if (sentence.includes('outperforms') || sentence.includes('leads the') || sentence.includes('strong')) {
      sentiment = 'positive';
    }
    if (sentence.includes('channel') || sentence.includes('source') || sentence.includes('Walk') || sentence.includes('effective')) {
      icon = 'channel';
    }
    if (sentence.includes('Recommend') || sentence.includes('prioritize') || sentence.includes('pipeline') || sentence.includes('Active pipeline')) {
      icon = 'action';
    }
    if (sentence.includes('overdue') || sentence.includes('Overdue') || sentence.includes('at risk')) {
      icon = 'risk';
      sentiment = 'negative';
    }

    return { icon, text: sentence, sentiment };
  });
}

const iconMap = {
  performance: TrendingUp,
  target: Target,
  topRep: Users,
  risk: AlertTriangle,
  channel: TrendingUp,
  action: Sparkles,
};

const sentimentColor = {
  positive: 'var(--color-emerald)',
  negative: 'var(--color-rose)',
  neutral: 'var(--text-secondary)',
};

export default function BranchSummary({ summary, sections }: BranchSummaryProps) {
  const parsed = sections || parseSummary(summary);

  return (
    <div className="summary-callout animate-in">
      <div className="summary-label">
        <Sparkles size={14} />
        Smart Branch Analysis
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        {parsed.map((section, i) => {
          const Icon = iconMap[section.icon] || TrendingUp;
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                background: section.sentiment === 'negative' ? 'var(--color-rose-light)'
                  : section.sentiment === 'positive' ? 'var(--color-emerald-light)'
                  : 'var(--bg-secondary)',
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              <Icon
                size={14}
                style={{
                  color: sentimentColor[section.sentiment || 'neutral'],
                  flexShrink: 0,
                  marginTop: 3,
                }}
              />
              <span style={{ color: 'var(--text-primary)' }}>{section.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
