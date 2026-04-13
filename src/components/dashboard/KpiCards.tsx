'use client';

import type { KpiData } from '../../lib/types';
import { formatCurrency, formatPercent, formatNumber } from '../../lib/utils';
import {
  IndianRupee,
  TrendingUp,
  Target,
  Clock,
  Layers,
} from 'lucide-react';

interface KpiCardsProps {
  data: KpiData;
}

export default function KpiCards({ data }: KpiCardsProps) {
  const cards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(data.totalRevenue, true),
      subtitle: `Target: ${formatCurrency(data.targetRevenue, true)}`,
      icon: IndianRupee,
      color: 'blue' as const,
    },
    {
      title: 'Units Delivered',
      value: formatNumber(data.totalDelivered),
      subtitle: `Target: ${formatNumber(data.targetUnits)} units`,
      icon: Target,
      color: 'emerald' as const,
    },
    {
      title: 'Conversion Rate',
      value: formatPercent(data.conversionRate),
      subtitle: 'Lead to delivery',
      icon: TrendingUp,
      color: 'violet' as const,
    },
    {
      title: 'Active Pipeline',
      value: formatCurrency(data.pipelineValue, true),
      subtitle: `${data.pipelineCount} active leads`,
      icon: Layers,
      color: 'amber' as const,
    },
    {
      title: 'Avg Delivery Time',
      value: `${data.avgDeliveryDays.toFixed(0)} days`,
      subtitle: 'Order to delivery',
      icon: Clock,
      color: 'rose' as const,
    },
  ];

  return (
    <div className="kpi-grid">
      {cards.map((card, index) => (
        <div key={card.title} className="card animate-in" style={{ animationDelay: `${index * 50}ms` }}>
          <div className="card-header">
            <span className="card-title">{card.title}</span>
            <div className={`kpi-icon ${card.color}`}>
              <card.icon size={18} />
            </div>
          </div>
          <div className="card-value">{card.value}</div>
          <div className="card-subtitle">{card.subtitle}</div>
        </div>
      ))}
    </div>
  );
}
