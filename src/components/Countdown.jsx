import { useEffect, useState } from 'react';
import { breakdownRemaining } from '../utils/lifespanMath';

// Owns the 1 Hz tick so that only these five tiles re-render each second, not the
// whole result page. Counts against the exact end instant of the calculation.
const Countdown = ({ endTimestamp }) => {
  const [remaining, setRemaining] = useState(() => breakdownRemaining(endTimestamp - Date.now()));

  useEffect(() => {
    const tick = () => setRemaining(breakdownRemaining(endTimestamp - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
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
    <div className="flex flex-wrap justify-center gap-3 sm:gap-4" aria-hidden="true">
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
