import React, { useId, useRef } from 'react';

const formatYears = (value = 0) => `${value > 0 ? `+${value}` : value} år`;

/**
 * One lifestyle question rendered as a radio group: `role=radiogroup` with
 * `role=radio` options, `aria-checked`, and a roving tabindex so the group is
 * one Tab stop and the arrow keys (plus Home/End) move and select.
 */
const LifestyleFactor = ({ factor, value, onSelect }) => {
  const labelId = useId();
  const optionRefs = useRef([]);
  const { icon, label, options } = factor;

  const checkedIndex = options.findIndex((o) => o.value === value);
  // With no option checked (e.g. the neutral default has no button) the first
  // option stays reachable by Tab.
  const tabStop = checkedIndex === -1 ? 0 : checkedIndex;

  const move = (index) => {
    const next = (index + options.length) % options.length;
    onSelect(factor.key, options[next].value);
    optionRefs.current[next]?.focus();
  };

  const handleKeyDown = (e, index) => {
    // Browser shortcuts (Alt+ArrowLeft = back, Ctrl+Home = top) are not ours to swallow.
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        move(index + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        move(index - 1);
        break;
      case 'Home':
        e.preventDefault();
        move(0);
        break;
      case 'End':
        e.preventDefault();
        move(options.length - 1);
        break;
      default:
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">{icon}</span>
          <span id={labelId} className="font-medium">{label}</span>
        </div>
        <span className="text-sm font-medium">{formatYears(value)}</span>
      </div>
      <div role="radiogroup" aria-labelledby={labelId} className="flex flex-wrap gap-2">
        {options.map((option, index) => {
          const checked = index === checkedIndex;
          return (
            <button
              key={option.value}
              ref={(el) => { optionRefs.current[index] = el; }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={index === tabStop ? 0 : -1}
              className={`factor-btn ${checked ? 'active' : ''}`}
              onClick={() => onSelect(factor.key, option.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LifestyleFactor;
