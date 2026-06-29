import { useState } from 'react';
import { setUser, generateId } from '../storage';

export default function Login({ onLogin }) {
  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [step, setStep] = useState(1);

  function handleNext() {
    if (step === 1 && name.trim()) setStep(2);
  }

  function handleStart() {
    if (!apiKey.trim()) return;
    const user = { id: generateId(), name: name.trim(), apiKey: apiKey.trim(), createdAt: Date.now() };
    setUser(user);
    onLogin(user);
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', background: 'var(--bg)'
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--purple-bg), var(--pink-bg))',
            border: '1px solid var(--border2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem', fontSize: 24
          }}>🧠</div>
          <h1 style={{ fontSize: '2rem', color: 'var(--text)', marginBottom: '0.5rem' }}>MindMap</h1>
          <p style={{ color: 'var(--text2)', fontSize: '14px' }}>Your AI-powered emotional journal</p>
        </div>

        {step === 1 && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                What should we call you?
              </label>
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleNext()}
                placeholder="Your name"
                style={{
                  width: '100%', padding: '12px 16px', background: 'var(--bg2)',
                  border: '1px solid var(--border2)', borderRadius: 'var(--radius)',
                  color: 'var(--text)', fontSize: '15px'
                }}
              />
            </div>
            <button
              onClick={handleNext}
              disabled={!name.trim()}
              style={{
                width: '100%', padding: '13px', background: 'var(--purple)',
                color: '#0d0f14', borderRadius: 'var(--radius)', fontSize: '14px',
                fontWeight: 600, opacity: name.trim() ? 1 : 0.4
              }}
            >Continue →</button>
          </div>
        )}

        {step === 2 && (
          <div>
            <p style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '1.5rem', lineHeight: 1.7 }}>
              Hey <strong style={{ color: 'var(--text)' }}>{name}</strong>! MindMap uses Groq AI (free) to analyze your journal entries.
              Paste your Groq API key below — it stays in your browser only.
            </p>

            <div style={{
              background: 'var(--teal-bg)', border: '1px solid rgba(52,211,153,0.2)',
              borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: '16px',
              fontSize: '12px', color: 'var(--teal)', lineHeight: 1.6
            }}>
              ✦ Free at <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" style={{ color: 'var(--teal)', fontWeight: 600 }}>console.groq.com/keys</a> → Sign in with Google → Get API Key → Copy it here
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Groq API Key
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  autoFocus
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleStart()}
                  placeholder="gsk_..."
                  style={{
                    width: '100%', padding: '12px 48px 12px 16px', background: 'var(--bg2)',
                    border: '1px solid var(--border2)', borderRadius: 'var(--radius)',
                    color: 'var(--text)', fontSize: '14px', fontFamily: 'monospace'
                  }}
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', color: 'var(--text3)', fontSize: '16px', padding: '4px'
                  }}
                >{showKey ? '🙈' : '👁'}</button>
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={!apiKey.trim()}
              style={{
                width: '100%', padding: '13px', background: 'var(--purple)',
                color: '#0d0f14', borderRadius: 'var(--radius)', fontSize: '14px',
                fontWeight: 600, opacity: apiKey.trim() ? 1 : 0.4
              }}
            >Start journaling</button>
            <button
              onClick={() => setStep(1)}
              style={{ width: '100%', marginTop: '10px', padding: '10px', background: 'none', color: 'var(--text3)', fontSize: '13px' }}
            >← Back</button>
          </div>
        )}
      </div>
    </div>
  );
}
