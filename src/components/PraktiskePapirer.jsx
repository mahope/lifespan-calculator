import React, { useState, useEffect, useRef } from 'react';
import { FileText, ChevronDown } from 'lucide-react';
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

const isDesktop = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(min-width: 640px)').matches;

// Calm, clearly marked pointer to document templates. Collapsed by default on
// mobile. Events carry only the programme and placement, never user input.
const PraktiskePapirer = ({ resultData }) => {
  const [open, setOpen] = useState(isDesktop);
  const listRef = useRef(null);

  // One impression per programme per result, once the links are at least half visible.
  useEffect(() => {
    const node = listRef.current;
    if (!resultData || !open || !node || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.5)) {
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
      <div className="card-content space-y-3 py-5">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Annonce</div>
        <button
          type="button"
          className="flex w-full items-center gap-3 text-left"
          aria-expanded={open}
          aria-controls="praktiske-papirer-indhold"
          onClick={() => setOpen((v) => !v)}
        >
          <span
            className="inline-grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"
            aria-hidden="true"
          >
            <FileText size={20} strokeWidth={2} />
          </span>
          <span className="flex-1 text-base font-semibold">Få styr på det praktiske</span>
          <ChevronDown
            size={18}
            aria-hidden="true"
            className={`shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {open && (
          <div id="praktiske-papirer-indhold" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Uanset hvor mange år du har tilbage, kan det være rart at have de praktiske papirer
              i orden.
            </p>
            <ul ref={listRef} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {OFFERS.map((o) => (
                <li key={o.program} className="flex flex-col gap-2 rounded-lg bg-muted/30 p-4">
                  <h3 className="text-sm font-semibold">{o.title}</h3>
                  <p className="flex-1 text-sm text-muted-foreground">{o.text}</p>
                  <a
                    href={partnerUrl(o.bannerId)}
                    target="_blank"
                    rel="sponsored noopener noreferrer"
                    className="btn btn-secondary w-full"
                    onClick={() =>
                      track('Affiliate Click', { program: o.program, placement: PLACEMENT })
                    }
                  >
                    {o.cta} →
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-center text-[11px] text-muted-foreground">
              Annonce · Links til Jura-Docs og Dokument 24. Skabeloner er ikke juridisk rådgivning.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PraktiskePapirer;
