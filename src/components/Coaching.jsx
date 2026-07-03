import React from 'react';
import { topImprovements } from '../utils/lifestyleFactors';

// "Sådan kan du vinde flere år" — ranks the changes that would lift this user's
// estimate most, with a citation where the effect size is grounded in research.
const Coaching = ({ lifestyleFactors }) => {
  if (!lifestyleFactors) return null;
  const items = topImprovements(lifestyleFactors);
  if (!items.length) return null;

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold">🌱 Sådan kan du vinde flere år</h3>
        <p className="card-description">De ændringer, der ville løfte dit estimat mest.</p>
      </div>
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
                  <a
                    href={i.cite.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground underline hover:text-primary"
                  >
                    Kilde: {i.cite.text}
                  </a>
                )}
              </div>
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                +{i.gain} år
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Illustrativt — de enkelte effekter overlapper og indgår samlet begrænset i estimatet.
        </p>
      </div>
    </div>
  );
};

export default Coaching;
