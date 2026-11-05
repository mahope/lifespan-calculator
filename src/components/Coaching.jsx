import React from 'react';
import { Sprout } from 'lucide-react';
import SectionHeader from './SectionHeader';
import { topImprovements } from '../utils/lifestyleFactors';

// "Sådan kan du vinde flere år" — ranks the changes that would lift this user's
// estimate most, with a citation where the effect size is grounded in research.
const Coaching = ({ lifestyleFactors }) => {
  if (!lifestyleFactors) return null;
  const items = topImprovements(lifestyleFactors);
  if (!items.length) return null;

  return (
    <div className="card">
      <SectionHeader
        icon={Sprout}
        tone="green"
        title="Sådan kan du vinde flere år"
        description="Livsstilsændringer, der kan give dig flere leveår."
      />
      <div className="card-content">
        <ul className="divide-y divide-border/60">
          {items.map((i) => (
            <li key={i.key} className="flex items-center gap-3 py-3">
              <span className="text-2xl" aria-hidden="true">
                {i.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{i.label}</div>
                {i.cite && (
                  <>
                    <a
                      href={i.cite.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground underline hover:text-primary"
                    >
                      Kilde: {i.cite.text}
                    </a>
                    {i.figure && <p className="text-xs text-muted-foreground">I kilden: {i.figure}</p>}
                  </>
                )}
              </div>
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                +{i.gain} år
                <div className="text-right text-[11px] font-normal text-muted-foreground">i dette estimat</div>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Illustrativt: tallene i estimatet er vejledende og kan afvige fra kildens egne tal. De enkelte effekter overlapper og er statistiske sammenhænge.
        </p>
      </div>
    </div>
  );
};

export default Coaching;
