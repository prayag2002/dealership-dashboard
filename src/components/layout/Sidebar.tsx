'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Sun,
  Moon,
  ChevronRight,
} from 'lucide-react';
import { useFilterStore } from '../../store/filters';
import DataUploader from './DataUploader';

export default function Sidebar() {
  const pathname = usePathname();
  const { data, theme, toggleTheme, sidebarOpen, setSidebarOpen } = useFilterStore();

  // Derive branches from loaded data — no hardcoding
  const branches = data?.branches || [];

  return (
    <>
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <h1>DealerPulse</h1>
          <p>Dealership Performance</p>
        </div>

        <nav className="sidebar-nav">
          <Link
            href="/"
            className={`sidebar-link ${pathname === '/' ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <LayoutDashboard />
            <span>Overview</span>
          </Link>

          {branches.length > 0 && (
            <div style={{ padding: '12px 12px 6px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>
              Branches
            </div>
          )}

          {branches.map((branch) => (
            <Link
              key={branch.id}
              href={`/branch/${branch.id}`}
              className={`sidebar-link ${pathname === `/branch/${branch.id}` ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Building2 />
              <span style={{ flex: 1 }}>{branch.name}</span>
              <ChevronRight style={{ width: 14, height: 14, opacity: 0.4 }} />
            </Link>
          ))}
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <DataUploader />
          <div className="sidebar-footer">
            <button
              onClick={toggleTheme}
              className="sidebar-link"
              style={{ width: '100%', border: 'none', cursor: 'pointer', background: 'transparent' }}
            >
              {theme === 'light' ? <Moon /> : <Sun />}
              <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
