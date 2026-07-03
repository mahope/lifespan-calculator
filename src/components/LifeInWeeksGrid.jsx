import React, { useRef, useEffect, useState, useCallback } from 'react';

const WEEKS_PER_YEAR = 52;

// Resolve an HSL design token (e.g. "221 83% 53%") to a canvas-usable color string.
// Falls back gracefully during SSR / if the variable is missing.
function tokenColor(name, alpha = 1) {
  if (typeof window === 'undefined') return '#000';
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!raw) return alpha < 1 ? `rgba(100,116,139,${alpha})` : '#64748b';
  return alpha < 1 ? `hsl(${raw} / ${alpha})` : `hsl(${raw})`;
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * "Dit liv i uger" — every week of a ~90-year life as one dot.
 * Weeks lived are filled, the weeks up to your statistical life expectancy are
 * muted, and anything beyond that is faint "bonus" time. Rendered on a canvas
 * (one <canvas> node instead of ~4,700 DOM elements) so it stays smooth on mobile.
 */
const LifeInWeeksGrid = ({ resultData }) => {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const geomRef = useRef({ cell: 0, gap: 0, rowH: 0 });
  const [hover, setHover] = useState(null);

  const daysLived = resultData?.daysLived || 0;
  const expectancy = parseFloat(resultData?.adjustedLifeExpectancy) || 0;

  const weeksLived = Math.max(0, Math.floor(daysLived / 7));
  const expectedWeeks = Math.round(expectancy * WEEKS_PER_YEAR);
  const totalYears = Math.max(90, Math.ceil(expectancy));
  const totalWeeks = totalYears * WEEKS_PER_YEAR;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const dpr = window.devicePixelRatio || 1;
    const cssWidth = wrap.clientWidth;
    if (cssWidth === 0) return;

    const gap = cssWidth > 480 ? 3 : 2;
    const cell = (cssWidth - gap * (WEEKS_PER_YEAR - 1)) / WEEKS_PER_YEAR;
    const rowH = cell + gap;
    const cssHeight = totalYears * rowH - gap;
    geomRef.current = { cell, gap, rowH };

    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const livedColor = tokenColor('--primary');
    const remainingColor = tokenColor('--muted-foreground', 0.38);
    const bonusColor = tokenColor('--muted-foreground', 0.12);
    const nowStroke = tokenColor('--foreground');
    const radius = Math.max(1, cell * 0.2);

    for (let i = 0; i < totalWeeks; i++) {
      const col = i % WEEKS_PER_YEAR;
      const row = Math.floor(i / WEEKS_PER_YEAR);
      const x = col * (cell + gap);
      const y = row * rowH;

      if (i < weeksLived) ctx.fillStyle = livedColor;
      else if (i < expectedWeeks) ctx.fillStyle = remainingColor;
      else ctx.fillStyle = bonusColor;

      roundRectPath(ctx, x, y, cell, cell, radius);
      ctx.fill();
    }

    // Highlight the current week
    if (weeksLived < totalWeeks) {
      const col = weeksLived % WEEKS_PER_YEAR;
      const row = Math.floor(weeksLived / WEEKS_PER_YEAR);
      const x = col * (cell + gap);
      const y = row * rowH;
      ctx.strokeStyle = nowStroke;
      ctx.lineWidth = Math.max(1, cell * 0.16);
      roundRectPath(ctx, x, y, cell, cell, radius);
      ctx.stroke();
    }
  }, [totalWeeks, totalYears, weeksLived, expectedWeeks]);

  // Redraw on data change, container resize, and theme (light/dark) change.
  useEffect(() => {
    draw();
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    const ro = new ResizeObserver(() => draw());
    ro.observe(wrap);

    const mo = new MutationObserver(() => draw());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, [draw]);

  const handleMove = (e) => {
    const wrap = wrapRef.current;
    const { cell, gap, rowH } = geomRef.current;
    if (!wrap || !cell) return;
    const rect = wrap.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / (cell + gap));
    const row = Math.floor(y / rowH);
    if (col < 0 || col >= WEEKS_PER_YEAR || row < 0) {
      setHover(null);
      return;
    }
    const index = row * WEEKS_PER_YEAR + col;
    if (index >= totalWeeks) {
      setHover(null);
      return;
    }
    setHover({ age: row, week: col + 1, lived: index < weeksLived });
  };

  if (!resultData) return null;

  const livedYears = Math.floor(weeksLived / WEEKS_PER_YEAR);

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold">🗓️ Dit liv i uger</h3>
        <p className="card-description">
          Hver firkant er én uge. Du har levet ca. {weeksLived.toLocaleString('da-DK')} uger
          ({livedYears} år) — statistisk venter der dig ca.{' '}
          {Math.max(0, expectedWeeks - weeksLived).toLocaleString('da-DK')} uger endnu.
        </p>
      </div>
      <div className="card-content space-y-4">
        <div
          ref={wrapRef}
          className="w-full"
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
        >
          <canvas ref={canvasRef} className="w-full" role="img" aria-label="Dit liv visualiseret som uger" />
        </div>

        <div className="min-h-[1.25rem] text-center text-sm text-muted-foreground" aria-live="polite">
          {hover
            ? `Alder ${hover.age} år · uge ${hover.week} — ${hover.lived ? 'levet' : 'endnu ikke levet'}`
            : 'Hold musen over en firkant for at se alderen'}
        </div>

        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-[3px] bg-primary" /> Uger levet
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-[3px] bg-muted-foreground/40" /> Forventede uger tilbage
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-[3px] bg-muted-foreground/15" /> Bonus-uger
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-[3px] border-2 border-foreground" /> Nu
          </span>
        </div>
      </div>
    </div>
  );
};

export default LifeInWeeksGrid;
