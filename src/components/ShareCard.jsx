import React from 'react';

// The card that is rendered to a PNG for sharing. It uses fixed colours rather than the theme tokens so the
// image looks the same in light and dark mode.
const PAPER = '#f5f8f9';
const INK = '#151c27';
const MUTED = '#4a5563';
const ACCENT = '#164e5c';
const RULE = '#cfd6dc';

const ShareCard = ({ resultData }) => {
  if (!resultData) return null;

  const row = { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, borderTop: `1px solid ${RULE}`, padding: '10px 0' };

  return (
    <div className="p-8" style={{ background: PAPER, color: INK, border: `1px solid ${RULE}` }}>
      <p className="fig text-xl font-semibold">Mine levetidsresultater</p>

      <p className="fig mt-6 text-7xl leading-none font-semibold" style={{ color: ACCENT }}>
        {resultData.remainingYears}
      </p>
      <p className="mt-1 text-lg" style={{ color: MUTED }}>år tilbage, statistisk set</p>

      <div className="mt-6">
        <div style={row}>
          <span style={{ color: MUTED }}>Forventet alder</span>
          <span className="fig text-xl font-semibold">{resultData.adjustedLifeExpectancy}</span>
        </div>
        <div style={row}>
          <span style={{ color: MUTED }}>Dage tilbage</span>
          <span className="fig text-xl font-semibold">{resultData.remainingDays}</span>
        </div>
        {resultData.lifestyleImpact !== 0 && (
          <div style={row}>
            <span style={{ color: MUTED }}>Livsstilspåvirkning</span>
            <span className="fig text-xl font-semibold">
              {resultData.lifestyleImpact > 0 ? '+' : ''}
              {resultData.lifestyleImpact} år
            </span>
          </div>
        )}
      </div>

      <p className="mt-6 text-sm" style={{ color: MUTED }}>
        Beregn din egen levetid på <span className="font-semibold" style={{ color: INK }}>levetidsberegner.dk</span>
      </p>
    </div>
  );
};

export default ShareCard;
