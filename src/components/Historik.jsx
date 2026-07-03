import React, { useEffect, useState } from 'react';
import { LineChart } from 'lucide-react';
import SectionHeader from './SectionHeader';
import { loadHistory } from '../utils/history';

// "Din historik" — shows how the user's estimate has moved across past visits
// (localStorage only). Hidden until there are at least two saved calculations.
const Historik = ({ resultData }) => {
  const [history, setHistory] = useState([]);

  // Depend on endTimestamp (stable across countdown ticks, which only replace
  // `countdown`) so history is re-read on a genuinely new calculation, not every second.
  useEffect(() => {
    setHistory(loadHistory());
  }, [resultData?.endTimestamp]);

  if (history.length < 2) return null;

  const first = history[0];
  const last = history[history.length - 1];
  const delta = parseFloat(last.expected) - parseFloat(first.expected);
  const fmtDate = (ts) =>
    new Date(ts).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' });

  const trend =
    delta >= 0.05
      ? `Dit estimat er steget ${delta.toFixed(1)} år siden din første beregning 🎉`
      : delta <= -0.05
        ? `Dit estimat er faldet ${Math.abs(delta).toFixed(1)} år siden din første beregning`
        : 'Dit estimat er stort set uændret';

  return (
    <div className="card">
      <SectionHeader
        icon={LineChart}
        title="Din historik"
        description={`Sådan har dit estimat udviklet sig (${history.length} beregninger, gemt lokalt).`}
      />
      <div className="card-content space-y-2">
        {history.slice(-6).map((h) => (
          <div
            key={h.ts}
            className="flex items-center justify-between border-b border-border/40 pb-1 text-sm last:border-0"
          >
            <span className="text-muted-foreground">{fmtDate(h.ts)}</span>
            <span className="font-medium">
              {h.expected} år{Number.isFinite(h.age) ? ` (som ${h.age}-årig)` : ''}
            </span>
          </div>
        ))}
        <p className="pt-1 text-center text-sm font-medium">{trend}</p>
      </div>
    </div>
  );
};

export default Historik;
