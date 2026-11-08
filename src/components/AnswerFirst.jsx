import React from 'react';

// Short, quotable answer directly under the H1 of a landing page, with a descriptive link
// to the calculator. `text` comes from utils/answerFirst.js (computed from LIFE_TABLE_DK).
const AnswerFirst = ({ text, linkText }) => (
  <section aria-label="Kort svar" className="card border-primary/20 bg-primary/5">
    <div className="card-content space-y-2">
      <p data-answer-first className="leading-relaxed text-foreground">{text}</p>
      <p className="text-sm">
        <a href="/" className="text-primary underline">{linkText}</a>
      </p>
    </div>
  </section>
);

export default AnswerFirst;
