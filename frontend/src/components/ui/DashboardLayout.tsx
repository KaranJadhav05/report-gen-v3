import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Upload, ShieldCheck, LogOut,
  GraduationCap, ChevronLeft, Menu, User as UserIcon,
} from 'lucide-react';

const navItems = [
  { to: '/attendance',      icon: Upload,          label: 'Attendance Tool' },
  { to: '/user-dashboard',  icon: LayoutDashboard, label: 'My Dashboard'    },
  { to: '/admin-dashboard', icon: ShieldCheck,     label: 'Admin Panel', adminOnly: false },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--background)' }}>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside
        className={`fixed md:relative z-50 h-full flex flex-col flex-shrink-0 transition-all duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 ${collapsed ? 'w-16' : 'w-58'}`}
        style={{ background: 'var(--background-2)', borderRight: '1px solid var(--border)', width: collapsed ? '64px' : '228px' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#6366f1,#06b6d4)' }}>
            <GraduationCap size={16} className="text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="font-black text-base tracking-tight gradient-text">ReportGen</span>
              <p className="text-xs truncate" style={{ color: 'var(--foreground-3)' }}>PCCOE</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems
            .filter(item => !item.adminOnly || user?.role === 'admin')
            .map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group
                   ${isActive ? 'active-nav' : 'inactive-nav'}`
                }
                style={({ isActive }) => isActive ? {
                  background: 'rgba(99,102,241,0.15)',
                  color: '#818cf8',
                  border: '1px solid rgba(99,102,241,0.25)',
                  boxShadow: '0 0 12px rgba(99,102,241,0.15)',
                } : {
                  background: 'transparent', color: 'var(--foreground-3)',
                  border: '1px solid transparent',
                }}>
                {({ isActive }) => (
                  <>
                    <Icon size={17} className={`flex-shrink-0 transition-all duration-200 ${isActive ? '' : 'group-hover:scale-110'}`}
                      style={{ color: isActive ? '#818cf8' : 'var(--foreground-3)' }} />
                    {!collapsed && <span>{label}</span>}
                  </>
                )}
              </NavLink>
            ))
          }
        </nav>

        {/* User + controls */}
        <div className="p-3 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
          {!collapsed && (
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1"
              style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#6366f1,#06b6d4)' }}>
                <UserIcon size={13} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate" style={{ color: 'var(--foreground)' }}>{user?.name}</p>
                <p className="text-xs capitalize" style={{ color: 'var(--foreground-3)' }}>{user?.role}</p>
              </div>
            </div>
          )}
          <button onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
            style={{ color: 'var(--foreground-3)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='rgba(244,63,94,0.1)'; (e.currentTarget as HTMLElement).style.color='#fb7185'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='transparent'; (e.currentTarget as HTMLElement).style.color='var(--foreground-3)'; }}>
            <LogOut size={15} className="flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
          <button onClick={() => setCollapsed(c => !c)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200"
            style={{ color: 'var(--foreground-3)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='var(--surface)'; (e.currentTarget as HTMLElement).style.color='var(--foreground)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='transparent'; (e.currentTarget as HTMLElement).style.color='var(--foreground-3)'; }}>
            {collapsed ? <Menu size={15}/> : <><ChevronLeft size={15}/><span>Collapse</span></>}
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden relative" style={{ background: 'var(--background)' }}>
        {/* Mobile Header Top Bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ background: 'var(--background-2)', borderBottom: '1px solid var(--border)' }}>
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg text-white" style={{ background: 'rgba(99,102,241,0.15)' }}>
            <Menu size={20} />
          </button>
          <span className="font-black text-base tracking-tight gradient-text">ReportGen</span>
          <div className="w-6 h-6" /> {/* spacer */}
        </div>
        
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
