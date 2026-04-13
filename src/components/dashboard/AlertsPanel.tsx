'use client';

import type { Alert } from '../../lib/types';
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

interface AlertsPanelProps {
  alerts: Alert[];
}

const severityIcons = {
  critical: AlertCircle,
  warning: AlertTriangle,
  positive: CheckCircle,
};

const severityColors = {
  critical: 'var(--color-rose)',
  warning: 'var(--color-amber)',
  positive: 'var(--color-emerald)',
};

export default function AlertsPanel({ alerts }: AlertsPanelProps) {
  return (
    <div className="card animate-in">
      <div className="card-header">
        <span className="card-title">Smart Alerts</span>
        <span className="badge badge-blue">{alerts.length} active</span>
      </div>
      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {alerts.map((alert) => {
          const Icon = severityIcons[alert.severity];
          return (
            <div key={alert.id} className={`alert alert-${alert.severity}`}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Icon
                  size={16}
                  style={{ color: severityColors[alert.severity], marginTop: 1, flexShrink: 0 }}
                />
                <div>
                  <div className="alert-title">{alert.title}</div>
                  <div className="alert-description">{alert.description}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
