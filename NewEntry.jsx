import { useState } from 'react';
import { analyzeEntry } from '../claude';
import { saveEntry, generateId } from '../storage';

const PROMPTS = [
  "What's on your mind today?",
  "How are you feeling right now?",
  "What happened today that stayed with you?",
  "What are you grateful for today?",
  "What's been weighing on you lately?",
];

export default function NewEntry({ user, onSaved }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const prompt = PROMPTS[new Date().getDay() % PROMPTS.length];

  async function handleAnalyze() {
    if (text.trim().length < 20) { setError('Write a bit more — at least a sentence or two.'); return; }
    setError(''); setLoading(true);
    try {
      const analysis = await analyzeEntry(text, user.apiKey);
      setResult(analysis);
    } catch (e) {
      setError('Error: ' + (e.message || 'Unknown error'));
    } finally { setLoading(false); }
  }

  function handleSave() {
    const entry = { id: generateId(), text: text.trim(), analysis: result, createdAt: Date.now() };
    saveEntry(entry);
    onSaved(entry);
    setText(''); setResult(null);
  }

  const moodColor = result ? (result.mood >= 7 ? 'var(--teal)' : result.mood >= 4 ? 'var(--amber)' : 'var(--red)') : 'var(--purple)';

  const emotionEmoji = {
    anxious:'😰',content:'😌',overwhelmed:'😵',hopeful:'🌱',frustrated:'😤',
    grateful:'🙏',lonely:'🫂',excited:'✨',sad:'😢',happy:'😊',angry:'😠',
    calm:'🧘',reflective:'🤔',tired:'😴',energetic:'⚡',worried:'😟',proud:'🦁',melancholy:'🌧',
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--text)', marginBottom: '4px' }}>New entry</h2>
        <p style={{ color: 'var(--text3)', fontSize: '13px' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {!result ? (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: '16px' }}>
          <textarea
            autoFocus value={text} onChange={e => setText(e.target.value)}
            placeholder={prompt} rows={8}
            style={{ width: '100%', padding: '18px 20px', background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '15px', lineHeight: 1.8, resize: 'none' }}
          />
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{text.trim().split(/\s+/).filter(Boolean).length} words</span>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {error && <span style={{ fontSize: '12px', color: 'var(--red)' }}>{error}</span>}
              <button
                onClick={handleAnalyze} disabled={loading || !text.trim()}
                style={{
                  padding: '8px 18px', background: loading ? 'var(--bg3)' : 'var(--purple)',
                  color: loading ? 'var(--text2)' : '#0d0f14',
                  borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 600,
                  opacity: (!text.trim() && !loading) ? 0.4 : 1,
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                {loading ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> Analyzing…</> : '✦ Analyze'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ background: 'var(--bg2)', border: `1px solid ${moodColor}33`, borderRadius: 'var(--radius)', padding: '20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${moodColor}18`, border: `2px solid ${moodColor}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                {emotionEmoji[result.primary_emotion] || '🌀'}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '28px', fontFamily: 'DM Serif Display', color: moodColor }}>{result.mood}</span>
                  <span style={{ fontSize: '13px', color: 'var(--text3)' }}>/10</span>
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text2)', textTransform: 'capitalize' }}>
                  {result.primary_emotion}
                  {result.secondary_emotions?.length > 0 && <span style={{ color: 'var(--text3)', fontSize: '12px' }}>{' · '}{result.secondary_emotions.join(' · ')}</span>}
                </div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <div style={{
                  padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 500,
                  background: result.energy_level === 'high' ? 'var(--teal-bg)' : result.energy_level === 'low' ? 'var(--pink-bg)' : 'var(--amber-bg)',
                  color: result.energy_level === 'high' ? 'var(--teal)' : result.energy_level === 'low' ? 'var(--pink)' : 'var(--amber)',
                  textTransform: 'capitalize'
                }}>{result.energy_level} energy</div>
              </div>
            </div>

            <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden', marginBottom: '16px' }}>
              <div style={{ height: '100%', width: `${result.mood * 10}%`, background: moodColor, borderRadius: 2, transition: 'width 0.6s ease' }} />
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: '14px', paddingLeft: '12px', borderLeft: '2px solid var(--border2)' }}>
              {result.brief_reflection}
            </p>

            {result.triggers?.length > 0 && (
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>What I noticed</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {result.triggers.map((t, i) => (
                    <span key={i} style={{ padding: '3px 10px', background: 'var(--bg3)', borderRadius: '100px', fontSize: '12px', color: 'var(--text2)', border: '1px solid var(--border)' }}>{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text3)', lineHeight: 1.7 }}>{text}</p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleSave} style={{ flex: 1, padding: '12px', background: 'var(--purple)', color: '#0d0f14', borderRadius: 'var(--radius)', fontSize: '14px', fontWeight: 600 }}>Save entry</button>
            <button onClick={() => setResult(null)} style={{ padding: '12px 18px', background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--text2)', borderRadius: 'var(--radius)', fontSize: '14px' }}>Edit</button>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
