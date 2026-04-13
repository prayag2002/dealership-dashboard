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

const branches = [
  { id: 'B1', name: 'Downtown Toyota', city: 'Chennai' },
  { id: 'B2', name: 'Highway Toyota', city: 'Chennai' },
  { id: 'B3', name: 'Lakeside Toyota', city: 'Bangalore' },
  { id: 'B4', name: 'Central Toyota', city: 'Hyderabad' },
  { id: 'B5', name: 'Eastside Toyota', city: 'Mumbai' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme, sidebarOpen, setSidebarOpen } = useFilterStore();

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

          <div style={{ padding: '12px 12px 6px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>
            Branches
          </div>

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
      </aside>
    </>
  );
}
