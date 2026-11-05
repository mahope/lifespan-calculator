import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { track } from '../utils/analytics';

const partnerUrl = (bannerId) =>
  `https://www.partner-ads.com/dk/klikbanner.php?partnerid=42553&bannerid=${bannerId}&uid=levetidsberegner`;

const PLACEMENT = 'result-practical';

const OFFERS = [
  {
    program: 'jura-docs',
    bannerId: '99220',
    title: 'Testamente',
    text: 'Skriftlige ønsker gør det lettere for dem, der står tilbage. Jura-Docs har skabeloner til testamente.',
    cta: 'Se testamente-skabeloner hos Jura-Docs',
  },
  {
    program: 'dokument24',
    bannerId: '71629',
    title: 'Fremtidsfuldmagt',
    text: 'En fremtidsfuldmagt udpeger, hvem der kan handle for dig, hvis du ikke selv kan. Dokument 24 har skabeloner.',
    cta: 'Se fuldmagts-skabeloner hos Dokument 24',
  },
];

// Initial state only; the open state does not follow later resizes or rotation.
const isDesktop = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(min-width: 640px)').matches;

// Calm, clearly marked pointer to document templates. Collapsed by default on
// mobile. Events carry only the programme and placement, never user input.
const PraktiskePapirer = ({ resultData }) => {
  const [open, setOpen] = useState(isDesktop);
  const listRef = useRef(null);
  const firedFor = useRef(null);

  // One impression per programme per result, once the links are at least half visible.
  // The ref keeps collapsing and expanding again from firing a second time.
  useEffect(() => {
    const node = listRef.current;
    if (!resultData) {
      firedFor.current = null;
      return undefined;
    }
    if (!open || !node || firedFor.current === resultData || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.5)) {
          firedFor.current = resultData;
          OFFERS.forEach((o) => track('Affiliate Impression', { program: o.program, placement: PLACEMENT }));
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [resultData, open]);

  if (!resultData) return null;

  return (
    <div className="card">
      <div className="card-header">
        <p className="mb-2 inline-block border border-input px-2 py-0.5 text-sm text-muted-foreground">Annonce</p>
        <h3 className="fig text-2xl leading-tight font-semibold">Få styr på det praktiske</h3>
      </div>
      <div className="card-content space-y-3">
        <button
          type="button"
          className="flex min-h-11 w-full items-center justify-between gap-3 text-left font-medium"
          aria-expanded={open}
          aria-controls={open ? 'praktiske-papirer-indhold' : undefined}
          onClick={() => setOpen((v) => !v)}
        >
          <span>{open ? 'Skjul' : 'Vis'} skabeloner til testamente og fuldmagt</span>
          <ChevronDown
            size={18}
            aria-hidden="true"
            className={`shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {open && (
          <div id="praktiske-papirer-indhold" className="space-y-4">
            <p className="max-w-prose text-muted-foreground">
              Uanset hvor mange år du har tilbage, kan det være rart at have de praktiske papirer
              i orden.
            </p>
            <ul ref={listRef} className="grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2">
              {OFFERS.map((o) => (
                <li key={o.program} className="flex flex-col gap-2 border-t pt-4">
                  <h4 className="fig text-lg font-semibold">{o.title}</h4>
                  <p className="flex-1 text-[0.9375rem] text-muted-foreground">{o.text}</p>
                  <a
                    href={partnerUrl(o.bannerId)}
                    target="_blank"
                    rel="sponsored noopener noreferrer"
                    className="btn btn-secondary w-full"
                    onClick={() =>
                      track('Affiliate Click', { program: o.program, placement: PLACEMENT })
                    }
                  >
                    {o.cta}
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground">
              Links til Jura-Docs og Dokument 24. Skabeloner er ikke juridisk rådgivning.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PraktiskePapirer;
