import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import {
  Upload, AlertTriangle, FileText, Users, TrendingUp, BarChart2,
  ChevronUp, ChevronDown, Printer, Settings2, Save, ChevronRight, X,
} from 'lucide-react';
import { parseAttendanceCSV, type Student } from '../lib/utils';
import { openLetter, openAllLetters, type LetterConfig, DEFAULT_CONFIG } from '../lib/letterGenerator';

// ── Dark chart palette ─────────────────────────────────────────────────────
const CHART_COLORS = ['#f43f5e','#f97316','#f59e0b','#6366f1','#10b981'];
const PIE_COLORS   = ['#f43f5e','#f59e0b','#10b981'];
const TOOLTIP_STYLE = {
  background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(148,163,184,0.15)',
  borderRadius: '10px', color: '#f1f5f9', fontSize: '12px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
};
const AXIS_STYLE = { fill: '#64748b', fontSize: 11, fontFamily: 'Outfit, sans-serif' };
const GRID_STYLE = { stroke: 'rgba(148,163,184,0.08)' };

function StatCard({ icon: Icon, label, value, gradient, delay = 0 }: any) {
  return (
    <div className="card p-5 hover:scale-[1.02] transition-all duration-300 group cursor-default fade-in-up"
      style={{ animationDelay: `${delay}ms` }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
        style={{ background: gradient }}>
        <Icon size={18} className="text-white"/>
      </div>
      <p className="text-2xl font-black" style={{ color: 'var(--foreground)' }}>{value}</p>
      <p className="text-xs font-medium mt-1" style={{ color: 'var(--foreground-3)' }}>{label}</p>
    </div>
  );
}

function LField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--foreground-3)' }}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 outline-none"
        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-bright)', color: 'var(--foreground)' }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-glow)'; }}
        onBlur={e  => { e.currentTarget.style.borderColor = 'var(--border-bright)'; e.currentTarget.style.boxShadow = 'none'; }}
      />
    </div>
  );
}

// ── Custom dark tooltip ────────────────────────────────────────────────────
const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={TOOLTIP_STYLE} className="px-3 py-2.5">
      {label && <p className="font-bold mb-1" style={{ color: '#94a3b8', fontSize: 11 }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-bold" style={{ color: p.color || '#f1f5f9' }}>
          {p.name ? `${p.name}: ` : ''}{p.value}
        </p>
      ))}
    </div>
  );
};

