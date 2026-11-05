import React, { useState, useEffect, useRef } from 'react';
import { estimateCover } from '../utils/insurance';
import { track } from '../utils/analytics';

const AFFILIATE_URL =
  'https://www.partner-ads.com/dk/klikbanner.php?partnerid=42553&bannerid=60068&uid=levetidsberegner';

const AFFILIATE_PROPS = { program: 'findforsikring', placement: 'result-insurance' };

// Value-first version of the life-insurance CTA: a quick, transparent cover
// estimate (income replacement over the support period), then the affiliate link
// framed around that number instead of a bare banner.
const Forsikringsbehov = ({ resultData }) => {
  const [income, setIncome] = useState('');
  const [years, setYears] = useState('10');
  const [share, setShare] = useState('');
  const [existing, setExisting] = useState('');

  const cardRef = useRef(null);

  // One impression per result, once at least half of the card is visible.
  useEffect(() => {
    const node = cardRef.current;
    if (!resultData || !node || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.5)) {
          track('Affiliate Impression', AFFILIATE_PROPS);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [resultData]);

  if (!resultData) return null;

  const inc = parseFloat(income);
  const yr = parseFloat(years);
  const sharePct = share === '' ? 100 : parseFloat(share);
  const existingCover = existing === '' ? 0 : parseFloat(existing);
  const cover = estimateCover(inc, yr, { sharePct, existingCover });
  const hasEstimate = inc > 0 && yr > 0;
  const fmt = (n) => n.toLocaleString('da-DK');

  return (
    <div className="card" ref={cardRef}>
      <div className="card-header">
        <p className="mb-2 inline-block border border-input px-2 py-0.5 text-sm text-muted-foreground">Annonce</p>
        <h3 className="fig text-2xl leading-tight font-semibold">
          Hvor meget livsforsikring har din familie brug for?
        </h3>
        <p className="mt-2 max-w-prose text-[0.9375rem] leading-relaxed text-muted-foreground">
          Et hurtigt overslag ud fra indkomst og forsørgelsesbehov, uden diskontering.
        </p>
      </div>
      <div className="card-content space-y-4">

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="ins-income" className="label">
              Årlig husstandsindkomst (kr)
            </label>
            <input
              id="ins-income"
              type="number"
              min="0"
              step="10000"
              className="input w-full"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="fx 500000"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="ins-years" className="label">
              År med forsørgeransvar
            </label>
            <input
              id="ins-years"
              type="number"
              min="0"
              max="40"
              step="1"
              className="input w-full"
              value={years}
              onChange={(e) => setYears(e.target.value)}
              placeholder="fx 10"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="ins-share" className="label">
              Den afdødes andel af indkomsten (%, valgfri)
            </label>
            <input
              id="ins-share"
              type="number"
              min="0"
              max="100"
              step="5"
              className="input w-full"
              value={share}
              onChange={(e) => setShare(e.target.value)}
              placeholder="tom = hele indkomsten"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="ins-existing" className="label">
              Eksisterende dækning (kr, valgfri)
            </label>
            <input
              id="ins-existing"
              type="number"
              min="0"
              step="100000"
              className="input w-full"
              value={existing}
              onChange={(e) => setExisting(e.target.value)}
              placeholder="fx via arbejdsgiver eller pension"
            />
          </div>
        </div>

        {hasEstimate && (
          <div className="border-l-2 border-primary pl-4">
            <div className="text-[0.9375rem] text-muted-foreground">Vejledende dækningsbehov</div>
            <div className="fig text-4xl font-semibold text-primary">
              {cover > 0 ? `~${fmt(cover)} kr` : 'Dækningen ser rigelig ud'}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Den afdødes indkomst i forsørgelsesperioden minus eksisterende dækning, uden
              diskontering. Kun et overslag.
            </div>
          </div>
        )}

        <a
          href={AFFILIATE_URL}
          target="_blank"
          rel="sponsored noopener noreferrer"
          className="btn btn-primary w-full sm:w-auto"
          onClick={() => track('Affiliate Click', AFFILIATE_PROPS)}
        >
          Sammenlign livsforsikringer{hasEstimate && cover > 0 ? ` (overslag på dækningsbehov: ~${fmt(cover)} kr)` : ''}
        </a>
        <p className="text-sm text-muted-foreground">
          Annonce fra Findforsikring.dk. Overslaget er vejledende og ikke rådgivning.
        </p>
      </div>
    </div>
  );
};

export default Forsikringsbehov;
