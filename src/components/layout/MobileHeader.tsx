'use client';

import { Menu } from 'lucide-react';
import { useFilterStore } from '../../store/filters';

export default function MobileHeader() {
  const { setSidebarOpen } = useFilterStore();

  return (
    <div className="mobile-header">
      <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
        <Menu size={22} />
      </button>
      <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}>DealerPulse</span>
      <div style={{ width: 30 }} />
    </div>
  );
}
