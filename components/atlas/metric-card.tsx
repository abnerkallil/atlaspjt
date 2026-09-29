import type { ReactNode } from 'react';

export function MetricCard({ tone, icon, label, value, hint }: {
  tone: 'gold' | 'violet' | 'green'; icon: ReactNode; label: string; value: string; hint: string;
}) {
  return (
    <div className={`metric-card ${tone}`}>
      <div className="metric-icon">{icon}</div>
      <div><span>{label}</span><strong>{value}</strong><small>{hint}</small></div>
    </div>
  );
}
