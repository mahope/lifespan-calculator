import React, { useLayoutEffect, useRef, useState } from 'react';
import { survivalProbability } from '../utils/lifeTableDK';
import { formatPct } from '../utils/formatPct';

const MARGIN = { top: 28, right: 14, bottom: 30, left: 46 };
const Y_TICKS = [0, 25, 50, 75, 100];

// Share of people of the user's age and sex who are still alive at each later age, straight from the
// Danish survivors table (population baseline, not adjusted for lifestyle). The dashed line marks the
// user's own expected age. Drawn at the measured size so the labels stay at a readable pixel size.
const Overlevelseskurve = ({ age, gender, expectedAge }) => {
  const wrapRef = useRef(null);
  const [size, setSize] = useState({ w: 640, h: 320 });
  const [hoverAge, setHoverAge] = useState(null);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0) setSize({ w: Math.round(r.width), h: Math.round(r.height) });
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const maxAge = 100;
  if (!Number.isFinite(age) || age >= maxAge - 1) return null;

  const { w, h } = size;
  const innerW = w - MARGIN.left - MARGIN.right;
  const innerH = h - MARGIN.top - MARGIN.bottom;
  const x = (a) => MARGIN.left + ((a - age) / (maxAge - age)) * innerW;
  const y = (pct) => MARGIN.top + (1 - pct / 100) * innerH;
  const pctAt = (a) => survivalProbability(age, a, gender) * 100;

  const ages = [age];
  for (let a = Math.floor(age) + 1; a <= maxAge; a++) ages.push(a);
  const pts = ages.map((a) => [x(a), y(pctAt(a))]);
  const line = pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`).join('')
  const area = `${line}L${x(maxAge).toFixed(1)} ${y(0)}L${x(age).toFixed(1)} ${y(0)}Z`;

  const xTicks = [];
  for (let a = Math.ceil((age + 1) / 10) * 10; a <= maxAge; a += 10) {
    if (x(a) - x(age) > 76) xTicks.push(a);
  }

  const marks = [80, 90].filter((a) => a > age);
  const expected = Number.isFinite(expectedAge) ? Math.min(Math.max(expectedAge, age), maxAge) : null;
  const expectedLeft = expected !== null && x(expected) > MARGIN.left + innerW * 0.62;

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const a = age + ((e.clientX - rect.left - MARGIN.left) / innerW) * (maxAge - age);
    setHoverAge(Math.min(maxAge, Math.max(Math.ceil(age), Math.round(a))));
  };

  const sexLabel = gender === 'female' ? 'kvinder' : 'mænd';
  const readout =
    hoverAge === null
      ? `Andel af ${sexLabel} på ${Math.floor(age)} år, der er i live ved hver alder.`
      : `Ved ${hoverAge} år er ${formatPct(pctAt(hoverAge))} stadig i live.`;

  return (
    <figure className="m-0">
      <div ref={wrapRef} className="h-64 w-full sm:h-80">
        <svg
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          role="img"
          aria-label={`Kurve over andelen af ${sexLabel} på ${Math.floor(age)} år, der er i live ved hver alder frem til 100 år. Værdierne står i tabellen herunder.`}
          className="block touch-pan-y select-none"
          onPointerMove={onMove}
          onPointerLeave={() => setHoverAge(null)}
        >
          {Y_TICKS.map((t) => (
            <g key={t}>
              <line x1={MARGIN.left} x2={w - MARGIN.right} y1={y(t)} y2={y(t)} stroke="hsl(var(--border))" strokeWidth="1" />
              <text x={MARGIN.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize="12" className="fill-muted-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {t}%
              </text>
            </g>
          ))}

          <path d={area} fill="hsl(var(--primary) / 0.12)" />
          <path d={line} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinejoin="round" />

          <text x={x(age)} y={h - 8} textAnchor="start" fontSize="12" fontWeight="600" className="fill-foreground">
            Nu, {Math.floor(age)} år
          </text>
          {xTicks.map((a) => (
            <text key={a} x={x(a)} y={h - 8} textAnchor="middle" fontSize="12" className="fill-muted-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {a}
            </text>
          ))}

          {expected !== null && (
            <g>
              <line x1={x(expected)} x2={x(expected)} y1={MARGIN.top - 6} y2={y(0)} stroke="hsl(var(--foreground))" strokeWidth="1.5" strokeDasharray="4 3" />
              <text
                x={x(expected) + (expectedLeft ? -6 : 6)}
                y={MARGIN.top - 12}
                textAnchor={expectedLeft ? 'end' : 'start'}
                fontSize="12"
                fontWeight="600"
                className="fill-foreground"
              >
                Forventet alder {expected.toFixed(1)}
              </text>
            </g>
          )}

          {marks.map((a) => {
            const narrow = w < 520;
            const flip =
              x(a) + 6 + 84 > w - MARGIN.right ||
              (expected !== null && x(expected) > x(a) && x(expected) < x(a) + 6 + 84);
            return (
              <g key={a}>
                <line x1={x(a)} x2={x(a)} y1={y(pctAt(a))} y2={y(0)} stroke="hsl(var(--foreground) / 0.35)" strokeWidth="1" />
                <circle cx={x(a)} cy={y(pctAt(a))} r="4.5" fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth="2" />
                {narrow ? (
                  <text x={x(a) + 8} y={y(pctAt(a)) - 8} fontSize="13" fontWeight="600" className="fill-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {formatPct(pctAt(a))}
                  </text>
                ) : (
                  <text
                    x={x(a) + (flip ? -6 : 6)}
                    y={y(0) - 8}
                    textAnchor={flip ? 'end' : 'start'}
                    fontSize="13"
                    fontWeight="600"
                    className="fill-foreground"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {a} år: {formatPct(pctAt(a))}
                  </text>
                )}
              </g>
            );
          })}

          {hoverAge !== null && (
            <g pointerEvents="none">
              <line x1={x(hoverAge)} x2={x(hoverAge)} y1={MARGIN.top} y2={y(0)} stroke="hsl(var(--foreground))" strokeWidth="1" />
              <circle cx={x(hoverAge)} cy={y(pctAt(hoverAge))} r="4.5" fill="hsl(var(--foreground))" stroke="hsl(var(--background))" strokeWidth="2" />
            </g>
          )}
        </svg>
      </div>
      <figcaption className="mt-2 min-h-6 text-sm text-muted-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {readout}
      </figcaption>
    </figure>
  );
};

export default Overlevelseskurve;
