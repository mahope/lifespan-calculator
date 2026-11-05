import React from 'react';
import SectionHeader from './SectionHeader';
import { topImprovements } from '../utils/lifestyleFactors';
import { formatSignedYears } from '../utils/lifespanMath';

// "Sådan kan du vinde flere år" — ranks the changes that would lift this user's
// estimate most, with a citation where the effect size is grounded in research.
const Coaching = ({ lifestyleFactors }) => {
  if (!lifestyleFactors) return null;
  const items = topImprovements(lifestyleFactors);
  if (!items.length) return null;

  return (
    <div className="card">
      <SectionHeader
        title="Sådan kan du vinde flere år"
        description="Livsstilsændringer, der kan give dig flere leveår."
      />
      <div className="card-content">
        <ul className="divide-y">
          {items.map((i) => (
            <li key={i.key} className="flex items-baseline gap-4 py-3 first:pt-0">
              <div className="min-w-0 flex-1">
                <div className="font-medium">{i.label}</div>
                {i.cite && (
                  <a
                    href={i.cite.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground underline hover:text-primary"
                  >
                    Kilde: {i.cite.text}
                  </a>
                )}
              </div>
              <div className="fig text-xl font-semibold text-primary">
                {formatSignedYears(i.gain)}
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 max-w-prose text-sm text-muted-foreground">
          Illustrativt — de enkelte effekter overlapper og indgår samlet begrænset i estimatet.
        </p>
      </div>
    </div>
  );
};

export default Coaching;
