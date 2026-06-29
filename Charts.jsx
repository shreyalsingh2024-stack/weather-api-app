import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Tooltip, Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { format, subDays, isSameDay } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Filler);

function moodToColor(mood) {
  if (mood >= 7) return '#34d399';
  if (mood >= 4) return '#fbbf24';
  return '#f87171';
}

export default function Charts({ entries }) {
  if (!entries.length) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
        <h3 style={{ fontSize: '1.2rem', color: 'var(--text)', marginBottom: '8px' }}>No data yet</h3>
        <p style={{ color: 'var(--text3)', fontSize: '13px' }}>
          Add at least 3 entries to see your mood patterns
        </p>
      </div>
    );
  }

  const analyzedEntries = entries.filter(e => e.analysis?.mood);

  // Last 14 days mood line
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = subDays(new Date(), 13 - i);
    const match = analyzedEntries.find(e => isSameDay(new Date(e.createdAt), d));
    return { date: d, mood: match?.analysis?.mood ?? null, label: format(d, 'd MMM') };
  });

  const lineData = {
    labels: last14.map(d => d.label),
    datasets: [{
      data: last14.map(d => d.mood),
      borderColor: '#a78bfa',
      backgroundColor: 'rgba(167,139,250,0.08)',
      borderWidth: 2,
      pointBackgroundColor: last14.map(d => d.mood ? moodToColor(d.mood) : 'transparent'),
      pointBorderColor: last14.map(d => d.mood ? moodToColor(d.mood) : 'transparent'),
      pointRadius: last14.map(d => d.mood ? 5 : 0),
      pointHoverRadius: 7,
      fill: true,
      tension: 0.4,
      spanGaps: true,
    }]
  };

  const lineOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: {
      backgroundColor: '#1a1e28', titleColor: '#8b90a0', bodyColor: '#e8eaf0',
      padding: 10, cornerRadius: 8, displayColors: false,
      callbacks: { title: items => items[0].label, label: item => item.raw ? `Mood: ${item.raw}/10` : 'No entry' }
    }},
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#555a6a', font: { size: 11 } } },
      y: { min: 0, max: 10, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#555a6a', font: { size: 11 }, stepSize: 2 } }
    }
  };

  // Emotion frequency
  const emotionCount = {};
  analyzedEntries.forEach(e => {
    const em = e.analysis.primary_emotion;
    if (em) emotionCount[em] = (emotionCount[em] || 0) + 1;
  });
  const topEmotions = Object.entries(emotionCount).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const barData = {
    labels: topEmotions.map(([e]) => e),
    datasets: [{
      data: topEmotions.map(([, c]) => c),
      backgroundColor: ['#a78bfa', '#f472b6', '#34d399', '#fbbf24', '#60a5fa', '#f87171'].slice(0, topEmotions.length),
      borderRadius: 6,
    }]
  };

  const barOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: {
      backgroundColor: '#1a1e28', bodyColor: '#e8eaf0', padding: 10, cornerRadius: 8,
      displayColors: false, callbacks: { label: item => `${item.raw} ${item.raw === 1 ? 'entry' : 'entries'}` }
    }},
    scales: {
      x: { grid: { display: false }, ticks: { color: '#8b90a0', font: { size: 12 }, textTransform: 'capitalize' } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#555a6a', font: { size: 11 }, stepSize: 1 } }
    }
  };

  // Day of week heatmap
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayMoods = Array(7).fill(null).map(() => []);
  analyzedEntries.forEach(e => {
    const day = new Date(e.createdAt).getDay();
    dayMoods[day].push(e.analysis.mood);
  });
  const dayAvg = dayMoods.map(moods =>
    moods.length ? Math.round(moods.reduce((a, b) => a + b, 0) / moods.length * 10) / 10 : null
  );

  // Stats
  const moods = analyzedEntries.map(e => e.analysis.mood);
  const avg = moods.length ? (moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(1) : '--';
  const streak = (() => {
    let s = 0;
    for (let i = 0; i < 30; i++) {
      const d = subDays(new Date(), i);
      if (analyzedEntries.some(e => isSameDay(new Date(e.createdAt), d))) s++;
      else break;
    }
    return s;
  })();

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--text)', marginBottom: '4px' }}>Insights</h2>
        <p style={{ color: 'var(--text3)', fontSize: '13px' }}>Your emotional patterns at a glance</p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Avg mood', value: avg, unit: '/10' },
          { label: 'Entries', value: analyzedEntries.length, unit: '' },
          { label: 'Day streak', value: streak, unit: '' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '14px 16px'
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              {s.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
              <span style={{ fontSize: '24px', fontFamily: 'DM Serif Display', color: 'var(--purple)' }}>{s.value}</span>
              {s.unit && <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{s.unit}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Mood over time */}
      {analyzedEntries.length >= 2 && (
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '16px', marginBottom: '16px'
        }}>
          <h3 style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '14px', fontFamily: 'Inter', fontWeight: 500 }}>
            Mood — last 14 days
          </h3>
          <div style={{ height: 160 }}>
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>
      )}

      {/* Emotion frequency */}
      {topEmotions.length >= 2 && (
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '16px', marginBottom: '16px'
        }}>
          <h3 style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '14px', fontFamily: 'Inter', fontWeight: 500 }}>
            Emotions frequency
          </h3>
          <div style={{ height: 140 }}>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      )}

      {/* Day of week heatmap */}
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '16px'
      }}>
        <h3 style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '14px', fontFamily: 'Inter', fontWeight: 500 }}>
          Average mood by day of week
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '6px' }}>
          {dayNames.map((day, i) => {
            const val = dayAvg[i];
            const color = val ? moodToColor(val) : 'var(--bg3)';
            return (
              <div key={day} style={{ textAlign: 'center' }}>
                <div style={{
                  height: 48, borderRadius: 'var(--radius-sm)',
                  background: val ? `${color}25` : 'var(--bg3)',
                  border: `1px solid ${val ? color + '40' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontFamily: 'DM Serif Display',
                  color: val ? color : 'var(--text3)', marginBottom: '4px'
                }}>
                  {val ?? '–'}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{day}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
