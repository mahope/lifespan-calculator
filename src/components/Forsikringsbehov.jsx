import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { estimateCover } from '../utils/insurance';

const AFFILIATE_URL =
  'https://www.partner-ads.com/dk/klikbanner.php?partnerid=42553&bannerid=60068&uid=levetidsberegner';

// Value-first version of the life-insurance CTA: a quick, transparent cover
// estimate (income replacement over the support period), then the affiliate link
// framed around that number instead of a bare banner.
const Forsikringsbehov = ({ resultData }) => {
  const [income, setIncome] = useState('');
  const [years, setYears] = useState('10');
  const [share, setShare] = useState('');
  const [existing, setExisting] = useState('');

  if (!resultData) return null;

  const inc = parseFloat(income);
  const yr = parseFloat(years);
  const sharePct = share === '' ? 100 : parseFloat(share);
  const existingCover = existing === '' ? 0 : parseFloat(existing);
  const cover = estimateCover(inc, yr, { sharePct, existingCover });
  const hasEstimate = inc > 0 && yr > 0;
  const fmt = (n) => n.toLocaleString('da-DK');

  return (
    <div className="card">
      <div className="card-content space-y-4 py-5">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Annonce · værktøj
        </div>
        <div className="flex items-start gap-3">
          <span
            className="inline-grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"
            aria-hidden="true"
          >
            <ShieldCheck size={20} strokeWidth={2} />
          </span>
          <div className="flex-1">
            <h3 className="mb-1 text-base font-semibold">
              Hvor meget livsforsikring har din familie brug for?
            </h3>
            <p className="text-sm text-muted-foreground">
              Et hurtigt overslag ud fra indkomst og forsørgelsesbehov, uden diskontering.
            </p>
          </div>
        </div>

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
          <div className="rounded-lg bg-muted/30 p-4 text-center">
            <div className="text-sm text-muted-foreground">Vejledende dækningsbehov</div>
            <div className="text-3xl font-bold text-primary">
              {cover > 0 ? `~${fmt(cover)} kr` : 'Dækningen ser rigelig ud'}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Den afdødes indkomst i forsørgelsesperioden minus eksisterende dækning, uden
              diskontering. Kun et overslag.
            </div>
          </div>
        )}

        <a
          href={AFFILIATE_URL}
          target="_blank"
          rel="sponsored noopener noreferrer"
          className="btn btn-primary w-full"
        >
          Sammenlign livsforsikringer{hasEstimate && cover > 0 ? ` (overslag på dækningsbehov: ~${fmt(cover)} kr)` : ''} →
        </a>
        <p className="text-center text-[11px] text-muted-foreground">
          Annonce · Findforsikring.dk. Overslaget er vejledende og ikke rådgivning.
        </p>
      </div>
    </div>
  );
};

export default Forsikringsbehov;
