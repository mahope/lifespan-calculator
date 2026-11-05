import React from 'react';
import { formatYears } from '../utils/lifespanMath';
import { PROJECTION_LABELS } from '../utils/projectionLabels';

// Result header: switches the headline between the period figure (default) and
// the projected one, and shows the other figure as a second line. Rendered only
// when a projected figure exists (entered age under 70). State lives in the page.
// Uses the same segmented control as the form; e2e/projection.e2e.js measures the text contrast
// in both themes and both states (including the active button) and fails below 4.5.
const ProjectionToggle = ({ resultData, onChange }) => {
  if (!resultData?.projectionAvailable) return null;
  const { projection, periodRemainingYears, projectedRemainingYears } = resultData;

  return (
    <div className="mt-6 max-w-xl space-y-3">
      <div role="group" aria-label="Beregningsgrundlag for din resterende tid" className="segmented max-w-full">
        {Object.entries(PROJECTION_LABELS).map(([key, label]) => {
          const active = projection === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(key)}
              className={`mode-btn text-sm sm:text-base ${active ? 'active' : ''}`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <p className="text-[0.9375rem] text-muted-foreground" data-testid="projection-second-line">
        {projection === 'period' ? (
          <>
            Hvis dødeligheden fortsætter med at falde som Danmarks Statistik forventer:{' '}
            <strong className="fig text-foreground">ca.&nbsp;{formatYears(Number(projectedRemainingYears))}&nbsp;år</strong>
          </>
        ) : (
          <>
            Hvis dødeligheden forbliver som i dag:{' '}
            <strong className="fig text-foreground">ca.&nbsp;{formatYears(Number(periodRemainingYears))}&nbsp;år</strong>
          </>
        )}
      </p>
    </div>
  );
};

export default ProjectionToggle;
