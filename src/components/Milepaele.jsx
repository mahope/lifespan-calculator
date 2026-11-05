import React from 'react';
import SectionHeader from './SectionHeader';
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
      <SectionHeader
        title="Dine næste milepæle"
        description="Runde tal er tættere på, end du tror."
      />
      <div className="card-content">
        <ul className="divide-y">
          {milestones.map((m) => (
            <li key={m.day} className="flex items-baseline gap-4 py-3 first:pt-0">
              <div className="min-w-0 flex-1">
                <div className="font-medium">{m.label}</div>
                <div className="text-sm text-muted-foreground">ca. {dateFor(m.daysUntil)}</div>
              </div>
              <div className="shrink-0 text-right">
                <span className="fig text-xl font-semibold">{m.daysUntil.toLocaleString('da-DK')}</span>{' '}
                <span className="text-sm text-muted-foreground">dage</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Milepaele;
