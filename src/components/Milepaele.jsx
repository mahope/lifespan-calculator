import React from 'react';
import { upcomingMilestones } from '../utils/lifespanMath';

// "Dine næste milepæle" — round-number life landmarks with a countdown of days
// and the calendar date each falls on. A fresh reason to come back.
const Milepaele = ({ resultData }) => {
  if (!resultData) return null;

  const daysLived = resultData.daysLived || 0;
  const milestones = upcomingMilestones(daysLived, 4);
  if (!milestones.length) return null;

  const dateFor = (daysUntil) => {
    const d = new Date();
    d.setDate(d.getDate() + daysUntil);
    return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold">🎯 Dine næste milepæle</h3>
        <p className="card-description">Runde tal er tættere på, end du tror.</p>
      </div>
      <div className="card-content">
        <ul className="divide-y divide-border/60">
          {milestones.map((m) => (
            <li key={m.day} className="flex items-center gap-3 py-3">
              <span className="text-2xl" aria-hidden="true">
                {m.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{m.label}</div>
                <div className="text-xs text-muted-foreground">ca. {dateFor(m.daysUntil)}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-primary">
                  {m.daysUntil.toLocaleString('da-DK')}
                </div>
                <div className="text-xs text-muted-foreground">dage</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Milepaele;
