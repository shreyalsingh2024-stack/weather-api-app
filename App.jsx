import { useState, useEffect } from 'react';
import Login from './components/Login';
import NewEntry from './components/NewEntry';
import History from './components/History';
import Charts from './components/Charts';
import Insights from './components/Insights';
import { getUser, clearUser, getEntries } from './storage';

const TABS = [
  { id: 'write', label: 'Write', icon: '✦' },
  { id: 'journal', label: 'Journal', icon: '📖' },
  { id: 'insights', label: 'Insights', icon: '📊' },
  { id: 'ai', label: 'AI', icon: '🧠' },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [tab, setTab] = useState('write');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getUser();
    if (u) setUser(u);
    setEntries(getEntries());
    setLoading(false);
  }, []);

  function handleLogin(u) {
    setUser(u);
    setEntries(getEntries());
  }

  function handleEntrySaved(entry) {
    setEntries(getEntries());
    setTab('journal');
  }

  function handleEntryDeleted() {
    setEntries(getEntries());
  }

  function handleLogout() {
    clearUser();
    setUser(null);
    setEntries([]);
    setTab('write');
  }

  if (loading) return null;
  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      {/* Header */}
      <header style={{
        padding: '16px 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>🧠</span>
          <span style={{ fontFamily: 'DM Serif Display', fontSize: '1.1rem', color: 'var(--text)' }}>MindMap</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text3)' }}>Hi, {user.name}</span>
          <button
            onClick={handleLogout}
            style={{
              padding: '4px 10px', background: 'none', border: '1px solid var(--border)',
              color: 'var(--text3)', borderRadius: 'var(--radius-sm)', fontSize: '12px'
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        {tab === 'write' && <NewEntry user={user} onSaved={handleEntrySaved} />}
        {tab === 'journal' && <History entries={entries} onDelete={handleEntryDeleted} />}
        {tab === 'insights' && <Charts entries={entries} />}
        {tab === 'ai' && <Insights entries={entries} user={user} />}
      </main>

      {/* Bottom nav */}
      <nav style={{
        borderTop: '1px solid var(--border)', background: 'var(--bg)',
        display: 'grid', gridTemplateColumns: 'repeat(4,1fr)'
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '12px 8px', background: 'none', display: 'flex',
              flexDirection: 'column', alignItems: 'center', gap: '3px',
              color: tab === t.id ? 'var(--purple)' : 'var(--text3)',
              borderTop: tab === t.id ? '2px solid var(--purple)' : '2px solid transparent',
              transition: 'color 0.15s'
            }}
          >
            <span style={{ fontSize: '16px' }}>{t.icon}</span>
            <span style={{ fontSize: '11px', fontWeight: tab === t.id ? 500 : 400 }}>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
