import React, { useEffect, useState } from 'react';
import { LineChart } from 'lucide-react';
import SectionHeader from './SectionHeader';
import { loadHistory, clearHistory } from '../utils/history';

// "Din historik" — shows how the user's estimate has moved across past visits
// (localStorage only). Hidden until there are at least two saved calculations.
const Historik = ({ resultData }) => {
  const [history, setHistory] = useState([]);
  const [confirming, setConfirming] = useState(false);
  const [deleted, setDeleted] = useState(false);

  // Depend on endTimestamp (stable across countdown ticks, which only replace
  // `countdown`) so history is re-read on a genuinely new calculation, not every second.
  useEffect(() => {
    setHistory(loadHistory());
    setConfirming(false);
    setDeleted(false);
  }, [resultData?.endTimestamp]);

  const handleDelete = () => {
    clearHistory();
    setHistory([]);
    setConfirming(false);
    setDeleted(true);
  };

  // The live region stays mounted so the status is announced even though the
  // card itself disappears once the history is gone.
  const status = (
    <p role="status" aria-live="polite" className={deleted ? 'text-center text-sm text-muted-foreground' : 'sr-only'}>
      {deleted ? 'Historik slettet' : ''}
    </p>
  );

  if (history.length < 2) return status;

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
    <>
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
        <p className="text-center text-xs text-muted-foreground">
          Historikken gemmes kun i denne browser og forlader aldrig din enhed. Du kan slette den her.
        </p>
        <div className="flex justify-center gap-2 pt-1">
          {confirming ? (
            <>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-md border border-destructive px-3 py-1 text-sm font-medium text-destructive focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Ja, slet historik
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => setConfirming(false)}
                className="rounded-md border border-border px-3 py-1 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Annuller
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="rounded-md border border-border px-3 py-1 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Slet historik
            </button>
          )}
        </div>
      </div>
    </div>
    {status}
    </>
  );
};

export default Historik;
