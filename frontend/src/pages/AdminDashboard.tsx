import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Users, FileText, TrendingUp, Database, RefreshCw } from 'lucide-react';

export default function AdminDashboard() {
  const { token, loading: authLoading } = useAuth();
  const [history,  setHistory]  = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);
  const [fetchErr, setFetchErr] = useState('');

  const loadHistory = useCallback(() => {
    if (!token) return;
    setFetching(true); setFetchErr('');
    fetch('/api/attendance/history', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : r.json().then((d: any) => Promise.reject(d.message || 'Failed')))
      .then(d  => setHistory(d.reports || []))
      .catch((e: any) => setFetchErr(String(e)))
      .finally(() => setFetching(false));
  }, [token]);

  useEffect(() => { if (!authLoading && token) loadHistory(); }, [authLoading, token, loadHistory]);

  const totalStudents = history.reduce((a: number, r: any) => a + r.totalStudents, 0);
  const avgAtt = history.length
    ? (history.reduce((a: number, r: any) => a + r.averageAttendance, 0) / history.length).toFixed(1) : '—';

  const stats = [
    { icon: FileText,   label: 'Total Reports',  value: history.length, grad: 'linear-gradient(135deg,#6366f1,#4f46e5)' },
    { icon: Users,      label: 'Total Students', value: totalStudents,  grad: 'linear-gradient(135deg,#06b6d4,#0891b2)' },
    { icon: TrendingUp, label: 'Avg Attendance', value: avgAtt + '%',   grad: 'linear-gradient(135deg,#10b981,#059669)' },
    { icon: Database,   label: 'DB Collections', value: '2',            grad: 'linear-gradient(135deg,#f59e0b,#d97706)' },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8 fade-in-up">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.3),rgba(6,182,212,0.3))', border:'1px solid rgba(99,102,241,0.3)' }}>
            <ShieldCheck size={20} style={{ color: '#818cf8' }}/>
          </div>
          <div>
            <h1 className="text-2xl font-black" style={{ color: 'var(--foreground)' }}>Admin Panel</h1>
            <p className="text-sm" style={{ color: 'var(--foreground-3)' }}>Platform-wide overview</p>
          </div>
        </div>
        <button onClick={loadHistory} disabled={fetching}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-[1.02] disabled:opacity-50"
          style={{ background:'var(--surface)', border:'1px solid var(--border)', color:'var(--foreground-2)' }}>
          <RefreshCw size={13} className={fetching ? 'animate-spin' : ''}/>Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(({ icon: Icon, label, value, grad }, i) => (
          <div key={label} className="card p-5 hover:scale-[1.02] transition-all duration-300 fade-in-up"
            style={{ animationDelay: `${i * 60}ms` }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
              style={{ background: grad }}>
              <Icon size={17} className="text-white"/>
            </div>
            <p className="text-2xl font-black" style={{ color: 'var(--foreground)' }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--foreground-3)' }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden fade-in-up">
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom:'1px solid var(--border)' }}>
          <h2 className="font-bold" style={{ color:'var(--foreground)' }}>All Reports</h2>
          <span className="text-xs px-2.5 py-1 rounded-full font-medium"
            style={{ background:'rgba(99,102,241,0.12)', color:'#818cf8', border:'1px solid rgba(99,102,241,0.2)' }}>
            {history.length} records
          </span>
        </div>

        {(fetching || authLoading) && (
          <div className="p-10 flex flex-col items-center gap-3" style={{ color:'var(--foreground-3)' }}>
            <div className="w-8 h-8 border-2 rounded-full animate-spin"
              style={{ borderColor:'var(--primary)', borderTopColor:'transparent' }}/>
            <p className="text-sm">Loading…</p>
          </div>
        )}
        {!fetching && !authLoading && fetchErr && (
          <div className="p-8 text-center">
            <p className="text-sm font-medium mb-3" style={{ color:'#fb7185' }}>Error: {fetchErr}</p>
            <button onClick={loadHistory}
              className="px-4 py-2 rounded-lg text-sm font-bold text-white"
              style={{ background:'var(--primary)' }}>Retry</button>
          </div>
        )}
        {!fetching && !authLoading && !fetchErr && history.length === 0 && (
          <div className="p-10 text-center text-sm" style={{ color:'var(--foreground-3)' }}>No reports in the system yet.</div>
        )}
        {!fetching && !authLoading && !fetchErr && history.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background:'var(--surface)', borderBottom:'1px solid var(--border)', color:'var(--foreground-3)' }}>
                {['File','Students','Avg Att.','Date Range','Uploaded'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((r: any) => (
                <tr key={r._id} style={{ borderTop:'1px solid var(--border)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  className="transition-colors duration-200">
                  <td className="px-6 py-3.5 font-medium max-w-xs truncate" style={{ color:'var(--foreground)' }}>{r.sheetName}</td>
                  <td className="px-6 py-3.5" style={{ color:'var(--foreground-2)' }}>{r.totalStudents}</td>
                  <td className="px-6 py-3.5">
                    <span className="font-bold" style={{ color: r.averageAttendance < 75 ? '#fb7185' : '#34d399' }}>
                      {r.averageAttendance.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-xs max-w-xs truncate" style={{ color:'var(--foreground-3)' }}>{r.dateRange || '—'}</td>
                  <td className="px-6 py-3.5 text-xs" style={{ color:'var(--foreground-3)' }}>
                    {new Date(r.uploadedAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
