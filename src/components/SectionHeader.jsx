import React from 'react';

// Section heading: a serif title with one plain sentence under it. On wide screens it sits in the
// left margin rail of the section (see `.card` in index.css); on phones it stacks above the content.
// `icon` and `tone` are accepted so older call sites keep working, but nothing decorative is drawn.
const SectionHeader = ({ title, description, level = 3 }) => {
  const Heading = `h${level}`;

  return (
    <div className="card-header">
      <Heading className="fig text-2xl leading-tight font-semibold">{title}</Heading>
      {description && <p className="mt-2 max-w-prose text-[0.9375rem] leading-relaxed text-muted-foreground">{description}</p>}
    </div>
  );
};

export default SectionHeader;
