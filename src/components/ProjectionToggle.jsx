import React from 'react';
import { PROJECTION_LABELS } from '../utils/projectionLabels';

// Result header: switches the headline between the period figure (default) and
// the projected one, and shows the other figure as a second line. Rendered only
// when a projected figure exists (entered age under 70). State lives in the page.
// The dark scrims keep the text at >= 4.5:1 on the gradient; e2e/projection.e2e.js measures
// it in both themes and both states (including the active white button) and fails below 4.5.
const ProjectionToggle = ({ resultData, onChange }) => {
  if (!resultData?.projectionAvailable) return null;
  const { projection, periodRemainingYears, projectedRemainingYears } = resultData;

  return (
    <div className="mt-6 space-y-3 text-center">
      <div
        role="group"
        aria-label="Beregningsgrundlag for din resterende tid"
        className="inline-flex max-w-full rounded-lg border border-white/50 bg-slate-950/40 p-1"
      >
        {Object.entries(PROJECTION_LABELS).map(([key, label]) => {
          const active = projection === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(key)}
              className={`min-h-[44px] rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700 sm:px-4 ${
                active ? 'bg-white text-blue-700 shadow-xs' : 'text-white hover:bg-white/10'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <p className="mx-auto max-w-xl rounded-md bg-slate-950/30 px-3 py-2 text-sm text-white" data-testid="projection-second-line">
        {projection === 'period' ? (
          <>
            Hvis dødeligheden fortsætter med at falde som Danmarks Statistik forventer:{' '}
            <strong className="text-white">ca.&nbsp;{projectedRemainingYears}&nbsp;år</strong>
          </>
        ) : (
          <>
            Hvis dødeligheden forbliver som i dag:{' '}
            <strong className="text-white">ca.&nbsp;{periodRemainingYears}&nbsp;år</strong>
          </>
        )}
      </p>
    </div>
  );
};

export default ProjectionToggle;
