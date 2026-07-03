import React from 'react';

// Standard card header: a tinted "icon chip" holding a real (lucide) icon next to
// the title/description. Replaces the emoji-in-heading pattern across the app.
const SectionHeader = ({ icon: Icon, title, description, tone = 'primary', level = 3 }) => {
  const Heading = `h${level}`;
  const tones = {
    primary: 'bg-primary/10 text-primary',
    green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  };

  return (
    <div className="card-header">
      <div className="flex items-center gap-3">
        {Icon && (
          <span
            className={`inline-grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
              tones[tone] || tones.primary
            }`}
            aria-hidden="true"
          >
            <Icon size={20} strokeWidth={2} />
          </span>
        )}
        <div className="min-w-0">
          <Heading className="text-base font-semibold leading-tight sm:text-lg">{title}</Heading>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
    </div>
  );
};

export default SectionHeader;