export default function AttendancePage() {
  const { token } = useAuth();
  const fileRef   = useRef<HTMLInputElement>(null);

  const [students,  setStudents]  = useState<Student[]>([]);
  const [sheetMeta, setSheetMeta] = useState<any>(null);
  const [dragging,  setDragging]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [threshold, setThreshold] = useState(75);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'defaulters' | 'letters'>('dashboard');
  const [sortDir,   setSortDir]   = useState<'asc' | 'desc'>('asc');
  const [search,    setSearch]    = useState('');
  const [cfg,       setCfg]       = useState<LetterConfig>(DEFAULT_CONFIG);
  const [cfgOpen,   setCfgOpen]   = useState(false);
  const [cfgSaved,  setCfgSaved]  = useState(false);

  const updateCfg = (k: keyof LetterConfig) => (v: string) => setCfg(c => ({ ...c, [k]: v }));
  const saveConfig = () => { setCfgSaved(true); setTimeout(() => setCfgSaved(false), 2000); };

  // ── Upload ──────────────────────────────────────────────────────────────
  const uploadFile = useCallback(async (file: File) => {
    setUploading(true); setUploadMsg('');
    const fd = new FormData(); fd.append('file', file);
    try {
      const res  = await fetch('/api/attendance/upload', { method:'POST', headers:{ Authorization:`Bearer ${token}` }, body:fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      setStudents(data.report.students); setSheetMeta(data.report);
      if (data.report.department)   setCfg(c => ({ ...c, department:   data.report.department }));
      if (data.report.academicYear) setCfg(c => ({ ...c, academicYear: data.report.academicYear }));
      if (data.report.semester)     setCfg(c => ({ ...c, semester:     data.report.semester }));
      setUploadMsg('✅  Saved to database.'); setActiveTab('dashboard');
    } catch (err: any) {
      try {
        const text   = await file.text();
        const parsed = parseAttendanceCSV(text);
        if (!parsed) throw new Error('Cannot parse file');
        setStudents(parsed.students); setSheetMeta({ sheetName: file.name, ...parsed.meta });
        if (parsed.meta.department)   setCfg(c => ({ ...c, department:   parsed.meta.department }));
        if (parsed.meta.academicYear) setCfg(c => ({ ...c, academicYear: parsed.meta.academicYear }));
        if (parsed.meta.semester)     setCfg(c => ({ ...c, semester:     parsed.meta.semester }));
        setUploadMsg('⚠️  Parsed locally (backend not reachable).'); setActiveTab('dashboard');
      } catch { setUploadMsg('❌  ' + (err.message || 'Could not parse file.')); }
    } finally { setUploading(false); }
  }, [token]);

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) uploadFile(f); };
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ''; };

  // ── Analytics ───────────────────────────────────────────────────────────
  const defaulters = useMemo(() =>
    students.filter(s => s.overallAtt < threshold)
            .sort((a, b) => sortDir === 'asc' ? a.overallAtt - b.overallAtt : b.overallAtt - a.overallAtt),
    [students, threshold, sortDir]);
  const filtered = useMemo(() =>
    defaulters.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.prn.includes(search)),
    [defaulters, search]);
  const avg = useMemo(() =>
    students.length ? (students.reduce((a, s) => a + s.overallAtt, 0) / students.length).toFixed(1) : '—',
    [students]);
  const barData = useMemo(() => {
    const b: Record<string, number> = { '< 50%':0,'50–65%':0,'65–75%':0,'75–85%':0,'85–100%':0 };
    students.forEach(s => {
      if      (s.overallAtt <  50) b['< 50%']++;
      else if (s.overallAtt <  65) b['50–65%']++;
      else if (s.overallAtt <  75) b['65–75%']++;
      else if (s.overallAtt <  85) b['75–85%']++;
      else                          b['85–100%']++;
    });
    return Object.entries(b).map(([range, count]) => ({ range, count }));
  }, [students]);
  const pieData = useMemo(() => [
    { name: `Below ${threshold}%`, value: defaulters.length },
    { name: `${threshold}–85%`,    value: students.filter(s => s.overallAtt >= threshold && s.overallAtt < 85).length },
    { name: '85%+',                value: students.filter(s => s.overallAtt >= 85).length },
  ], [students, defaulters, threshold]);
  const scatterData = useMemo(() => students.map(s => ({ x: s.overallTH, y: s.overallPR, name: s.name, att: s.overallAtt })), [students]);

  const rowGlow = (att: number) => {
    if (att < 50)        return 'rgba(244,63,94,0.07)';
    if (att < 65)        return 'rgba(249,115,22,0.07)';
    if (att < threshold) return 'rgba(245,158,11,0.07)';
    return 'transparent';
  };

  // ── UPLOAD SCREEN ────────────────────────────────────────────────────────
  if (students.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }}/>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }}/>
      </div>
      <div className="max-w-lg w-full relative fade-in-up">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black gradient-text tracking-tight">Attendance Tool</h1>
          <p className="text-sm mt-3" style={{ color: 'var(--foreground-3)' }}>Upload an Excel or CSV sheet to begin analysis</p>
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className="rounded-2xl p-14 text-center cursor-pointer transition-all duration-300"
          style={{
            background: dragging ? 'rgba(99,102,241,0.12)' : 'var(--surface)',
            border: `2px dashed ${dragging ? 'var(--primary)' : 'var(--border-bright)'}`,
            boxShadow: dragging ? '0 0 40px rgba(99,102,241,0.2)' : '0 4px 24px rgba(0,0,0,0.4)',
            transform: dragging ? 'scale(1.01)' : 'scale(1)',
          }}>
          {uploading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center pulse-glow"
                style={{ background: 'linear-gradient(135deg,#6366f1,#06b6d4)' }}>
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"/>
              </div>
              <p className="font-bold" style={{ color: 'var(--primary)' }}>Processing file…</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-all duration-300"
                style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.3),rgba(6,182,212,0.3))', border:'1px solid rgba(99,102,241,0.4)' }}>
                <Upload size={28} style={{ color: '#818cf8' }}/>
              </div>
              <p className="font-bold text-lg mb-2" style={{ color: 'var(--foreground)' }}>Drop your attendance sheet here</p>
              <p className="text-sm mb-6" style={{ color: 'var(--foreground-3)' }}>or click to browse · .xlsx / .csv supported</p>
              <div className="inline-block px-6 py-2.5 rounded-xl font-bold text-sm text-white"
                style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', boxShadow:'0 8px 25px rgba(99,102,241,0.4)' }}>
                Choose File
              </div>
            </>
          )}
          <input ref={fileRef} type="file" accept=".xlsx,.csv,.xls" className="hidden" onChange={handleFile}/>
        </div>

        {uploadMsg && (
          <div className="mt-4 p-3 rounded-xl text-sm text-center font-medium"
            style={{
              background: uploadMsg.startsWith('✅') ? 'rgba(16,185,129,0.12)' : uploadMsg.startsWith('⚠') ? 'rgba(245,158,11,0.12)' : 'rgba(244,63,94,0.12)',
              border: `1px solid ${uploadMsg.startsWith('✅') ? 'rgba(16,185,129,0.3)' : uploadMsg.startsWith('⚠') ? 'rgba(245,158,11,0.3)' : 'rgba(244,63,94,0.3)'}`,
              color: uploadMsg.startsWith('✅') ? '#34d399' : uploadMsg.startsWith('⚠') ? '#fbbf24' : '#fb7185',
            }}>
            {uploadMsg}
          </div>
        )}
      </div>
    </div>
  );

  // ── MAIN SCREEN ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="px-6 py-3 flex items-center justify-between flex-shrink-0 gap-4"
        style={{ background:'var(--background-2)', borderBottom:'1px solid var(--border)' }}>
        <div className="min-w-0">
          <h2 className="font-black text-base truncate" style={{ color:'var(--foreground)' }}>
            {sheetMeta?.sheetName || sheetMeta?.name}
          </h2>
          {sheetMeta?.dateRange && <p className="text-xs truncate" style={{ color:'var(--foreground-3)' }}>{sheetMeta.dateRange}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {uploadMsg && <span className="text-xs hidden lg:block font-medium" style={{ color:'#34d399' }}>{uploadMsg}</span>}
          <button onClick={() => setCfgOpen(o => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-[1.02]"
            style={cfgOpen
              ? { background:'rgba(99,102,241,0.2)', color:'#818cf8', border:'1px solid rgba(99,102,241,0.4)' }
              : { background:'var(--surface)', color:'var(--foreground-2)', border:'1px solid var(--border)' }}>
            <Settings2 size={13}/> Letter Settings
          </button>
          <button onClick={() => { setStudents([]); setSheetMeta(null); setUploadMsg(''); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-[1.02]"
            style={{ background:'var(--surface)', color:'var(--foreground-2)', border:'1px solid var(--border)' }}>
            <Upload size={13}/> New Upload
          </button>
        </div>
      </div>

      {/* Config Panel */}
      {cfgOpen && (
        <div className="px-6 py-4 flex-shrink-0 fade-in-up"
          style={{ background:'rgba(99,102,241,0.06)', borderBottom:'1px solid rgba(99,102,241,0.2)' }}>
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm flex items-center gap-2" style={{ color:'#818cf8' }}>
                <Settings2 size={14}/> Letter Configuration
                <span className="text-xs font-normal" style={{ color:'var(--foreground-3)' }}>— auto-filled from sheet where possible</span>
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={saveConfig}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:scale-[1.02]"
                  style={{ background: cfgSaved ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
                  <Save size={11}/>{cfgSaved ? 'Saved ✓' : 'Save'}
                </button>
                <button onClick={() => setCfgOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-[1.05]"
                  style={{ background:'var(--surface-2)', color:'var(--foreground-3)' }}>
                  <X size={13}/>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <LField label="Department"    value={cfg.department}   onChange={updateCfg('department')}   placeholder="Computer Engineering"/>
              <LField label="Academic Year" value={cfg.academicYear} onChange={updateCfg('academicYear')} placeholder="2025–2026"/>
              <LField label="Semester"      value={cfg.semester}     onChange={updateCfg('semester')}     placeholder="I / II"/>
              <LField label="Division"      value={cfg.division}     onChange={updateCfg('division')}     placeholder="A"/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <LField label="Class Teacher"        value={cfg.classTeacher} onChange={updateCfg('classTeacher')} placeholder="Mr. Ganesh Kadam"/>
              <LField label="Academic Coordinator" value={cfg.coordinator}  onChange={updateCfg('coordinator')}  placeholder="Mr. Atul Pawar"/>
              <LField label="Head of Department"   value={cfg.hod}          onChange={updateCfg('hod')}          placeholder="Dr. Sonali Patil"/>
            </div>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="px-6 flex gap-1 flex-shrink-0" style={{ background:'var(--background-2)', borderBottom:'1px solid var(--border)' }}>
        {([
          ['dashboard',  BarChart2,      'Dashboard'],
          ['defaulters', AlertTriangle,  `Defaulters (${defaulters.length})`],
          ['letters',    FileText,       'Generate Letters'],
        ] as const).map(([id, Icon, label]) => (
          <button key={id} onClick={() => setActiveTab(id as any)}
            className="flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition-all duration-200"
            style={{
              borderBottomColor: activeTab === id ? 'var(--primary)' : 'transparent',
              color: activeTab === id ? '#818cf8' : 'var(--foreground-3)',
            }}>
            <Icon size={15}/>{label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">

        {/* ── DASHBOARD ─────────────────────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Users}         label="Total Students"   value={students.length} gradient="linear-gradient(135deg,#6366f1,#4f46e5)" delay={0}/>
              <StatCard icon={TrendingUp}    label="Average Att."     value={avg+'%'}          gradient="linear-gradient(135deg,#10b981,#059669)" delay={60}/>
              <StatCard icon={AlertTriangle} label={`Below ${threshold}%`} value={defaulters.length} gradient="linear-gradient(135deg,#f43f5e,#e11d48)" delay={120}/>
              <StatCard icon={BarChart2}     label="Defaulter Rate"   value={((defaulters.length/students.length)*100).toFixed(1)+'%'} gradient="linear-gradient(135deg,#f59e0b,#d97706)" delay={180}/>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bar chart */}
              <div className="card p-5 fade-in-up">
                <h3 className="font-bold text-sm mb-5" style={{ color:'var(--foreground)' }}>Attendance Distribution</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} margin={{ top:5, right:10, left:-20, bottom:5 }}>
                    <CartesianGrid strokeDasharray="3 3" {...GRID_STYLE}/>
                    <XAxis dataKey="range" tick={AXIS_STYLE} axisLine={false} tickLine={false}/>
                    <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false}/>
                    <Tooltip content={<DarkTooltip/>}/>
                    <Bar dataKey="count" radius={[6,6,0,0]}>
                      {barData.map((_,i) => <Cell key={i} fill={CHART_COLORS[i]}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie chart */}
              <div className="card p-5 fade-in-up" style={{ animationDelay:'80ms' }}>
                <h3 className="font-bold text-sm mb-5" style={{ color:'var(--foreground)' }}>Pass / Defaulter Split ({threshold}%)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={82} innerRadius={30} dataKey="value"
                      label={({ name, percent }) => `${(percent*100).toFixed(0)}%`}
                      labelLine={{ stroke:'rgba(148,163,184,0.3)' }}>
                      {pieData.map((_,i) => (
                        <Cell key={i} fill={PIE_COLORS[i]}
                          style={{ filter:`drop-shadow(0 0 6px ${PIE_COLORS[i]}60)` }}/>
                      ))}
                    </Pie>
                    <Tooltip content={<DarkTooltip/>}/>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  {pieData.map((d,i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color:'var(--foreground-3)' }}>
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background:PIE_COLORS[i] }}/>
                      {d.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Scatter */}
            <div className="card p-5 fade-in-up" style={{ animationDelay:'120ms' }}>
              <h3 className="font-bold text-sm mb-5" style={{ color:'var(--foreground)' }}>Theory vs Practical — Per Student Scatter</h3>
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart margin={{ top:10, right:20, left:-10, bottom:20 }}>
                  <CartesianGrid strokeDasharray="3 3" {...GRID_STYLE}/>
                  <XAxis type="number" dataKey="x" name="Theory %" domain={[0,105]} tick={AXIS_STYLE} axisLine={false} tickLine={false}
                    label={{ value:'Theory Att. %', position:'insideBottom', offset:-10, fontSize:11, fill:'#64748b' }}/>
                  <YAxis type="number" dataKey="y" name="Practical %" domain={[0,105]} tick={AXIS_STYLE} axisLine={false} tickLine={false}
                    label={{ value:'Practical Att. %', angle:-90, position:'insideLeft', offset:10, fontSize:11, fill:'#64748b' }}/>
                  <ZAxis range={[40,40]}/>
                  <Tooltip cursor={{ stroke:'rgba(99,102,241,0.3)', strokeDasharray:'4 2' }}
                    content={({ payload }) => payload?.[0] ? (
                      <div style={{ ...TOOLTIP_STYLE }} className="px-3 py-2.5">
                        <p className="font-bold" style={{ color:'var(--foreground)' }}>{payload[0].payload.name}</p>
                        <p className="text-xs mt-1" style={{ color:'#94a3b8' }}>Theory: <span style={{ color:'#818cf8' }}>{payload[0].payload.x}%</span></p>
                        <p className="text-xs" style={{ color:'#94a3b8' }}>Practical: <span style={{ color:'#06b6d4' }}>{payload[0].payload.y}%</span></p>
                        <p className="text-xs" style={{ color:'#94a3b8' }}>Overall: <span className="font-bold" style={{ color:'#10b981' }}>{payload[0].payload.att}%</span></p>
                      </div>
                    ) : null}
                  />
                  <Scatter data={scatterData} fill="#6366f1" opacity={0.7}
                    style={{ filter:'drop-shadow(0 0 4px rgba(99,102,241,0.5))' }}/>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── DEFAULTERS ────────────────────────────────────────────────── */}
        {activeTab === 'defaulters' && (
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="card p-4 flex flex-wrap items-center gap-4 fade-in-up">
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold" style={{ color:'var(--foreground-2)' }}>Threshold:</label>
                <input type="number" min={0} max={100} value={threshold}
                  onChange={e => setThreshold(Number(e.target.value))}
                  className="w-20 px-3 py-1.5 rounded-lg text-sm font-black outline-none transition-all"
                  style={{ background:'rgba(0,0,0,0.4)', border:'1px solid rgba(244,63,94,0.4)', color:'#fb7185' }}/>
                <span className="text-sm" style={{ color:'var(--foreground-3)' }}>%</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold" style={{ color:'var(--foreground-2)' }}>Search:</label>
                <input type="text" placeholder="Name or PRN…" value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-44 px-3 py-1.5 rounded-lg text-sm outline-none transition-all"
                  style={{ background:'rgba(0,0,0,0.3)', border:'1px solid var(--border-bright)', color:'var(--foreground)' }}/>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-sm" style={{ color:'var(--foreground-3)' }}>{filtered.length} student{filtered.length !== 1 ? 's' : ''}</span>
                <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-[1.02]"
                  style={{ background:'var(--surface-2)', border:'1px solid var(--border)', color:'var(--foreground-2)' }}>
                  Sort {sortDir === 'asc' ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
                </button>
              </div>
            </div>

            <div className="card overflow-hidden fade-in-up" style={{ animationDelay:'60ms' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background:'var(--surface)', borderBottom:'1px solid var(--border)' }}>
                    {['Sr.','PRN','Name','Theory %','Practical %','Overall %','Status','Letter'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color:'var(--foreground-3)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => (
                    <tr key={s.prn} className="transition-all duration-150"
                      style={{ borderTop:'1px solid var(--border)', background: rowGlow(s.overallAtt) }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = rowGlow(s.overallAtt)}>
                      <td className="px-5 py-3.5 text-xs" style={{ color:'var(--foreground-3)' }}>{i+1}</td>
                      <td className="px-5 py-3.5 font-mono text-xs" style={{ color:'var(--foreground-3)' }}>{s.prn}</td>
                      <td className="px-5 py-3.5 font-semibold" style={{ color:'var(--foreground)' }}>{s.name}</td>
                      <td className="px-5 py-3.5" style={{ color:'var(--foreground-2)' }}>{s.overallTH.toFixed(1)}%</td>
                      <td className="px-5 py-3.5" style={{ color:'var(--foreground-2)' }}>{s.overallPR.toFixed(1)}%</td>
                      <td className="px-5 py-3.5">
                        <span className="font-black text-sm"
                          style={{ color: s.overallAtt < 50 ? '#fb7185' : s.overallAtt < 65 ? '#fb923c' : '#fbbf24' }}>
                          {s.overallAtt.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                          style={s.overallAtt < 50
                            ? { background:'rgba(244,63,94,0.15)', color:'#fb7185', border:'1px solid rgba(244,63,94,0.3)' }
                            : { background:'rgba(245,158,11,0.15)', color:'#fbbf24', border:'1px solid rgba(245,158,11,0.3)' }}>
                          {s.overallAtt < 50 ? 'Critical' : 'Warning'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => openLetter(s, cfg)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-[1.05]"
                          style={{ background:'rgba(99,102,241,0.15)', color:'#818cf8', border:'1px solid rgba(99,102,241,0.3)' }}>
                          <Printer size={12}/> Open
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="text-center py-14 text-sm" style={{ color:'var(--foreground-3)' }}>
                      No defaulters{search ? ` matching "${search}"` : ` below ${threshold}%`}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── LETTERS ───────────────────────────────────────────────────── */}
        {activeTab === 'letters' && (
          <div className="max-w-5xl mx-auto space-y-5">
            {/* CTA banner */}
            <div className="rounded-2xl p-6 text-white flex items-start justify-between gap-4 fade-in-up relative overflow-hidden"
              style={{ background:'linear-gradient(135deg,rgba(99,102,241,0.25),rgba(6,182,212,0.15))', border:'1px solid rgba(99,102,241,0.35)' }}>
              <div className="absolute inset-0 pointer-events-none"
                style={{ background:'radial-gradient(ellipse at 80% 50%, rgba(99,102,241,0.2), transparent 60%)' }}/>
              <div className="relative">
                <h2 className="text-xl font-black mb-1.5" style={{ color:'var(--foreground)' }}>📄 Defaulter Notice Letters</h2>
                <p className="text-sm leading-relaxed max-w-lg" style={{ color:'var(--foreground-2)' }}>
                  PCCOE-formatted letters with actual college logo for all <strong style={{ color:'#818cf8' }}>{defaulters.length}</strong> students below <strong style={{ color:'#fb7185' }}>{threshold}%</strong>.
                  Opens in a new window — use <em>Print → Save as PDF</em>.
                </p>
                <p className="text-xs mt-2" style={{ color:'var(--foreground-3)' }}>⚠️ Allow pop-ups for this site if your browser blocks the window.</p>
              </div>
              <button onClick={() => openAllLetters(defaulters, cfg)} disabled={defaulters.length === 0}
                className="relative flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white transition-all duration-300 hover:scale-[1.03] disabled:opacity-40"
                style={{ background:'linear-gradient(135deg,#6366f1,#4f46e5)', boxShadow:'0 8px 25px rgba(99,102,241,0.4)' }}>
                <Printer size={15}/> Print All ({defaulters.length})
              </button>
            </div>

            {/* Config summary */}
            <div className="rounded-xl px-5 py-3.5 flex items-center gap-3 fade-in-up"
              style={{ background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)' }}>
              <Settings2 size={16} style={{ color:'#818cf8' }} className="flex-shrink-0"/>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color:'#818cf8' }}>Letter Configuration</p>
                <p className="text-xs truncate" style={{ color:'var(--foreground-3)' }}>
                  {cfg.department} · {cfg.academicYear} · Sem {cfg.semester} ·
                  Teacher: {cfg.classTeacher} · Coord: {cfg.coordinator} · HOD: {cfg.hod}
                </p>
              </div>
              <button onClick={() => setCfgOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-[1.02]"
                style={{ background:'rgba(99,102,241,0.2)', color:'#818cf8', border:'1px solid rgba(99,102,241,0.3)' }}>
                Edit <ChevronRight size={12}/>
              </button>
            </div>

            {/* Threshold */}
            <div className="card px-5 py-3.5 flex items-center gap-3 fade-in-up">
              <span className="text-sm font-semibold" style={{ color:'var(--foreground-2)' }}>Threshold:</span>
              <input type="number" min={0} max={100} value={threshold}
                onChange={e => setThreshold(Number(e.target.value))}
                className="w-20 px-3 py-1.5 rounded-lg text-sm font-black outline-none"
                style={{ background:'rgba(0,0,0,0.4)', border:'1px solid rgba(244,63,94,0.4)', color:'#fb7185' }}/>
              <span className="text-sm" style={{ color:'var(--foreground-3)' }}>% · {defaulters.length} letters</span>
            </div>

            {/* Cards */}
            {defaulters.length === 0 ? (
              <div className="text-center py-16" style={{ color:'var(--foreground-3)' }}>
                <AlertTriangle size={36} className="mx-auto mb-3 opacity-30"/>
                <p className="font-semibold">No defaulters below {threshold}%</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {defaulters.map(s => (
                  <div key={s.prn}
                    className="card p-4 flex flex-col gap-3 hover:scale-[1.02] transition-all duration-300 hover:shadow-card-hover fade-in-up"
                    style={{ borderColor: s.overallAtt < 50 ? 'rgba(244,63,94,0.3)' : 'rgba(245,158,11,0.3)' }}>
                    <div>
                      <p className="font-bold text-sm" style={{ color:'var(--foreground)' }}>{s.name}</p>
                      <p className="text-xs font-mono mt-0.5" style={{ color:'var(--foreground-3)' }}>{s.prn}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-xs font-medium" style={{ background:'var(--surface-2)', color:'var(--foreground-2)' }}>TH: {s.overallTH.toFixed(1)}%</span>
                      <span className="px-2 py-0.5 rounded-md text-xs font-medium" style={{ background:'var(--surface-2)', color:'var(--foreground-2)' }}>PR: {s.overallPR.toFixed(1)}%</span>
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold"
                        style={s.overallAtt < 50
                          ? { background:'rgba(244,63,94,0.15)', color:'#fb7185' }
                          : { background:'rgba(245,158,11,0.15)', color:'#fbbf24' }}>
                        {s.overallAtt.toFixed(1)}%
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {s.subjects.slice(0,3).map(sub => (
                        <div key={sub.name} className="flex justify-between text-xs">
                          <span className="truncate max-w-[140px]" style={{ color:'var(--foreground-3)' }}>{sub.name.replace(/[-_](TH|PR)$/i,'')}</span>
                          <span className="font-semibold" style={{ color: sub.value < 75 ? '#fb7185' : '#34d399' }}>{sub.value}%</span>
                        </div>
                      ))}
                      {s.subjects.length > 3 && <p className="text-xs" style={{ color:'var(--foreground-3)' }}>+{s.subjects.length-3} more</p>}
                    </div>
                    <button onClick={() => openLetter(s, cfg)}
                      className="mt-auto flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-white transition-all duration-200 hover:scale-[1.02]"
                      style={{ background:'linear-gradient(135deg,#6366f1,#4f46e5)', boxShadow:'0 4px 15px rgba(99,102,241,0.3)' }}>
                      <Printer size={13}/> Open Letter
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
