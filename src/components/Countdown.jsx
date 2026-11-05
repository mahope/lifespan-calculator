import { useEffect, useState } from 'react';
import { breakdownRemaining } from '../utils/lifespanMath';

const EMPTY = { years: null, days: null, hours: null, minutes: null, seconds: null };

const compute = (endTimestamp) =>
  Number.isFinite(endTimestamp) ? breakdownRemaining(endTimestamp - Date.now()) : EMPTY;

// Owns the 1 Hz tick so that only these five tiles re-render each second, not the
// whole result page. Counts against the exact end instant of the calculation.
// Render with key={endTimestamp} so a new calculation remounts with fresh state.
const Countdown = ({ endTimestamp }) => {
  const [remaining, setRemaining] = useState(() => compute(endTimestamp));

  useEffect(() => {
    const id = setInterval(() => setRemaining(compute(endTimestamp)), 1000);
    return () => clearInterval(id);
  }, [endTimestamp]);

  // `??`, not `||`: zero is a real value and must not render as "--".
  const tiles = [
    [remaining.years, 'år'],
    [remaining.days, 'dage'],
    [remaining.hours, 'timer'],
    [remaining.minutes, 'min'],
    [remaining.seconds, 'sek'],
  ];

  return (
    <div className="flex flex-wrap items-end gap-x-5 gap-y-4 sm:gap-x-9" aria-hidden="true">
      {tiles.map(([value, label]) => (
        <div className="time-unit" key={label}>
          <span className="time-value">{value ?? '--'}</span>
          <span className="time-label">{label}</span>
        </div>
      ))}
    </div>
  );
};

export default Countdown;
